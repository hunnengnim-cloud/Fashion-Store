<?php

namespace Tests\Feature;

use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class BakongPaymentTest extends TestCase
{
    /**
     * Test Bakong KHQR gateway info endpoint.
     */
    public function test_can_retrieve_bakong_gateway_info(): void
    {
        $response = $this->getJson('/api/v1/payment/bakong/info');

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'account_id' => 'huonneng_nim@bkrt',
                    'merchant_name' => 'Huonneng Nim',
                    'status' => 'active',
                ],
            ]);
    }

    /**
     * Test generating Bakong KHQR for an order.
     */
    public function test_can_generate_bakong_khqr(): void
    {
        $response = $this->postJson('/api/v1/payment/bakong/qr', [
            'amount' => 45.00,
            'currency' => 'USD',
            'bill_number' => 'ORD-TEST-101',
            'store_label' => 'Fashion Store KH',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'account_id' => 'huonneng_nim@bkrt',
                    'currency' => 'USD',
                    'amount' => 45.00,
                    'bill_number' => 'ORD-TEST-101',
                ],
            ]);

        $qrData = $response->json('data');
        $this->assertNotEmpty($qrData['qr_string']);
        $this->assertNotEmpty($qrData['md5']);
        $this->assertStringContainsString('huonneng_nim@bkrt', $qrData['qr_string']);
    }

    /**
     * Test checking Bakong transaction status.
     */
    public function test_can_check_bakong_transaction_status(): void
    {
        Http::fake([
            'api-bakong.nbc.gov.kh/*' => Http::response([
                'responseCode' => 0,
                'responseMessage' => 'Success',
                'data' => [
                    'hash' => '4c4a8c4173ac47e0a1e84c4a8c4173ac',
                    'fromAccountId' => 'customer@bkrt',
                    'toAccountId' => 'huonneng_nim@bkrt',
                    'amount' => 45.0,
                    'currency' => 'USD',
                ],
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/payment/bakong/check', [
            'md5' => '4c4a8c4173ac47e0a1e84c4a8c4173ac',
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'status' => 'success',
                'data' => [
                    'paid' => true,
                    'status' => 'paid',
                ],
            ]);
    }
}
