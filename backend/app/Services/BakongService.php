<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class BakongService
{
    protected string $apiUrl;

    protected string $accountId;

    protected string $merchantName;

    protected string $token;

    public function __construct()
    {
        $this->apiUrl = config('services.bakong.api_url', 'https://api-bakong.nbc.gov.kh');
        $this->accountId = config('services.bakong.account_id', 'huonneng_nim@bkrt');
        $this->merchantName = config('services.bakong.merchant_name', 'Huonneng Nim');
        $this->token = (string) config('services.bakong.token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJkYXRhIjp7ImlkIjoiN2UxODg5OWZkMzA5NDM2MiJ9LCJpYXQiOjE3OTI1NzgyODQsImV4cCI6MTgwMDM1NDI4NH0.rxrik-U21yWij0k5XmzkzeEJP8srNh8wzPYPQGS6_IM');
    }

    /**
     * Generate an EMVCo compliant Bakong KHQR string.
     *
     * @return array{
     *     account_id: string,
     *     merchant_name: string,
     *     currency: string,
     *     amount: float,
     *     qr_string: string,
     *     md5: string,
     *     qr_image_url: string,
     *     bill_number: string
     * }
     */
    public function generateKhqr(
        float $amount,
        string $currency = 'USD',
        ?string $billNumber = null,
        ?string $storeLabel = 'Fashion Store KH'
    ): array {
        $billNo = $billNumber ?: 'ORD-'.date('YmdHis').'-'.str_pad((string) rand(1, 999), 3, '0', STR_PAD_LEFT);
        $currUpper = strtoupper($currency);
        $currCode = ($currUpper === 'KHR') ? '116' : '840';
        $formattedAmount = ($currUpper === 'KHR')
            ? (string) round($amount)
            : number_format($amount, 2, '.', '');

        // Tag 29: Merchant Account Information (Individual / Solo Merchant)
        // Sub-tag 00: Globally Unique Identifier (Bakong Account ID)
        $sub00 = $this->formatTlv('00', $this->accountId);
        $tag29 = $this->formatTlv('29', $sub00);

        // Tag 62: Additional Data Template
        $subBill = $this->formatTlv('01', substr($billNo, 0, 25));
        $subStore = $this->formatTlv('03', substr($storeLabel ?: 'Fashion Store', 0, 25));
        $tag62 = $this->formatTlv('62', $subBill.$subStore);

        // Tag 99: Custom Timestamp Template (Mandatory for Dynamic QR Tag 01=12 & Amount scanning)
        // Sub-tag 00: Creation timestamp in milliseconds (13 digits)
        // Sub-tag 01: Expiration timestamp in milliseconds (13 digits, 30 minutes validity)
        $nowMs = (string) (int) round(microtime(true) * 1000);
        $expMs = (string) ((int) round(microtime(true) * 1000) + (30 * 60 * 1000));
        $subCreated = $this->formatTlv('00', $nowMs);
        $subExpired = $this->formatTlv('01', $expMs);
        $tag99 = $this->formatTlv('99', $subCreated.$subExpired);

        // Assemble KHQR payload in strict ascending tag order according to NBC EMVCo spec:
        // 00 -> 01 -> 29 -> 52 -> 53 -> 54 -> 58 -> 59 -> 60 -> 62 -> 99 -> 63
        $payload =
            $this->formatTlv('00', '01'). // 00: Payload Format Indicator (01)
            $this->formatTlv('01', '12'). // 01: Dynamic QR (Point of Initiation Method)
            $tag29.                       // 29: Individual Account Info
            $this->formatTlv('52', '5999'). // 52: Merchant Category Code (5999 for general/individual)
            $this->formatTlv('53', $currCode). // 53: Currency (840 for USD, 116 for KHR)
            $this->formatTlv('54', $formattedAmount). // 54: Amount
            $this->formatTlv('58', 'KH'). // 58: Country Code
            $this->formatTlv('59', substr($this->merchantName, 0, 25)). // 59: Merchant Name
            $this->formatTlv('60', 'Phnom Penh'). // 60: Merchant City
            $tag62.                       // 62: Additional Data (Bill Number & Store Label)
            $tag99.                       // 99: Mandatory Expiration & Creation Timestamp
            '6304';                       // 63: CRC-16 Checksum Tag Prefix

        $crc = $this->computeCrc16Ccitt($payload);
        $fullQrString = $payload.$crc;
        $md5 = md5($fullQrString);

        // High resolution QR code image with Error Correction Level M (15%) for robust scanning
        $encodedQr = urlencode($fullQrString);
        $qrImageUrl = "https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=10&ecc=M&data={$encodedQr}";

        return [
            'account_id' => $this->accountId,
            'merchant_name' => $this->merchantName,
            'currency' => $currUpper,
            'amount' => (float) $formattedAmount,
            'qr_string' => $fullQrString,
            'md5' => $md5,
            'qr_image_url' => $qrImageUrl,
            'bill_number' => $billNo,
        ];
    }

    /**
     * Check transaction status with Bakong Open API.
     *
     * @return array{
     *     paid: bool,
     *     status: string,
     *     message: string,
     *     response_code: int|null,
     *     data: array|null
     * }
     */
    public function checkTransaction(string $md5): array
    {
        $url = rtrim($this->apiUrl, '/').'/v1/check_transaction_by_md5';

        try {
            $response = Http::withHeaders([
                'Authorization' => 'Bearer '.$this->token,
                'Content-Type' => 'application/json',
            ])->timeout(5)->post($url, [
                'md5' => $md5,
            ]);

            if ($response->successful()) {
                $body = $response->json();
                $respCode = $body['responseCode'] ?? null;
                $isPaid = ($respCode === 0);

                return [
                    'paid' => $isPaid,
                    'status' => $isPaid ? 'paid' : 'pending',
                    'message' => $body['responseMessage'] ?? ($isPaid ? 'Payment received successfully' : 'Transaction pending'),
                    'response_code' => $respCode,
                    'data' => $body['data'] ?? null,
                ];
            }

            return [
                'paid' => false,
                'status' => 'pending',
                'message' => 'Pending scan or customer confirmation in Bakong app',
                'response_code' => $response->status(),
                'data' => null,
            ];
        } catch (\Throwable $e) {
            Log::info('Bakong transaction check note: '.$e->getMessage());

            return [
                'paid' => false,
                'status' => 'pending',
                'message' => 'Waiting for customer to scan KHQR with Bakong / bank app',
                'response_code' => null,
                'data' => null,
            ];
        }
    }

    /**
     * Get masked gateway info for admin panel.
     */
    public function getGatewayInfo(): array
    {
        $maskedToken = strlen($this->token) > 8
            ? substr($this->token, 0, 4).'••••••••'.substr($this->token, -4)
            : '••••••••';

        return [
            'gateway' => 'Bakong KHQR Open API',
            'account_id' => $this->accountId,
            'merchant_name' => $this->merchantName,
            'api_url' => $this->apiUrl,
            'token_masked' => $maskedToken,
            'status' => 'active',
            'supported_banks' => ['Bakong App', 'ABA Mobile', 'Wing Bank', 'ACLEDA Mobile', 'Sathapana Bank', 'Canadia Bank', 'Prince Bank'],
        ];
    }

    /**
     * Compute CRC-16/CCITT checksum (Polynomial: 0x1021, Initial: 0xFFFF).
     */
    protected function computeCrc16Ccitt(string $str): string
    {
        $crc = 0xFFFF;
        $len = strlen($str);

        for ($i = 0; $i < $len; $i++) {
            $crc ^= (ord($str[$i]) << 8);
            for ($j = 0; $j < 8; $j++) {
                if ($crc & 0x8000) {
                    $crc = (($crc << 1) ^ 0x1021) & 0xFFFF;
                } else {
                    $crc = ($crc << 1) & 0xFFFF;
                }
            }
        }

        return strtoupper(str_pad(dechex($crc), 4, '0', STR_PAD_LEFT));
    }

    /**
     * Format a Tag-Length-Value string.
     */
    protected function formatTlv(string $tag, string $value): string
    {
        $len = str_pad((string) strlen($value), 2, '0', STR_PAD_LEFT);

        return $tag.$len.$value;
    }

    /**
     * Resolve acquiring bank name from Bakong account ID suffix.
     */
    protected function resolveBankName(string $accountId): string
    {
        $domain = strtolower(substr(strrchr($accountId, '@') ?: '', 1));

        return match ($domain) {
            'abaa' => 'ABA Bank',
            'aclb' => 'ACLEDA Bank',
            'wing' => 'Wing Bank',
            'canb' => 'Canadia Bank',
            'sath' => 'Sathapana Bank',
            'ftbc' => 'FTB Bank',
            'prnc' => 'Prince Bank',
            'cpbk' => 'Chip Mong Bank',
            'vrec' => 'Vattanac Bank',
            'bkrt' => 'Bakong',
            'bakong' => 'Bakong',
            'devb' => 'Dev Bank',
            default => 'Bakong',
        };
    }
}
