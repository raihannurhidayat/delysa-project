<?php

use App\Enums\Role;
use App\Models\Order;
use App\Models\Product;
use App\Models\RealtimeEvent;
use App\Models\User;
use Illuminate\Database\Events\TransactionRolledBack;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

test('checkout deducts real product stock, enforces idempotency, and returns 409 on insufficient stock', function () {
    $product = Product::query()->create([
        'sku' => 'DF-TEST-001',
        'slug' => 'buket-test-mawar',
        'name' => 'Buket Test Mawar',
        'category' => 'Mawar',
        'price' => 150000,
        'stock' => 2,
        'is_published' => true,
    ]);

    $idempotencyKey = (string) Str::uuid();

    $first = $this->withHeaders(spaHeaders())->postJson('/api/v1/orders', [
        'recipientName' => 'Sinta Rahmawati',
        'recipientPhone' => '082266229917',
        'shippingAddress' => 'Jl. Pancasila Lengkongsari, Tasikmalaya',
        'paymentMethod' => 'bca_transfer',
        'idempotencyKey' => $idempotencyKey,
        'items' => [
            ['slug' => $product->slug, 'qty' => 2],
        ],
    ]);

    $first->assertCreated()
        ->assertJsonPath('status', 'pending_payment')
        ->assertJsonPath('total', 300000);

    expect($product->refresh()->stock)->toBe(0);
    expect($product->sold)->toBe(2);

    // Retry with same idempotencyKey returns existing order without failing stock
    $retry = $this->withHeaders(spaHeaders())->postJson('/api/v1/orders', [
        'recipientName' => 'Sinta Rahmawati',
        'recipientPhone' => '082266229917',
        'shippingAddress' => 'Jl. Pancasila Lengkongsari, Tasikmalaya',
        'paymentMethod' => 'bca_transfer',
        'idempotencyKey' => $idempotencyKey,
        'items' => [
            ['slug' => $product->slug, 'qty' => 2],
        ],
    ]);
    $retry->assertOk()->assertJsonPath('code', $first->json('code'));

    // Next order with insufficient stock returns 409 STOCK_INSUFFICIENT
    $this->withHeaders(spaHeaders())->postJson('/api/v1/orders', [
        'recipientName' => 'Budi Santoso',
        'recipientPhone' => '081234567890',
        'shippingAddress' => 'Jl. HZ Mustofa No 12, Tasikmalaya',
        'paymentMethod' => 'qris',
        'idempotencyKey' => (string) Str::uuid(),
        'items' => [
            ['slug' => $product->slug, 'qty' => 1],
        ],
    ])
        ->assertStatus(409)
        ->assertJsonPath('code', 'STOCK_INSUFFICIENT');

    expect(RealtimeEvent::query()->where('topic', 'orders')->exists())->toBeTrue();
    expect(RealtimeEvent::query()->where('topic', 'products')->exists())->toBeTrue();
});

test('uploads real payment proof image and updates status to pending_verification', function () {
    Storage::fake('public');

    $product = Product::query()->create([
        'sku' => 'DF-TEST-002',
        'slug' => 'buket-test-proof',
        'name' => 'Buket Test Proof',
        'category' => 'Wisuda',
        'price' => 100000,
        'stock' => 5,
        'is_published' => true,
    ]);

    $created = $this->withHeaders(spaHeaders())->postJson('/api/v1/orders', [
        'recipientName' => 'Rani Kusuma',
        'recipientPhone' => '082211223344',
        'shippingAddress' => 'Jl. Siliwangi No 5, Tasikmalaya',
        'idempotencyKey' => (string) Str::uuid(),
        'items' => [['slug' => $product->slug, 'qty' => 1]],
    ])->assertCreated();

    $orderCode = (string) $created->json('code');
    $pngBytes = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', true);
    $file = UploadedFile::fake()->createWithContent('bukti-bca.png', is_string($pngBytes) ? $pngBytes : '');

    $this->withHeaders(spaHeaders())->post("/api/v1/orders/{$orderCode}/payment-proof", [
        'proof' => $file,
    ])
        ->assertOk()
        ->assertJsonPath('status', 'pending_verification')
        ->assertJsonPath('paymentProofName', 'bukti-bca.png');
});

