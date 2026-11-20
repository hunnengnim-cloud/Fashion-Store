<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('transaction_id', 200)->nullable()->unique(); // gateway tx ID
            $table->string('bakong_md5', 255)->nullable();               // Bakong MD5 hash
            $table->string('bakong_qr_string', 1000)->nullable();        // KHQR string

            $table->enum('payment_method', [
                'cod',           // Cash on Delivery
                'bakong_khqr',   // Bakong KHQR scan
                'bakong_transfer', // Direct bank transfer via Bakong
            ])->default('cod');

            $table->enum('status', [
                'pending', 'processing', 'paid', 'failed', 'refunded', 'cancelled',
            ])->default('pending');

            $table->decimal('amount', 15, 2);
            $table->string('currency', 3)->default('USD');
            $table->decimal('khr_amount', 15, 2)->nullable();

            $table->json('gateway_response')->nullable();  // raw response from Bakong
            $table->string('failure_reason', 500)->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('refunded_at')->nullable();

            $table->timestamps();

            $table->index('order_id');
            $table->index('transaction_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
