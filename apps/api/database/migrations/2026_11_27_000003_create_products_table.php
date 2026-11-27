<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('category_id')->constrained()->cascadeOnDelete();
            $table->string('sku')->unique();
            $table->string('name');
            $table->string('slug')->unique();
            $table->text('description')->nullable();
            $table->unsignedInteger('price');
            $table->unsignedInteger('original_price')->nullable();
            $table->unsignedTinyInteger('discount_percent')->nullable();
            $table->unsignedInteger('stock')->default(0);
            $table->unsignedInteger('reserved_stock')->default(0);
            $table->string('stock_unit', 32)->default('Buket');
            $table->unsignedSmallInteger('low_stock_threshold')->default(5);
            $table->unsignedInteger('sold_count')->default(0);
            $table->decimal('rating', 2, 1)->default(0);
            $table->unsignedInteger('review_count')->default(0);
            $table->string('badge')->nullable();
            $table->string('image_url')->nullable();
            $table->json('gallery')->nullable();
            $table->json('care_instructions')->nullable();
            $table->json('specs')->nullable();
            $table->json('shipping_info')->nullable();
            $table->json('bonuses')->nullable();
            $table->json('botanical_tags')->nullable();
            $table->boolean('is_active')->default(true);
            $table->boolean('is_new')->default(false);
            $table->boolean('is_flash_sale')->default(false);
            $table->unsignedInteger('flash_sale_stock_left')->nullable();
            $table->unsignedInteger('flash_sale_stock_total')->nullable();
            $table->boolean('is_customizable')->default(false);
            $table->timestamps();

            $table->index('category_id');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