test('admin can manage products, verify or reject orders, and rejecting restores product stock', function () {
    $admin = User::factory()->create(['role' => Role::Admin]);

    $productResponse = $this->actingAs($admin)
        ->withHeaders(spaHeaders())
        ->postJson('/api/v1/admin/products', [
            'name' => 'Buket Mawar Spesial Admin',
            'sku' => 'DF-ADM-999',
            'category' => 'Mawar',
            'price' => 220000,
            'stock' => 4,
            'isPublished' => true,
        ])
        ->assertCreated()
        ->assertJsonPath('data.sku', 'DF-ADM-999');

    $productId = (int) $productResponse->json('data.id');

    $orderRes = $this->withHeaders(spaHeaders())->postJson('/api/v1/orders', [
        'recipientName' => 'Andi Pratama',
        'recipientPhone' => '085511223344',
        'shippingAddress' => 'Jl. Cikalang Tengah No 9, Tasikmalaya',
        'idempotencyKey' => (string) Str::uuid(),
        'items' => [['productId' => $productId, 'qty' => 3]],
    ])->assertCreated();

    expect(Product::query()->find($productId)?->stock)->toBe(1);

    $orderCode = (string) $orderRes->json('code');

    // Admin rejects order -> stock automatically restored from 1 back to 4!
    $this->actingAs($admin)
        ->withHeaders(spaHeaders())
        ->patchJson("/api/v1/admin/orders/{$orderCode}/status", [
            'status' => 'rejected',
            'note' => 'Nominal transfer tidak sesuai',
        ])
        ->assertOk()
        ->assertJsonPath('data.status', 'rejected');

    expect(Product::query()->find($productId)?->stock)->toBe(4);

    // Realtime events cursor returns newly published events
    $cursorRes = $this->getJson('/api/v1/realtime/events?since=1')->assertOk();
    expect($cursorRes->json('events'))->not->toBeEmpty();

    // Admin report reflects verified order revenue
    $paidOrder = $this->actingAs($admin)
        ->withHeaders(spaHeaders())
        ->postJson('/api/v1/admin/orders', [
            'recipientName' => 'Nadia Putri',
            'recipientPhone' => '082233445566',
            'shippingAddress' => 'Jl. Cikalang Tasikmalaya',
            'status' => 'delivered',
            'items' => [
                ['productId' => $productId, 'name' => 'Buket Mawar Spesial Admin', 'price' => 220000, 'qty' => 2],
            ],
        ])
        ->assertCreated();

    expect($paidOrder->json('data.status'))->toBe('delivered');

    $this->actingAs($admin)
        ->withHeaders(spaHeaders())
        ->getJson('/api/v1/admin/reports?period=30d')
        ->assertOk()
        ->assertJsonPath('summary.totalRevenue', 440000)
        ->assertJsonPath('summary.completedOrders', 1)
        ->assertJsonPath('summary.cancelledOrders', 1)
        ->assertJsonPath('summary.totalItemsSold', 2);
});

test('checkout calculates total price factoring in variantPriceDelta and sizeId variants', function () {
    $product = Product::query()->create([
        'sku' => 'DF-VAR-001',
        'slug' => 'buket-varian-test',
        'name' => 'Buket Varian Test',
        'category' => 'Mawar',
        'price' => 100000,
        'stock' => 10,
        'is_published' => true,
    ]);

    // 1. Pemesanan dengan sizeId 'medium' dan variantPriceDelta 45000
    $mediumRes = $this->withHeaders(spaHeaders())->postJson('/api/v1/orders', [
        'recipientName' => 'Dewi Lestari',
        'recipientPhone' => '081234567891',
        'shippingAddress' => 'Jl. Tentara Pelajar No 10, Tasikmalaya',
        'paymentMethod' => 'bca_transfer',
        'idempotencyKey' => (string) Str::uuid(),
        'items' => [
            [
                'slug' => $product->slug,
                'qty' => 1,
                'sizeId' => 'medium',
                'variantPriceDelta' => 45000,
                'variantLabel' => 'Medium (+15% bunga) / Blush Rose',
            ],
        ],
    ]);

    $mediumRes->assertCreated()
        ->assertJsonPath('items.0.price', 145000)
        ->assertJsonPath('items.0.sizeId', 'medium')
        ->assertJsonPath('totals.subtotal', 145000)
        ->assertJsonPath('totals.shipping', 15000)
        ->assertJsonPath('total', 160000);

    // 2. Pemesanan dengan sizeId 'deluxe' tanpa mengirim variantPriceDelta eksplisit (dihitung otomatis oleh BE)
    $deluxeRes = $this->withHeaders(spaHeaders())->postJson('/api/v1/orders', [
        'recipientName' => 'Dewi Lestari',
        'recipientPhone' => '081234567891',
        'shippingAddress' => 'Jl. Tentara Pelajar No 10, Tasikmalaya',
        'paymentMethod' => 'bca_transfer',
        'idempotencyKey' => (string) Str::uuid(),
        'items' => [
            [
                'slug' => $product->slug,
                'qty' => 1,
                'sizeId' => 'deluxe',
            ],
        ],
    ]);

    $deluxeRes->assertCreated()
        ->assertJsonPath('items.0.price', 195000)
        ->assertJsonPath('items.0.sizeId', 'deluxe')
        ->assertJsonPath('totals.subtotal', 195000)
        ->assertJsonPath('total', 210000);

    // 3. Pemesanan dengan variantLabel mengandung 'Medium' tanpa sizeId eksplisit
    $labelRes = $this->withHeaders(spaHeaders())->postJson('/api/v1/orders', [
        'recipientName' => 'Rina Melati',
        'recipientPhone' => '081234567892',
        'shippingAddress' => 'Jl. Sutisna Senjaya No 4, Tasikmalaya',
        'paymentMethod' => 'bca_transfer',
        'idempotencyKey' => (string) Str::uuid(),
        'items' => [
            [
                'slug' => $product->slug,
                'qty' => 2,
                'variantLabel' => 'Medium / Ivory',
            ],
        ],
    ]);

    // 2 x 145.000 = 290.000 (subtotal >= 200.000 -> gratis ongkir)
    $labelRes->assertCreated()
        ->assertJsonPath('items.0.price', 145000)
        ->assertJsonPath('totals.subtotal', 290000)
        ->assertJsonPath('totals.freeShipping', true)
        ->assertJsonPath('total', 290000);
});

