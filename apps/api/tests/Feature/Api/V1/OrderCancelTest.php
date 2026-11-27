<?php

use App\Enums\OrderStatus;
use App\Enums\Role;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\Product;
use App\Models\RealtimeEvent;
use App\Models\User;
use Illuminate\Support\Str;

// ─── Helpers ────────────────────────────────────────────────────────────────

function makeOrder(array $overrides = []): Order
{
    return Order::query()->create(array_merge([
        'status' => OrderStatus::PendingPayment,
        'recipient_name' => 'Test Buyer',
        'recipient_phone' => '081234567890',
        'shipping_address' => 'Jl. Test No. 1, Tasikmalaya',
        'payment_deadline' => now()->addDay(),
        'subtotal' => 150000,
        'shipping_cost' => 15000,
        'discount' => 0,
        'total' => 165000,
        'idempotency_key' => (string) Str::uuid(),
        'code' => 'DLF-'.now()->format('Ymd').'-'.strtoupper(Str::random(4)),
    ], $overrides));
}

// ─── 1. Guest (tidak login) → wajib ditolak 401 ─────────────────────────────

test('unauthenticated request to cancel endpoint returns 401', function () {
    $order = makeOrder();

    $this->postJson("/api/v1/orders/{$order->code}/cancel")
        ->assertStatus(401);

    expect($order->refresh()->status)->toBe(OrderStatus::PendingPayment);
});

// ─── 2. Pelanggan berhasil membatalkan pesanannya sendiri ────────────────────

test('authenticated buyer can cancel their own pending_payment order and stock is restored', function () {
    $buyer = User::factory()->create(['role' => Role::Customer]);

    $product = Product::query()->create([
        'sku' => 'DF-CNL-010',
        'slug' => 'buket-cancel-test',
        'name' => 'Buket Cancel Test',
        'category' => 'Mawar',
        'price' => 150000,
        'stock' => 5,
        'sold' => 2,
        'is_published' => true,
    ]);

    $coupon = Coupon::query()->create([
        'code' => 'CANCELCOUPON',
        'name' => 'Kupon Uji Batal',
        'type' => 'fixed',
        'value' => 15000,
        'used_count' => 1,
        'is_active' => true,
    ]);

    $order = makeOrder([
        'user_id' => $buyer->id,
        'coupon_code' => 'CANCELCOUPON',
        'discount' => 15000,
    ]);

    $order->items()->create([
        'product_id' => $product->id,
        'product_slug' => $product->slug,
        'name' => $product->name,
        'price' => 150000,
        'qty' => 2,
    ]);

    $response = $this->actingAs($buyer)
        ->postJson("/api/v1/orders/{$order->code}/cancel", [
            'reason' => 'Ingin mengganti ukuran buket',
        ]);

    $response->assertStatus(200);
    expect($response->json('status'))->toBe(OrderStatus::Cancelled->value);

    // Stok dikembalikan
    $product->refresh();
    expect($product->stock)->toBe(7)->and($product->sold)->toBe(0);

    // Kuota kupon dikembalikan
    $coupon->refresh();
    expect($coupon->used_count)->toBe(0);

    // Timeline dicatat dengan alasan
    $order->refresh();
    $lastNote = $order->timelines()->latest('id')->first()?->note;
    expect($lastNote)->toContain('Ingin mengganti ukuran buket');
});

// ─── 3. Pelanggan mencoba membatalkan pesanan orang lain → 403 ──────────────

test('buyer cannot cancel another user order and gets 403', function () {
    $owner = User::factory()->create(['role' => Role::Customer]);
    $intruder = User::factory()->create(['role' => Role::Customer]);

    $order = makeOrder(['user_id' => $owner->id]);

    $this->actingAs($intruder)
        ->postJson("/api/v1/orders/{$order->code}/cancel")
        ->assertStatus(403)
        ->assertJson(['code' => 'FORBIDDEN']);

    expect($order->refresh()->status)->toBe(OrderStatus::PendingPayment);
});

// ─── 4. Pelanggan tidak dapat membatalkan pesanan yang sudah diverifikasi/lunas ─

test('buyer cannot cancel order not in pending_payment status', function () {
    $buyer = User::factory()->create(['role' => Role::Customer]);

    foreach ([OrderStatus::PendingVerification, OrderStatus::Paid, OrderStatus::Shipped] as $status) {
        $order = makeOrder([
            'user_id' => $buyer->id,
            'code' => 'DLF-'.now()->format('Ymd').'-'.strtoupper(Str::random(4)),
            'status' => $status,
        ]);

        $this->actingAs($buyer)
            ->postJson("/api/v1/orders/{$order->code}/cancel")
            ->assertStatus(422)
            ->assertJson(['code' => 'INVALID_ORDER_STATUS']);

        expect($order->refresh()->status)->toBe($status);
    }
});

// ─── 5. Admin dapat membatalkan pesanan milik siapapun ──────────────────────

