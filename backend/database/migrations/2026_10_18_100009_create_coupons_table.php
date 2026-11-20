<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coupons', function (Blueprint $table) {
            $table->id();
            $table->string('code', 50)->unique();
            $table->string('description_en', 255)->nullable();
            $table->string('description_km', 255)->nullable();
            $table->enum('discount_type', ['percentage', 'fixed_amount']); // % or USD
            $table->decimal('discount_value', 10, 2);
            $table->decimal('minimum_order_amount', 15, 2)->default(0);
            $table->decimal('maximum_discount_amount', 15, 2)->nullable(); // cap for percentage
            $table->unsignedInteger('usage_limit')->nullable();            // null = unlimited
            $table->unsignedInteger('usage_limit_per_user')->default(1);
            $table->unsignedInteger('times_used')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->index('code');
            $table->index('is_active');
            $table->index('expires_at');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('coupons');
    }
};
