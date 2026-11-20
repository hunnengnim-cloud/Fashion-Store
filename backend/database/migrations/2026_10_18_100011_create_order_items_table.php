<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->foreignId('product_variant_id')->constrained('product_variants')->restrictOnDelete();

            // ── Historical snapshots ──────────────────────────────────────
            // These are copied at checkout so future product edits don't
            // change what the customer ordered or what the invoice shows.
            $table->string('product_name_en', 255);
            $table->string('product_name_km', 255);
            $table->string('product_sku', 100);
            $table->string('size_label', 20)->nullable();
            $table->string('size_value', 20)->nullable();
            $table->string('color_name_en', 50)->nullable();
            $table->string('color_name_km', 50)->nullable();
            $table->string('color_hex', 7)->nullable();
            $table->string('product_image', 500)->nullable();  // primary image path

            // Pricing snapshot
            $table->decimal('unit_price', 15, 2);     // price per item at checkout
            $table->decimal('sale_price', 15, 2)->nullable();
            $table->decimal('final_price', 15, 2);    // actual price charged per item
            $table->unsignedInteger('quantity');
            $table->decimal('line_total', 15, 2);      // final_price * quantity

            $table->timestamps();

            $table->index('order_id');
            $table->index('product_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
