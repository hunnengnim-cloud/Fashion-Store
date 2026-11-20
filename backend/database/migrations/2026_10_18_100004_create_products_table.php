<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->restrictOnDelete();
            $table->foreignId('brand_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name_en', 255);
            $table->string('name_km', 255);
            $table->string('slug', 280)->unique();
            $table->text('description_en')->nullable();
            $table->text('description_km')->nullable();
            $table->string('material', 150)->nullable();       // e.g. 100% Cotton
            $table->decimal('base_price', 15, 2);              // USD
            $table->decimal('sale_price', 15, 2)->nullable();  // USD, null = no discount
            $table->string('currency', 3)->default('USD');
            $table->boolean('is_featured')->default(false);
            $table->boolean('is_active')->default(true);
            $table->unsignedBigInteger('total_sold')->default(0);
            $table->unsignedBigInteger('total_views')->default(0);
            $table->decimal('average_rating', 3, 2)->default(0.00);
            $table->unsignedInteger('review_count')->default(0);
            $table->timestamps();
            $table->softDeletes();

            $table->index('category_id');
            $table->index('brand_id');
            $table->index('slug');
            $table->index('is_active');
            $table->index('is_featured');
            $table->index('base_price');
            $table->index('sale_price');
            $table->index('total_sold');
            if (DB::getDriverName() !== 'sqlite') {
                $table->fullText(['name_en', 'name_km', 'description_en', 'description_km']);
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
