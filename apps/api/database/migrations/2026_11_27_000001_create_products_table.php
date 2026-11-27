<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table): void {
            $table->id();
            $table->string('sku', 64)->unique();
            $table->string('slug', 160)->unique();
            $table->string('name', 180);
            $table->string('category', 64)->index();
            $table->unsignedInteger('price');
            $table->unsignedInteger('original_price')->nullable();
            $table->unsignedTinyInteger('discount_percent')->nullable();
            $table->unsignedInteger('stock')->default(0);
            $table->unsignedInteger('stock_total')->default(20);
            $table->string('stock_unit', 32)->default('Buket');
            $table->unsignedInteger('min_threshold')->default(5);
            $table->unsignedInteger('sold')->default(0);
            $table->decimal('rating', 3, 2)->default(5.00);
            $table->unsignedInteger('review_count')->default(0);
            $table->string('image_url', 500)->nullable();
            $table->string('badge', 64)->nullable();
            $table->text('description')->nullable();
            $table->json('botanical_tags')->nullable();
            $table->boolean('is_flash_sale')->default(false)->index();
            $table->boolean('is_new')->default(false)->index();
            $table->boolean('is_published')->default(true)->index();
            $table->boolean('is_customizable')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
