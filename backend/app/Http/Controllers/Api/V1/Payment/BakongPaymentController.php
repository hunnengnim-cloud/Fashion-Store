<?php

namespace App\Http\Controllers\Api\V1\Payment;

use App\Http\Controllers\Controller;
use App\Services\BakongService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BakongPaymentController extends Controller
{
    public function __construct(
        protected BakongService $bakongService
    ) {}

    /**
     * Generate Bakong KHQR for checkout.
     */
    public function generateQr(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01'],
            'currency' => ['sometimes', 'string', 'in:USD,KHR,usd,khr'],
            'bill_number' => ['nullable', 'string', 'max:50'],
            'store_label' => ['nullable', 'string', 'max:50'],
        ]);

        $currency = strtoupper($validated['currency'] ?? 'USD');
        $amount = (float) $validated['amount'];
        $billNumber = $validated['bill_number'] ?? null;
        $storeLabel = $validated['store_label'] ?? 'Fashion Store KH';

        $khqrData = $this->bakongService->generateKhqr(
            amount: $amount,
            currency: $currency,
            billNumber: $billNumber,
            storeLabel: $storeLabel
        );

        $khqrData['qr'] = $khqrData['qr_string'];
        $khqrData['qr_image'] = $khqrData['qr_image_url'];

        return response()->json([
            'status' => 'success',
            'data' => $khqrData,
            'qr' => $khqrData['qr_string'],
            'qr_image' => $khqrData['qr_image_url'],
            'qr_image_url' => $khqrData['qr_image_url'],
            'md5' => $khqrData['md5'],
        ]);
    }

    /**
     * Check transaction status by MD5 hash with Bakong Open API.
     */
    public function checkTransaction(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'md5' => ['required', 'string', 'size:32'],
        ]);

        $result = $this->bakongService->checkTransaction($validated['md5']);

        return response()->json([
            'status' => 'success',
            'data' => $result,
        ]);
    }

    /**
     * Get Bakong Gateway information & status.
     */
    public function gatewayInfo(): JsonResponse
    {
        $info = $this->bakongService->getGatewayInfo();

        return response()->json([
            'status' => 'success',
            'data' => $info,
        ]);
    }
}
