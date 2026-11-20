<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shipments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('courier_name', 100)->nullable();    // J&T, Kerry, DHL
            $table->string('tracking_number', 100)->nullable();
            $table->string('tracking_url', 500)->nullable();
            $table->decimal('shipping_cost', 15, 2)->default(0);
            $table->string('currency', 3)->default('USD');

            $table->enum('status', [
                'pending', 'picked_up', 'in_transit', 'out_for_delivery',
                'delivered', 'failed_delivery', 'returned',
            ])->default('pending');

            $table->json('courier_response')->nullable();  // raw API response
            $table->json('tracking_events')->nullable();   // array of tracking checkpoints

            $table->timestamp('estimated_delivery_at')->nullable();
            $table->timestamp('delivered_at')->nullable();

            $table->timestamps();

            $table->index('order_id');
            $table->index('tracking_number');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shipments');
    }
};
