<?php

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Product;
use App\Models\RealtimeEvent;
use Illuminate\Support\Str;

test('artisan app:cancel-expired-orders cancels overdue pending_payment orders and restores product stock', function () {
    $productA = Product::query()->create([
        'sku' => 'DF-EXP-001',
        'slug' => 'buket-expire-a',
        'name' => 'Buket Expire A',
        'category' => 'Mawar',
        'price' => 120000,
        'stock' => 3,
        'sold' => 4,
        'is_published' => true,
    ]);

    $productB = Product::query()->create([
        'sku' => 'DF-EXP-002',
        'slug' => 'buket-expire-b',
        'name' => 'Buket Expire B',
        'category' => 'Wisuda',
        'price' => 90000,
        'stock' => 8,
        'sold' => 2,
        'is_published' => true,
    ]);

    // 1. Pesanan Kedaluwarsa (sudah lewat deadline 2 jam lalu)
    $expiredOrder = Order::query()->create([
        'code' => 'DLF-20261127-EX01',
        'status' => OrderStatus::PendingPayment,
        'recipient_name' => 'Citra Dewi',
        'recipient_phone' => '081299887766',
        'shipping_address' => 'Jl. Cihideung No 1, Tasikmalaya',
        'payment_deadline' => now()->subHours(2),
        'subtotal' => 240000,
        'total' => 240000,
        'idempotency_key' => (string) Str::uuid(),
    ]);

    $expiredOrder->items()->create([
        'product_id' => $productA->id,
        'product_slug' => $productA->slug,
        'name' => $productA->name,
        'price' => 120000,
        'qty' => 2,
    ]);

    // 2. Pesanan Masih Aktif (deadline masih 12 jam lagi)
    $activeOrder = Order::query()->create([
        'code' => 'DLF-20261127-AC01',
        'status' => OrderStatus::PendingPayment,
        'recipient_name' => 'Budi Santoso',
        'recipient_phone' => '081299887755',
        'shipping_address' => 'Jl. HZ Mustofa No 5, Tasikmalaya',
        'payment_deadline' => now()->addHours(12),
        'subtotal' => 90000,
        'total' => 105000,
        'idempotency_key' => (string) Str::uuid(),
    ]);

    $activeOrder->items()->create([
        'product_id' => $productB->id,
        'product_slug' => $productB->slug,
        'name' => $productB->name,
        'price' => 90000,
        'qty' => 1,
    ]);

    // 3. Pesanan Sudah Bayar (status 'paid'), deadline di masa lalu tidak boleh dibatalkan
    $paidOrder = Order::query()->create([
        'code' => 'DLF-20261127-PD01',
        'status' => OrderStatus::Paid,
        'recipient_name' => 'Rian Hidayat',
        'recipient_phone' => '081299887744',
        'shipping_address' => 'Jl. Mitrabat No 20, Tasikmalaya',
        'payment_deadline' => now()->subHours(5),
        'subtotal' => 120000,
        'total' => 120000,
        'idempotency_key' => (string) Str::uuid(),
    ]);

    $paidOrder->items()->create([
        'product_id' => $productA->id,
        'product_slug' => $productA->slug,
        'name' => $productA->name,
        'price' => 120000,
        'qty' => 1,
    ]);

    // Jalankan artisan command
    $this->artisan('app:cancel-expired-orders')
        ->expectsOutputToContain('Berhasil membatalkan 1 pesanan kedaluwarsa')
        ->assertSuccessful();

    // Verifikasi status order
    expect($expiredOrder->refresh()->status)->toBe(OrderStatus::Cancelled);
    expect($activeOrder->refresh()->status)->toBe(OrderStatus::PendingPayment);
    expect($paidOrder->refresh()->status)->toBe(OrderStatus::Paid);

    // Verifikasi catatan timeline
    expect($expiredOrder->timelines()->where('status', OrderStatus::Cancelled->value)->exists())->toBeTrue();

    // Verifikasi stok produk A dikembalikan (+2 stok, -2 sold)
    $productA->refresh();
    expect($productA->stock)->toBe(5); // dari 3 + 2 = 5
    expect($productA->sold)->toBe(2);  // dari 4 - 2 = 2

    // Verifikasi stok produk B tidak berubah
    $productB->refresh();
    expect($productB->stock)->toBe(8);
    expect($productB->sold)->toBe(2);

    // Verifikasi RealtimeEvent dipublikasikan
    expect(RealtimeEvent::query()
        ->where('topic', 'orders')
        ->where('payload->code', $expiredOrder->code)
        ->exists())->toBeTrue();
    expect(RealtimeEvent::query()
        ->where('topic', 'products')
        ->where('payload->code', $expiredOrder->code)
        ->exists())->toBeTrue();

    // Eksekusi kedua ketika sudah tidak ada lagi pesanan expired
    $this->artisan('app:cancel-expired-orders')
        ->expectsOutput('Tidak ada pesanan kedaluwarsa yang perlu dibatalkan.')
        ->assertSuccessful();
});