test('checkout rejects invalid or tampered variantPriceDelta with 422', function () {
    $product = Product::query()->create([
        'sku' => 'DF-TAMPER-001',
        'slug' => 'buket-tamper-test',
        'name' => 'Buket Tamper Test',
        'category' => 'Mawar',
        'price' => 100000,
        'stock' => 5,
        'is_published' => true,
    ]);

    // Kirim sizeId 'deluxe' (seharusnya delta 95000) tapi memanipulasi variantPriceDelta menjadi 5000
    $res = $this->withHeaders(spaHeaders())->postJson('/api/v1/orders', [
        'recipientName' => 'Hacker Tamper',
        'recipientPhone' => '081234567899',
        'shippingAddress' => 'Jl. Gelap Gulita No 99, Tasikmalaya',
        'idempotencyKey' => (string) Str::uuid(),
        'items' => [
            [
                'slug' => $product->slug,
                'qty' => 1,
                'sizeId' => 'deluxe',
                'variantPriceDelta' => 5000,
            ],
        ],
    ]);

    $res->assertStatus(422)
        ->assertJsonPath('code', 'INVALID_VARIANT_DELTA');
});

test('checkout rejects non-existent product with 422 PRODUCT_NOT_FOUND', function () {
    $res = $this->withHeaders(spaHeaders())->postJson('/api/v1/orders', [
        'recipientName' => 'Pelanggan Asli',
        'recipientPhone' => '081234567899',
        'shippingAddress' => 'Jl. Asli No 12, Tasikmalaya',
        'idempotencyKey' => (string) Str::uuid(),
        'items' => [
            [
                'slug' => 'produk-gaib-tidak-ada',
                'qty' => 1,
                'price' => 100, // Mencoba mendikte harga
            ],
        ],
    ]);

    $res->assertStatus(422)
        ->assertJsonPath('code', 'PRODUCT_NOT_FOUND');
});

test('checkout rejects unpublished product with 422 PRODUCT_NOT_FOUND (both via slug and productId)', function () {
    $draft = Product::query()->create([
        'sku' => 'DF-DRAFT-001',
        'slug' => 'buket-draft-rahasia',
        'name' => 'Buket Draft Rahasia',
        'category' => 'Mawar',
        'price' => 200000,
        'stock' => 10,
        'is_published' => false,
    ]);

    // 1. Ditolak jika mencari lewat slug
    $this->withHeaders(spaHeaders())->postJson('/api/v1/orders', [
        'recipientName' => 'Pelanggan Penasaran',
        'recipientPhone' => '081234567899',
        'shippingAddress' => 'Jl. Rahasia No 1, Tasikmalaya',
        'idempotencyKey' => (string) Str::uuid(),
        'items' => [
            [
                'slug' => $draft->slug,
                'qty' => 1,
            ],
        ],
    ])->assertStatus(422)
        ->assertJsonPath('code', 'PRODUCT_NOT_FOUND');

    // 2. Ditolak jika mencari lewat productId
    $this->withHeaders(spaHeaders())->postJson('/api/v1/orders', [
        'recipientName' => 'Pelanggan Penasaran',
        'recipientPhone' => '081234567899',
        'shippingAddress' => 'Jl. Rahasia No 1, Tasikmalaya',
        'idempotencyKey' => (string) Str::uuid(),
        'items' => [
            [
                'productId' => $draft->id,
                'qty' => 1,
            ],
        ],
    ])->assertStatus(422)
        ->assertJsonPath('code', 'PRODUCT_NOT_FOUND');
});

