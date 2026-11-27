<?php

use App\Enums\OrderStatus;
use App\Enums\Role;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use Illuminate\Support\Str;

test('order checkout applies dynamic percent coupon with cap and tracks usage', function () {
    $coupon = Coupon::query()->create([
        'code' => 'DELYSAWISUDA',
        'name' => 'Promo Wisuda',
        'type' => 'percent',
        'value' => 10,
        'max_discount' => 30000,
        'min_order_total' => 100000,
        'usage_limit' => 100,
        'used_count' => 0,
        'is_active' => true,
    ]);

    $product = Product::query()->create([
        'sku' => 'DF-CPN-001',
        'slug' => 'buket-wisuda-premium',
        'name' => 'Buket Wisuda Premium',
        'category' => 'Wisuda',
        'price' => 250000,
        'stock' => 10,
        'sold' => 0,
        'is_published' => true,
    ]);

    $response = $this->postJson('/api/v1/orders', [
        'recipientName' => 'Annisa Rahma',
        'recipientPhone' => '081234567890',
        'shippingAddress' => 'Jl. Unsil No. 12, Tasikmalaya',
        'paymentMethod' => 'bca_transfer',
        'couponCode' => 'delysawisuda', // test case-insensitivity
        'idempotencyKey' => (string) Str::uuid(),
        'items' => [
            [
                'productId' => $product->id,
                'slug' => $product->slug,
                'name' => $product->name,
                'price' => $product->price,
                'qty' => 1,
            ],
        ],
    ]);

    $response->assertStatus(201);
    $data = $response->json();

    // Subtotal 250.000 >= 200.000 -> Free Shipping (0)
    // Discount 10% dari 250.000 = 25.000 (di bawah cap 30.000)
    // Grand Total = 250.000 + 0 - 25.000 = 225.000
    expect($data['totals']['subtotal'])->toBe(250000)
        ->and($data['totals']['couponDiscount'])->toBe(25000)
        ->and($data['totals']['grandTotal'])->toBe(225000)
        ->and($data['couponCode'])->toBe('DELYSAWISUDA');

    $coupon->refresh();
    expect($coupon->used_count)->toBe(1);
});

test('order checkout applies cap when percent discount exceeds max_discount', function () {
    Coupon::query()->create([
        'code' => 'DELYSACAP',
        'name' => 'Promo Diskon Terbatas',
        'type' => 'percent',
        'value' => 10,
        'max_discount' => 30000,
        'min_order_total' => 100000,
        'is_active' => true,
    ]);

    $product = Product::query()->create([
        'sku' => 'DF-CPN-002',
        'slug' => 'buket-raksasa',
        'name' => 'Buket Raksasa Mawar Merah',
        'category' => 'Mawar',
        'price' => 500000,
        'stock' => 5,
        'sold' => 0,
        'is_published' => true,
    ]);

    $response = $this->postJson('/api/v1/orders', [
        'recipientName' => 'Dewi Sartika',
        'recipientPhone' => '081298765432',
        'shippingAddress' => 'Jl. Sutisna Senjaya No. 88, Tasikmalaya',
        'paymentMethod' => 'qris',
        'couponCode' => 'DELYSACAP',
        'idempotencyKey' => (string) Str::uuid(),
        'items' => [
            [
                'productId' => $product->id,
                'slug' => $product->slug,
                'name' => $product->name,
                'price' => $product->price,
                'qty' => 1,
            ],
        ],
    ]);

    $response->assertStatus(201);
    $data = $response->json();

    // Subtotal 500.000 -> 10% = 50.000, capped at max_discount 30.000
    expect($data['totals']['subtotal'])->toBe(500000)
        ->and($data['totals']['couponDiscount'])->toBe(30000)
        ->and($data['totals']['grandTotal'])->toBe(470000);
});