test('admin can cancel any pending_payment order regardless of user_id', function () {
    $admin = User::factory()->create(['role' => Role::Admin]);
    $buyer = User::factory()->create(['role' => Role::Customer]);

    $order = makeOrder(['user_id' => $buyer->id]);

    $this->actingAs($admin)
        ->postJson("/api/v1/orders/{$order->code}/cancel", ['reason' => 'Dibatalkan admin'])
        ->assertStatus(200);

    expect($order->refresh()->status)->toBe(OrderStatus::Cancelled);
    $note = $order->timelines()->latest('id')->first()?->note;
    expect($note)->toContain('admin/pemilik toko');
});

// ─── 6. Admin dapat membatalkan pesanan yang sudah ada bukti bayar (pending_verification) ─

test('admin can cancel order in pending_verification status', function () {
    $admin = User::factory()->create(['role' => Role::Admin]);

    $order = makeOrder([
        'status' => OrderStatus::PendingVerification,
    ]);

    $this->actingAs($admin)
        ->postJson("/api/v1/orders/{$order->code}/cancel")
        ->assertStatus(200);

    expect($order->refresh()->status)->toBe(OrderStatus::Cancelled);
});

// ─── 7. Pesanan tidak ditemukan → 404 ───────────────────────────────────────

test('cancel returns 404 for non-existent order code', function () {
    $buyer = User::factory()->create(['role' => Role::Customer]);

    $this->actingAs($buyer)
        ->postJson('/api/v1/orders/NONEXISTENT-CODE/cancel')
        ->assertStatus(404)
        ->assertJson(['code' => 'ORDER_NOT_FOUND']);
});

// ─── 8. Klaim & batalkan pesanan tamu jika nomor HP cocok ───────────────────

test('logged in buyer can claim and cancel guest order if buyer phone matches', function () {
    $buyer = User::factory()->create([
        'role' => Role::Customer,
        'phone' => '081298765432',
    ]);

    $order = makeOrder([
        'user_id' => null, // Guest order
        'recipient_phone' => '081211112222', // Penerima kado
        'buyer_phone' => '081298765432', // Pemesan
    ]);

    $response = $this->actingAs($buyer)
        ->postJson("/api/v1/orders/{$order->code}/cancel", [
            'reason' => 'Batal kirim hadiah',
        ]);

    $response->assertStatus(200);
    $order->refresh();
    expect($order->status)->toBe(OrderStatus::Cancelled)
        ->and($order->user_id)->toBe($buyer->id);
});

test('logged in buyer rejected 403 when trying to claim guest order with different phone', function () {
    $buyer = User::factory()->create([
        'role' => Role::Customer,
        'phone' => '081200000000',
    ]);

    $order = makeOrder([
        'user_id' => null,
        'recipient_phone' => '081211112222',
        'buyer_phone' => '081298765432',
    ]);

    $this->actingAs($buyer)
        ->postJson("/api/v1/orders/{$order->code}/cancel")
        ->assertStatus(403)
        ->assertJson(['code' => 'FORBIDDEN']);

    $order->refresh();
    expect($order->status)->toBe(OrderStatus::PendingPayment)
        ->and($order->user_id)->toBeNull();
});

// ─── 9. Admin updateStatus ke status yang mengembalikan stok (slug-only) ────

test('admin updateStatus to rejected or cancelled restores stock when order item references product only by slug', function () {
    $admin = User::factory()->create(['role' => Role::Admin]);

    $product = Product::query()->create([
        'sku' => 'DF-SLUG-RESTORE',
        'slug' => 'buket-slug-only',
        'name' => 'Buket Slug Only',
        'category' => 'Mawar',
        'price' => 120000,
        'stock' => 5,
        'sold' => 3,
        'is_published' => true,
    ]);

    $order = makeOrder([
        'status' => OrderStatus::PendingVerification,
    ]);

    // Item terhubung HANYA melalui slug (product_id bernilai null)
    $order->items()->create([
        'product_id' => null,
        'product_slug' => 'buket-slug-only',
        'name' => 'Buket Slug Only',
        'price' => 120000,
        'qty' => 3,
    ]);

    $this->actingAs($admin)
        ->patchJson("/api/v1/admin/orders/{$order->code}/status", [
            'status' => 'rejected',
            'note' => 'Bukti bayar ditolak oleh admin',
        ])
        ->assertOk()
        ->assertJsonPath('data.status', 'rejected');

    // Stok WAJIB bertambah kembali dari 5 menjadi 8, dan sold berkurang dari 3 menjadi 0
    $product->refresh();
    expect($product->stock)->toBe(8)
        ->and($product->sold)->toBe(0);
});

// ─── 10. Double Cancel tidak menyiarkan event SSE palsu / bohong ─────────────

