<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('inventory_movements', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_variant_id')->constrained('product_variants')->cascadeOnDelete();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete(); // admin who made change

            $table->enum('type', [
                'purchase',       // stock added via purchase/restock
                'sale',           // stock reduced when order confirmed
                'return',         // stock returned when order cancelled/refunded
                'adjustment',     // manual admin correction
                'damage',         // write-off
            ]);

            $table->integer('quantity_change');   // positive = in, negative = out
            $table->unsignedInteger('stock_before');
            $table->unsignedInteger('stock_after');
            $table->string('reference', 100)->nullable();  // PO number, order number, etc.
            $table->text('notes')->nullable();
            $table->timestamp('moved_at')->useCurrent();
            $table->timestamps();

            $table->index('product_variant_id');
            $table->index('type');
            $table->index('moved_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_movements');
    }
};