test('order checkout applies fixed discount coupon', function () {
    Coupon::query()->create([
        'code' => 'HEMAT20K',
        'name' => 'Potongan 20 Ribu',
        'type' => 'fixed',
        'value' => 20000,
        'min_order_total' => 150000,
        'is_active' => true,
    ]);

    $product = Product::query()->create([
        'sku' => 'DF-CPN-003',
        'slug' => 'buket-tulip-pink',
        'name' => 'Buket Tulip Pink',
        'category' => 'Tulip',
        'price' => 180000,
        'stock' => 5,
        'sold' => 0,
        'is_published' => true,
    ]);

    $response = $this->postJson('/api/v1/orders', [
        'recipientName' => 'Rina Nose',
        'recipientPhone' => '081233445566',
        'shippingAddress' => 'Jl. Tentara Pelajar No. 45, Tasikmalaya',
        'paymentMethod' => 'bca_transfer',
        'couponCode' => 'HEMAT20K',
        'idempotencyKey' => (string) Str::uuid(),
        'items' => [
            [
                'productId' => $product->id,
                'slug' => $product->slug,
                'name' => $product->name,
                'price' => $product->price,
                'qty' => 1,
            ],
        ],
    ]);

    $response->assertStatus(201);
    $data = $response->json();

    // Subtotal 180.000 (< 200.000 -> Ongkir 15.000)
    // Discount fixed 20.000
    // Total = 180.000 + 15.000 - 20.000 = 175.000
    expect($data['totals']['subtotal'])->toBe(180000)
        ->and($data['totals']['shipping'])->toBe(15000)
        ->and($data['totals']['couponDiscount'])->toBe(20000)
        ->and($data['totals']['grandTotal'])->toBe(175000);
});

test('coupon is ignored if subtotal is below min_order_total', function () {
    $coupon = Coupon::query()->create([
        'code' => 'HEMATBESAR',
        'name' => 'Hemat Besar Belanja 200rb',
        'type' => 'fixed',
        'value' => 30000,
        'min_order_total' => 200000,
        'is_active' => true,
    ]);

    $product = Product::query()->create([
        'sku' => 'DF-CPN-004',
        'slug' => 'single-rose',
        'name' => 'Single Red Rose',
        'category' => 'Mawar',
        'price' => 75000,
        'stock' => 10,
        'sold' => 0,
        'is_published' => true,
    ]);

    $response = $this->postJson('/api/v1/orders', [
        'recipientName' => 'Dimas Anggara',
        'recipientPhone' => '081244556677',
        'shippingAddress' => 'Jl. Bantar No. 10, Tasikmalaya',
        'paymentMethod' => 'bca_transfer',
        'couponCode' => 'HEMATBESAR',
        'idempotencyKey' => (string) Str::uuid(),
        'items' => [
            [
                'productId' => $product->id,
                'slug' => $product->slug,
                'name' => $product->name,
                'price' => $product->price,
                'qty' => 1,
            ],
        ],
    ]);

    $response->assertStatus(201);
    $data = $response->json();

    // Subtotal 75.000 < min_order_total 200.000 -> discount 0
    expect($data['totals']['couponDiscount'])->toBe(0)
        ->and($data['couponCode'])->toBeNull();

    $coupon->refresh();
    expect($coupon->used_count)->toBe(0);
});

test('coupon is ignored if inactive or expired', function () {
    Coupon::query()->create([
        'code' => 'NONAKTIF',
        'name' => 'Kupon Nonaktif',
        'type' => 'fixed',
        'value' => 20000,
        'is_active' => false,
    ]);

    Coupon::query()->create([
        'code' => 'KADALUWARSA',
        'name' => 'Kupon Kedaluwarsa',
        'type' => 'fixed',
        'value' => 25000,
        'is_active' => true,
        'expires_at' => now()->subDay(),
    ]);

    $product = Product::query()->create([
        'sku' => 'DF-CPN-005',
        'slug' => 'bunga-meja',
        'name' => 'Rangkaian Bunga Meja',
        'category' => 'Meja',
        'price' => 150000,
        'stock' => 10,
        'sold' => 0,
        'is_published' => true,
    ]);

    // Test kupon nonaktif
    $res1 = $this->postJson('/api/v1/orders', [
        'recipientName' => 'Siti Badriah',
        'recipientPhone' => '081211223344',
        'shippingAddress' => 'Jl. Paseh No. 12, Tasikmalaya',
        'paymentMethod' => 'bca_transfer',
        'couponCode' => 'NONAKTIF',
        'idempotencyKey' => (string) Str::uuid(),
        'items' => [
            ['productId' => $product->id, 'qty' => 1],
        ],
    ]);
    $res1->assertStatus(201);
    expect($res1->json('totals.couponDiscount'))->toBe(0);

    // Test kupon kedaluwarsa
    $res2 = $this->postJson('/api/v1/orders', [
        'recipientName' => 'Siti Badriah',
        'recipientPhone' => '081211223344',
        'shippingAddress' => 'Jl. Paseh No. 12, Tasikmalaya',
        'paymentMethod' => 'bca_transfer',
        'couponCode' => 'KADALUWARSA',
        'idempotencyKey' => (string) Str::uuid(),
        'items' => [
            ['productId' => $product->id, 'qty' => 1],
        ],
    ]);
    $res2->assertStatus(201);
    expect($res2->json('totals.couponDiscount'))->toBe(0);
});

