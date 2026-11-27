<?php

use App\Enums\Role;
use App\Models\Product;
use App\Models\RealtimeEvent;
use App\Models\User;
use Illuminate\Http\UploadedFile;
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
