<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('banners', function (Blueprint $table) {
            $table->id();
            $table->string('title_en', 255)->nullable();
            $table->string('title_km', 255)->nullable();
            $table->string('subtitle_en', 500)->nullable();
            $table->string('subtitle_km', 500)->nullable();
            $table->string('image_path', 500);
            $table->string('link_url', 500)->nullable();   // deep link or URL
            $table->enum('link_type', ['product', 'category', 'url', 'none'])->default('none');
            $table->unsignedBigInteger('link_id')->nullable(); // product_id or category_id
            $table->integer('sort_order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamps();

            $table->index('is_active');
            $table->index('sort_order');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('banners');
    }
};