test('coupon usage is restored when expired order is cancelled', function () {
    $coupon = Coupon::query()->create([
        'code' => 'KUPONRESTORE',
        'name' => 'Kupon Uji Restore',
        'type' => 'fixed',
        'value' => 20000,
        'used_count' => 1,
        'is_active' => true,
    ]);

    $order = Order::query()->create([
        'code' => 'DLF-20261127-REST01',
        'status' => OrderStatus::PendingPayment,
        'recipient_name' => 'Resto Tester',
        'recipient_phone' => '081234567899',
        'shipping_address' => 'Jl. Nagarawangi No. 10',
        'payment_deadline' => now()->subHours(2),
        'coupon_code' => 'KUPONRESTORE',
        'subtotal' => 100000,
        'total' => 80000,
        'idempotency_key' => (string) Str::uuid(),
    ]);

    $this->artisan('app:cancel-expired-orders')
        ->assertExitCode(0);

    $order->refresh();
    expect($order->status)->toBe(OrderStatus::Cancelled);

    $coupon->refresh();
    expect($coupon->used_count)->toBe(0);
});

test('authenticated user cannot reuse coupon on multiple active orders (422 COUPON_ALREADY_USED)', function () {
    $user = User::factory()->create(['role' => Role::Customer]);
    $coupon = Coupon::query()->create([
        'code' => 'ONETIMEONLY',
        'name' => 'Kupon Sekali Pakai',
        'type' => 'fixed',
        'value' => 20000,
        'min_order_total' => 100000,
        'is_active' => true,
    ]);

    $product = Product::query()->create([
        'sku' => 'DF-CPN-ONCE',
        'slug' => 'buket-once-test',
        'name' => 'Buket Once Test',
        'category' => 'Mawar',
        'price' => 150000,
        'stock' => 10,
        'is_published' => true,
    ]);

    // Pesanan pertama sukses memakai kupon
    $this->actingAs($user)
        ->postJson('/api/v1/orders', [
            'recipientName' => 'Budi Once',
            'recipientPhone' => '081234567891',
            'shippingAddress' => 'Jl. Merdeka No 1',
            'paymentMethod' => 'bca_transfer',
            'couponCode' => 'ONETIMEONLY',
            'idempotencyKey' => (string) Str::uuid(),
            'items' => [['productId' => $product->id, 'qty' => 1]],
        ])
        ->assertStatus(201)
        ->assertJsonPath('totals.couponDiscount', 20000);

    // Pesanan kedua oleh user yang sama dengan kupon yang sama ditolak 422 COUPON_ALREADY_USED
    $this->actingAs($user)
        ->postJson('/api/v1/orders', [
            'recipientName' => 'Budi Once',
            'recipientPhone' => '081234567891',
            'shippingAddress' => 'Jl. Merdeka No 1',
            'paymentMethod' => 'bca_transfer',
            'couponCode' => 'ONETIMEONLY',
            'idempotencyKey' => (string) Str::uuid(),
            'items' => [['productId' => $product->id, 'qty' => 1]],
        ])
        ->assertStatus(422)
        ->assertJsonPath('code', 'COUPON_ALREADY_USED');
});