test('client cannot dictate price: order total is strictly resolved from database catalog price', function () {
    $product = Product::query()->create([
        'sku' => 'DF-PRICE-001',
        'slug' => 'buket-asli-200k',
        'name' => 'Buket Asli 200k',
        'category' => 'Mawar',
        'price' => 200000,
        'stock' => 5,
        'is_published' => true,
    ]);

    // Client mencoba mengirim harga 1 rupiah
    $res = $this->withHeaders(spaHeaders())->postJson('/api/v1/orders', [
        'recipientName' => 'Hacker Cerdik',
        'recipientPhone' => '081234567899',
        'shippingAddress' => 'Jl. Cerdas No 99, Tasikmalaya',
        'idempotencyKey' => (string) Str::uuid(),
        'items' => [
            [
                'slug' => $product->slug,
                'qty' => 1,
                'price' => 1, // Manipulasi harga diabaikan oleh server!
            ],
        ],
    ]);

    $res->assertCreated()
        ->assertJsonPath('items.0.price', 200000)
        ->assertJsonPath('total', 200000); // 200000 >= free shipping limit
});

test('catches UniqueConstraintViolationException on concurrent double submission and gracefully returns 200', function () {
    $product = Product::query()->create([
        'sku' => 'DF-RACE-002',
        'slug' => 'buket-race-concurrent',
        'name' => 'Buket Concurrent Race',
        'category' => 'Mawar',
        'price' => 150000,
        'stock' => 5,
        'is_published' => true,
    ]);

    $idempotencyKey = (string) Str::uuid();

    // Simulasikan race condition:
    // 1. Thread A mengecek idempotency key di awal -> masih kosong (null).
    // 2. Thread A masuk ke DB::transaction.
    // 3. Saat Thread A hendak create order, terjadi collision UniqueConstraintViolationException
    //    (karena Thread B secara bersamaan berhasil commit order dengan idempotencyKey yang sama).
    Order::creating(function () {
        throw new UniqueConstraintViolationException(
            'sqlite',
            'insert into orders (idempotency_key) values (?)',
            [],
            new Exception('UNIQUE constraint failed: orders.idempotency_key')
        );
    });

    // 4. Ketika transaksi Thread A di-rollback oleh Laravel, simulasikan data order Thread B
    //    yang sudah ter-commit di database.
    Event::listen(TransactionRolledBack::class, function () use ($idempotencyKey) {
        if (Order::query()->where('idempotency_key', $idempotencyKey)->doesntExist()) {
            DB::table('orders')->insert([
                'code' => 'DLF-20261128-CONC',
                'idempotency_key' => $idempotencyKey,
                'status' => 'pending_payment',
                'recipient_name' => 'Concurrent Winner',
                'recipient_phone' => '081234567890',
                'buyer_phone' => '081234567890',
                'shipping_address' => 'Jl. Balap Cepat No 99',
                'payment_method' => 'bca_transfer',
                'subtotal' => 150000,
                'shipping_cost' => 15000,
                'discount' => 0,
                'total' => 165000,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    });

    // Request Thread A ini awalnya melihat idempotency_key masih kosong di luar transaksi,
    // lalu mengalami collision constraint UNIQUE saat create.
    // Controller menangkap UniqueConstraintViolationException dan mengembalikan 200 OK
    // dengan data order yang sudah ter-commit oleh Thread B!
    $res = $this->withHeaders(spaHeaders())->postJson('/api/v1/orders', [
        'recipientName' => 'Concurrent Runner-up',
        'recipientPhone' => '081234567890',
        'shippingAddress' => 'Jl. Balap Cepat No 99',
        'idempotencyKey' => $idempotencyKey,
        'items' => [['slug' => $product->slug, 'qty' => 1]],
    ]);

    $res->assertOk()
        ->assertJsonPath('code', 'DLF-20261128-CONC')
        ->assertJsonPath('recipientName', 'Concurrent Winner');

    // Pastikan stok produk tidak berkurang ganda akibat transaksi yang di-rollback
    expect($product->fresh()->stock)->toBe(5);
});
