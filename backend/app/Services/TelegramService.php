<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramService
{
    protected string $botToken;

    protected string $chatId;

    protected string $botUsername;

    public function __construct()
    {
        $this->botToken = (string) config('services.telegram.bot_token', '8914044934:AAHYn5I5loQlw7L0CQv-TNbU5I8GdIkq2w8');
        $this->chatId = (string) config('services.telegram.chat_id', '8039165243');
        $this->botUsername = (string) config('services.telegram.bot_username', 'ClothingOnlineShop_bot');
    }

    /**
     * Send an order receipt to the configured Telegram chat.
     */
    public function sendOrderReceipt(array $order): array
    {
        $chatId = $this->resolveChatId();

        if (! $chatId) {
            Log::warning('Telegram: No chat_id found for order receipt notification.');

            return [
                'ok' => false,
                'message' => 'No chat_id configured or found.',
            ];
        }

        $message = $this->buildReceiptMessage($order);

        try {
            $response = Http::timeout(10)->post("https://api.telegram.org/bot{$this->botToken}/sendMessage", [
                'chat_id' => $chatId,
                'text' => $message,
                'parse_mode' => 'HTML',
                'disable_web_page_preview' => false,
            ]);

            if ($response->successful() && $response->json('ok')) {
                Log::info("Telegram: Order receipt sent successfully for order {$order['id']} to chat {$chatId}");

                return [
                    'ok' => true,
                    'chat_id' => $chatId,
                    'message_id' => $response->json('result.message_id'),
                ];
            }

            Log::error('Telegram API error: '.$response->body());

            return [
                'ok' => false,
                'error' => $response->json('description', 'Unknown error'),
            ];
        } catch (\Throwable $e) {
            Log::error('Telegram send exception: '.$e->getMessage());

            return [
                'ok' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Build the luxury formatted HTML receipt message.
     */
    protected function buildReceiptMessage(array $order): string
    {
        $orderId = htmlspecialchars($order['id'] ?? 'CS-'.date('YmdHis'), ENT_QUOTES, 'UTF-8');
        $date = htmlspecialchars($order['date'] ?? date('M d, Y, h:i A'), ENT_QUOTES, 'UTF-8');
        $name = htmlspecialchars($order['name'] ?? 'Valued Customer', ENT_QUOTES, 'UTF-8');
        $phone = htmlspecialchars($order['phone'] ?? 'N/A', ENT_QUOTES, 'UTF-8');
        $address = htmlspecialchars($order['address'] ?? 'Phnom Penh, Cambodia', ENT_QUOTES, 'UTF-8');
        $payment = htmlspecialchars($order['payment'] ?? 'Bakong KHQR', ENT_QUOTES, 'UTF-8');
        $status = htmlspecialchars($order['status'] ?? 'Processing', ENT_QUOTES, 'UTF-8');

        $totalUsd = (float) ($order['total'] ?? 0);
        $totalKhr = (int) ($order['khr_total'] ?? round($totalUsd * 4100));

        $formattedUsd = '$'.number_format($totalUsd, 2);
        $formattedKhr = number_format($totalKhr).' ៛';

        // Build item rows
        $itemsText = '';
        $items = $order['items'] ?? [];
        if (! empty($items) && is_array($items)) {
            foreach ($items as $item) {
                $itemName = htmlspecialchars($item['name'] ?? 'Item', ENT_QUOTES, 'UTF-8');
                $qty = (int) ($item['qty'] ?? 1);
                $price = (float) ($item['sale_price'] ?? $item['price'] ?? 0);
                $itemTotal = '$'.number_format($price * $qty, 2);
                $size = ! empty($item['size']) ? ' · Size: '.htmlspecialchars($item['size'], ENT_QUOTES, 'UTF-8') : '';
                $color = ! empty($item['color']) ? ' · '.htmlspecialchars($item['color'], ENT_QUOTES, 'UTF-8') : '';

                $itemsText .= "• <b>{$itemName}</b>{$size}{$color}\n";
                $itemsText .= "   {$qty} × $".number_format($price, 2)." = <b>{$itemTotal}</b>\n";
            }
        } else {
            $itemsText = "• Standard Apparel Item — <b>{$formattedUsd}</b>\n";
        }

        $paymentIcon = str_contains(strtolower($payment), 'bakong') ? '🇰🇭' : '💵';
        $statusIcon = str_contains(strtolower($status), 'paid') || str_contains(strtolower($payment), 'bakong') ? '✅' : '⏳';

        return "🛍️ <b>NEW ORDER RECEIPT — FASHION STORE</b>\n"
             ."━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
             ."📦 <b>Order ID:</b> <code>#{$orderId}</code>\n"
             ."📅 <b>Date:</b> {$date}\n"
             ."👤 <b>Customer:</b> {$name}\n"
             ."📞 <b>Phone:</b> <code>{$phone}</code>\n"
             ."📍 <b>Shipping Address:</b> {$address}\n\n"
             ."🛒 <b>PURCHASED ITEMS:</b>\n"
             ."{$itemsText}"
             ."━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
             ."💵 <b>Subtotal:</b> {$formattedUsd}\n"
             ."🚚 <b>Shipping:</b> <b>FREE (Express Delivery)</b>\n"
             ."💰 <b>TOTAL PAID:</b> <b>{$formattedUsd} USD</b>\n"
             ."🇰🇭 <b>In Riel:</b> <b>{$formattedKhr}</b>\n"
             ."{$paymentIcon} <b>Payment:</b> {$payment}\n"
             ."{$statusIcon} <b>Order Status:</b> <b>{$status}</b>\n"
             ."━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
             ."✨ <i>Thank you for your purchase with Fashion Store!</i>\n"
             ."🤖 <b>Bot:</b> @{$this->botUsername}";
    }

    /**
     * Resolve chat ID from config or Telegram getUpdates.
     */
    protected function resolveChatId(): ?string
    {
        if (! empty($this->chatId)) {
            return $this->chatId;
        }

        try {
            $res = Http::timeout(5)->get("https://api.telegram.org/bot{$this->botToken}/getUpdates");
            if ($res->successful()) {
                $updates = $res->json('result', []);
                if (! empty($updates)) {
                    $last = end($updates);
                    $found = $last['message']['chat']['id']
                        ?? $last['channel_post']['chat']['id']
                        ?? $last['my_chat_member']['chat']['id']
                        ?? null;
                    if ($found) {
                        return (string) $found;
                    }
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Telegram resolveChatId: '.$e->getMessage());
        }

        return null;
    }
}