test('guest with the same phone cannot reuse coupon to deplete quota', function () {
    $coupon = Coupon::query()->create([
        'code' => 'GUESTPROMO',
        'name' => 'Kupon Tamu Promo',
        'type' => 'percent',
        'value' => 10,
        'min_order_total' => 100000,
        'is_active' => true,
    ]);

    $product = Product::query()->create([
        'sku' => 'DF-CPN-GUEST',
        'slug' => 'buket-guest-test',
        'name' => 'Buket Guest Test',
        'category' => 'Mawar',
        'price' => 150000,
        'stock' => 10,
        'is_published' => true,
    ]);

    // Checkout tamu pertama dengan no HP 085511223344
    $this->postJson('/api/v1/orders', [
        'recipientName' => 'Tamu Pertama',
        'recipientPhone' => '085511223344',
        'shippingAddress' => 'Jl. Tamu No 5',
        'paymentMethod' => 'bca_transfer',
        'couponCode' => 'GUESTPROMO',
        'idempotencyKey' => (string) Str::uuid(),
        'items' => [['productId' => $product->id, 'qty' => 1]],
    ])
        ->assertStatus(201)
        ->assertJsonPath('totals.couponDiscount', 15000);

    // Bot tamu mencoba checkout lagi menggunakan no HP yang sama (format 6285511223344)
    $this->postJson('/api/v1/orders', [
        'recipientName' => 'Tamu Kedua',
        'recipientPhone' => '6285511223344',
        'shippingAddress' => 'Jl. Tamu No 6',
        'paymentMethod' => 'bca_transfer',
        'couponCode' => 'GUESTPROMO',
        'idempotencyKey' => (string) Str::uuid(),
        'items' => [['productId' => $product->id, 'qty' => 1]],
    ])
        ->assertStatus(422)
        ->assertJsonPath('code', 'COUPON_ALREADY_USED');
});

test('user can reuse coupon if previous order was cancelled', function () {
    $user = User::factory()->create(['role' => Role::Customer]);
    $coupon = Coupon::query()->create([
        'code' => 'CANREUSE',
        'name' => 'Kupon Boleh Pakai Ulang Jika Batal',
        'type' => 'fixed',
        'value' => 20000,
        'min_order_total' => 100000,
        'is_active' => true,
    ]);

    $product = Product::query()->create([
        'sku' => 'DF-CPN-REUSE',
        'slug' => 'buket-reuse-test',
        'name' => 'Buket Reuse Test',
        'category' => 'Mawar',
        'price' => 150000,
        'stock' => 10,
        'is_published' => true,
    ]);

    // Buat pesanan pertama
    $firstOrder = $this->actingAs($user)
        ->postJson('/api/v1/orders', [
            'recipientName' => 'Pembeli Batal',
            'recipientPhone' => '087711223344',
            'shippingAddress' => 'Jl. Batal No 1',
            'paymentMethod' => 'bca_transfer',
            'couponCode' => 'CANREUSE',
            'idempotencyKey' => (string) Str::uuid(),
            'items' => [['productId' => $product->id, 'qty' => 1]],
        ])
        ->assertStatus(201);

    $orderCode = (string) $firstOrder->json('code');

    // Pelanggan membatalkan pesanan pertamanya
    $this->actingAs($user)
        ->postJson("/api/v1/orders/{$orderCode}/cancel", [
            'reason' => 'Ingin ubah alamat',
        ])
        ->assertStatus(200);

    // Sekarang pembeli mencoba memesan lagi menggunakan kupon yang sama -> HARUS BERHASIL!
    $this->actingAs($user)
        ->postJson('/api/v1/orders', [
            'recipientName' => 'Pembeli Batal',
            'recipientPhone' => '087711223344',
            'shippingAddress' => 'Jl. Baru No 2',
            'paymentMethod' => 'bca_transfer',
            'couponCode' => 'CANREUSE',
            'idempotencyKey' => (string) Str::uuid(),
            'items' => [['productId' => $product->id, 'qty' => 1]],
        ])
        ->assertStatus(201)
        ->assertJsonPath('totals.couponDiscount', 20000);
});

