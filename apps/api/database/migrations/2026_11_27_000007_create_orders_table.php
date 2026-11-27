<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('guest_token', 64)->nullable();
            $table->string('code')->unique();
            $table->uuid('idempotency_key')->unique();
            $table->string('status', 32)->default('pending_payment')->index();
            $table->unsignedInteger('subtotal');
            $table->unsignedInteger('discount_amount')->default(0);
            $table->string('coupon_code')->nullable();
            $table->unsignedInteger('shipping_cost')->default(0);
            $table->unsignedInteger('total');
            $table->string('recipient_name');
            $table->string('recipient_phone', 20);
            $table->text('shipping_address');
            $table->text('custom_note')->nullable();
            $table->timestamp('payment_deadline')->nullable();
            $table->string('courier')->nullable();
            $table->string('tracking_number')->nullable();
            $table->timestamp('delivered_at')->nullable();
            $table->timestamps();

            $table->index('user_id');
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->restrictOnDelete();
            $table->string('product_name_snapshot');
            $table->string('slug_snapshot');
            $table->string('image_snapshot')->nullable();
            $table->string('size_id', 64)->default('standard');
            $table->string('size_label')->default('Standard');
            $table->string('wrap_id', 64)->default('standard');
            $table->string('wrap_label')->default('Standard');
            $table->unsignedInteger('unit_price_snapshot');
            $table->unsignedSmallInteger('qty');
            $table->text('note')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
    }
};
