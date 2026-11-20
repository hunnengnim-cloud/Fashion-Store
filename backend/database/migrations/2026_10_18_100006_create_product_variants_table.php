<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('product_variants', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();

            // Size — supports both label-based (S/M/L) and numeric (28/30/38)
            $table->string('size_label', 20)->nullable();       // XS, S, M, L, XL, XXL
            $table->string('size_value', 20)->nullable();       // 28, 30, 38, 39, 40 (numeric)
            $table->enum('size_type', ['label', 'numeric'])->default('label');

            // Color
            $table->string('color_name_en', 50)->nullable();
            $table->string('color_name_km', 50)->nullable();
            $table->string('color_hex', 7)->nullable();         // e.g. #FF0000

            // Variant identity
            $table->string('sku', 100)->unique();
            $table->decimal('price_override', 15, 2)->nullable(); // null = use product base_price
            $table->decimal('sale_price_override', 15, 2)->nullable();

            // Inventory
            $table->unsignedInteger('stock_quantity')->default(0);
            $table->unsignedInteger('low_stock_threshold')->default(5);

            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('product_id');
            $table->index('sku');
            $table->index(['product_id', 'size_label', 'color_name_en']);
            $table->index('stock_quantity');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_variants');
    }
};