test('double cancel does not broadcast duplicate or false stock_restored realtime events', function () {
    $buyer = User::factory()->create(['role' => Role::Customer]);

    $product = Product::query()->create([
        'sku' => 'DF-CANCEL-SSE',
        'slug' => 'buket-cancel-sse',
        'name' => 'Buket Cancel SSE Test',
        'category' => 'Mawar',
        'price' => 100000,
        'stock' => 10,
        'sold' => 2,
        'is_published' => true,
    ]);

    $order = makeOrder([
        'user_id' => $buyer->id,
        'status' => OrderStatus::PendingPayment,
    ]);

    $order->items()->create([
        'product_id' => $product->id,
        'product_slug' => $product->slug,
        'name' => $product->name,
        'price' => 100000,
        'qty' => 2,
    ]);

    $initialEventCount = RealtimeEvent::query()
        ->where('topic', 'products')
        ->whereJsonContains('payload->action', 'stock_restored')
        ->count();

    // 1. Pembatalan pertama: berhasil, stok dipulihkan, event disiarkan tepat 1x
    $res1 = $this->actingAs($buyer)
        ->postJson("/api/v1/orders/{$order->code}/cancel");
    $res1->assertOk();

    $product->refresh();
    expect($product->stock)->toBe(12)
        ->and($product->sold)->toBe(0);

    $afterFirstCancelCount = RealtimeEvent::query()
        ->where('topic', 'products')
        ->whereJsonContains('payload->action', 'stock_restored')
        ->count();

    expect($afterFirstCancelCount)->toBe($initialEventCount + 1);

    // 2. Pembatalan kedua (misal double submit atau concurrent race):
    // Tidak boleh menambah stok lagi dan TIDAK BOLEH mempublikasikan event stock_restored palsu!
    $res2 = $this->actingAs($buyer)
        ->postJson("/api/v1/orders/{$order->code}/cancel");

    // Permintaan kedua ditolak 422 karena status sudah bukan cancellable
    $res2->assertStatus(422)
        ->assertJsonPath('code', 'INVALID_ORDER_STATUS');

    $product->refresh();
    expect($product->stock)->toBe(12); // Stok tetap 12, tidak bertambah jadi 14

    $afterSecondCancelCount = RealtimeEvent::query()
        ->where('topic', 'products')
        ->whereJsonContains('payload->action', 'stock_restored')
        ->count();

    // Jumlah event stock_restored tetap sama persis, tidak ada event bohong!
    expect($afterSecondCancelCount)->toBe($afterFirstCancelCount);
});

test('concurrent cancel race condition does not broadcast false stock_restored events', function () {
    $buyer = User::factory()->create(['role' => Role::Customer]);

    $product = Product::query()->create([
        'sku' => 'DF-CANCEL-RACE',
        'slug' => 'buket-cancel-race',
        'name' => 'Buket Cancel Race Test',
        'category' => 'Mawar',
        'price' => 100000,
        'stock' => 10,
        'sold' => 2,
        'is_published' => true,
    ]);

    $order = makeOrder([
        'user_id' => $buyer->id,
        'status' => OrderStatus::PendingPayment,
    ]);

    $order->items()->create([
        'product_id' => $product->id,
        'product_slug' => $product->slug,
        'name' => $product->name,
        'price' => 100000,
        'qty' => 2,
    ]);

    $initialEventCount = RealtimeEvent::query()
        ->where('topic', 'products')
        ->whereJsonContains('payload->action', 'stock_restored')
        ->count();

    // Simulasikan race condition:
    // Pesanan awalnya dibaca sebagai pending_payment oleh findOrder(),
    // tetapi tepat saat lockForUpdate hendak mengambil baris di dalam transaksi,
    // thread lain selesai lebih dulu dan mengubah status menjadi Cancelled di database.
    // Simulasikan race condition:
    // Panggilan pertama (findOrder) melihat status pending_payment.
    // Tepat saat baris di-lock di dalam transaksi, status ternyata sudah Cancelled
    // karena thread/request konkruen lain berhasil commit pembatalan lebih dulu.
    $retrieveCount = 0;
    Order::retrieved(function ($model) use (&$retrieveCount, $order) {
        if ($model->id === $order->id) {
            $retrieveCount++;
            if ($retrieveCount >= 2) {
                // Instance kedua yang di-lock di dalam DB::transaction sudah berstatus Cancelled
                $model->status = OrderStatus::Cancelled;
            }
        }
    });

    // Request ini memproses pembatalan saat status sudah Cancelled di dalam transaksi
    $res = $this->actingAs($buyer)
        ->postJson("/api/v1/orders/{$order->code}/cancel");

    // Mengembalikan data order yang sudah berstatus cancelled secara elegan
    $res->assertOk()
        ->assertJsonPath('status', 'cancelled');

    // TETAPI TIDAK MENERBITKAN EVENT stock_restored PALSU!
    $afterRaceEventCount = RealtimeEvent::query()
        ->where('topic', 'products')
        ->whereJsonContains('payload->action', 'stock_restored')
        ->count();

    expect($afterRaceEventCount)->toBe($initialEventCount);
    expect($product->fresh()->stock)->toBe(10); // Stok tidak bertambah ganda
});
