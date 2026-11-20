<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('order_number', 30)->unique();  // e.g. ORD-20261018-0001
            $table->foreignId('user_id')->constrained()->restrictOnDelete();
            $table->foreignId('coupon_id')->nullable()->constrained()->nullOnDelete();

            // Shipping snapshot (copied at checkout, not a FK)
            $table->string('shipping_recipient', 150);
            $table->string('shipping_phone', 20);
            $table->string('shipping_address_line1', 255);
            $table->string('shipping_address_line2', 255)->nullable();
            $table->string('shipping_city', 100);
            $table->string('shipping_province', 100);
            $table->string('shipping_country', 100)->default('Cambodia');
            $table->string('shipping_postal_code', 20)->nullable();

            // Shipping method & courier
            $table->string('shipping_method', 100)->nullable();  // e.g. Standard, Express
            $table->string('shipping_provider', 100)->nullable(); // e.g. J&T, Kerry
            $table->string('tracking_number', 100)->nullable();

            // Amounts (all USD; KHR stored for display)
            $table->decimal('subtotal', 15, 2);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('shipping_fee', 15, 2)->default(0);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2);
            $table->string('currency', 3)->default('USD');
            $table->decimal('khr_total', 15, 2)->nullable();  // display only
            $table->decimal('usd_to_khr_rate', 10, 2)->nullable(); // rate at checkout

            // Status
            $table->enum('fulfillment_status', [
                'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled',
            ])->default('pending');

            $table->enum('payment_status', [
                'unpaid', 'pending_payment', 'paid', 'failed', 'refunded',
            ])->default('unpaid');

            $table->string('cancellation_reason', 500)->nullable();
            $table->text('notes')->nullable();  // customer notes
            $table->text('admin_notes')->nullable();

            $table->timestamp('confirmed_at')->nullable();
            $table->timestamp('shipped_at')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();

            $table->timestamps();
            $table->softDeletes();

            $table->index('user_id');
            $table->index('order_number');
            $table->index('fulfillment_status');
            $table->index('payment_status');
            $table->index('created_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
