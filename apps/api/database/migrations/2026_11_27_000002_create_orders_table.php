<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table): void {
            $table->id();
            $table->string('code', 40)->unique();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('idempotency_key', 64)->nullable()->unique();
            $table->string('status', 32)->default('pending_payment')->index();
            $table->string('recipient_name', 120);
            $table->string('recipient_phone', 32);
            $table->text('shipping_address');
            $table->text('custom_note')->nullable();
            $table->string('payment_method', 32)->default('bca_transfer');
            $table->string('payment_proof_path', 500)->nullable();
            $table->string('payment_proof_name', 255)->nullable();
            $table->timestamp('payment_deadline')->nullable();
            $table->unsignedInteger('subtotal')->default(0);
            $table->unsignedInteger('shipping_cost')->default(0);
            $table->unsignedInteger('discount')->default(0);
            $table->unsignedInteger('total')->default(0);
            $table->string('courier', 100)->nullable();
            $table->string('tracking_number', 100)->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();
        });

        Schema::create('order_items', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->string('product_slug', 160);
            $table->string('name', 180);
            $table->unsignedInteger('price');
            $table->unsignedInteger('original_price')->nullable();
            $table->unsignedInteger('qty');
            $table->string('image_url', 500)->nullable();
            $table->string('category', 64)->nullable();
            $table->string('variant_label', 120)->nullable();
            $table->timestamps();
        });

        Schema::create('order_timelines', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->string('status', 32);
            $table->text('note')->nullable();
            $table->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_timelines');
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
    }
};
