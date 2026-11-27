<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('coupons', function (Blueprint $table): void {
            $table->id();
            $table->string('code', 40)->unique();
            $table->string('name', 120)->nullable();
            $table->string('type', 20)->default('percent'); // 'percent' atau 'fixed'
            $table->unsignedInteger('value'); // 10 untuk 10%, atau 20000 untuk Rp 20.000
            $table->unsignedInteger('max_discount')->nullable(); // batas potongan jika tipe percent
            $table->unsignedInteger('min_order_total')->default(0); // batas minimum subtotal belanja
            $table->unsignedInteger('usage_limit')->nullable(); // kuota pemakaian maksimal
            $table->unsignedInteger('used_count')->default(0); // jumlah yang telah digunakan
            $table->boolean('is_active')->default(true)->index();
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('expires_at')->nullable()->index();
            $table->timestamps();
        });

        Schema::table('orders', function (Blueprint $table): void {
            $table->string('coupon_code', 40)->nullable()->after('payment_method');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table): void {
            $table->dropColumn('coupon_code');
        });

        Schema::dropIfExists('coupons');
    }
};