test('checkout endpoint enforces rate limiting against bot spam (429 Too Many Requests)', function () {
    $product = Product::query()->create([
        'sku' => 'DF-CPN-RATE',
        'slug' => 'buket-rate-test',
        'name' => 'Buket Rate Test',
        'category' => 'Mawar',
        'price' => 150000,
        'stock' => 100,
        'is_published' => true,
    ]);

    for ($i = 0; $i < 15; $i++) {
        $this->postJson('/api/v1/orders', [
            'recipientName' => 'Spam Bot',
            'recipientPhone' => '081234567890',
            'shippingAddress' => 'Jl. Bot No 1',
            'idempotencyKey' => (string) Str::uuid(),
            'items' => [['productId' => $product->id, 'qty' => 1]],
        ])->assertStatus(201);
    }

    // Request ke-16 dalam menit yang sama harus ditolak dengan 429
    $this->postJson('/api/v1/orders', [
        'recipientName' => 'Spam Bot',
        'recipientPhone' => '081234567890',
        'shippingAddress' => 'Jl. Bot No 1',
        'idempotencyKey' => (string) Str::uuid(),
        'items' => [['productId' => $product->id, 'qty' => 1]],
    ])->assertStatus(429);
});

test('coupon usage is restored when admin rejects order via updateStatus', function () {
    $admin = User::factory()->create(['role' => Role::Admin]);
    $buyer = User::factory()->create(['role' => Role::Customer]);

    $coupon = Coupon::query()->create([
        'code' => 'REJECTPROMO',
        'name' => 'Promo Yang Ditolak Admin',
        'type' => 'fixed',
        'value' => 25000,
        'min_order_total' => 100000,
        'used_count' => 0,
        'is_active' => true,
    ]);

    $product = Product::query()->create([
        'sku' => 'DF-CPN-ADMREJ',
        'slug' => 'buket-admin-reject',
        'name' => 'Buket Admin Reject',
        'category' => 'Mawar',
        'price' => 150000,
        'stock' => 5,
        'is_published' => true,
    ]);

    // Pelanggan membuat pesanan dengan kupon
    $orderRes = $this->actingAs($buyer)
        ->postJson('/api/v1/orders', [
            'recipientName' => 'Pembeli Tertolak',
            'recipientPhone' => '082299887766',
            'shippingAddress' => 'Jl. Mawar No 1',
            'paymentMethod' => 'bca_transfer',
            'couponCode' => 'REJECTPROMO',
            'idempotencyKey' => (string) Str::uuid(),
            'items' => [['productId' => $product->id, 'qty' => 1]],
        ])
        ->assertStatus(201);

    expect($coupon->refresh()->used_count)->toBe(1);
    expect($product->refresh()->stock)->toBe(4);

    $orderCode = (string) $orderRes->json('code');

    // Admin menolak pesanan (misal bukti pembayaran palsu)
    $this->actingAs($admin)
        ->patchJson("/api/v1/admin/orders/{$orderCode}/status", [
            'status' => 'rejected',
            'note' => 'Bukti transfer tidak valid/palsu',
        ])
        ->assertOk()
        ->assertJsonPath('data.status', 'rejected');

    // Kuota kupon WAJIB dikembalikan menjadi 0 & stok produk pulih menjadi 5
    expect($coupon->refresh()->used_count)->toBe(0);
    expect($product->refresh()->stock)->toBe(5);

    // Pelanggan kini dapat menggunakan kupon itu kembali di pesanan barunya
    $this->actingAs($buyer)
        ->postJson('/api/v1/orders', [
            'recipientName' => 'Pembeli Tertolak',
            'recipientPhone' => '082299887766',
            'shippingAddress' => 'Jl. Mawar No 1',
            'paymentMethod' => 'bca_transfer',
            'couponCode' => 'REJECTPROMO',
            'idempotencyKey' => (string) Str::uuid(),
            'items' => [['productId' => $product->id, 'qty' => 1]],
        ])
        ->assertStatus(201)
        ->assertJsonPath('totals.couponDiscount', 25000);

    expect($coupon->refresh()->used_count)->toBe(1);
});
