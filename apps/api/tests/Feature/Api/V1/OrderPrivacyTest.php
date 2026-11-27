<?php

use App\Enums\OrderStatus;
use App\Enums\Role;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

function createTestOrder(array $attributes = []): Order
{
    return Order::query()->create(array_merge([
        'code' => 'DLF-'.now()->format('Ymd').'-'.strtoupper(Str::random(4)),
        'status' => OrderStatus::PendingPayment,
        'recipient_name' => 'Budi Sudarsono',
        'recipient_phone' => '081234567890',
        'buyer_phone' => '081234567890',
        'shipping_address' => 'Jl. Merdeka No. 45, Tasikmalaya',
        'payment_deadline' => now()->addDay(),
        'subtotal' => 100000,
        'shipping_cost' => 15000,
        'discount' => 0,
        'total' => 115000,
        'idempotency_key' => (string) Str::uuid(),
    ], $attributes));
}

test('public and guest users cannot query order using sequential integer ID (IDOR mitigation)', function () {
    $order = createTestOrder();

    // Guest lookup using numeric ID must return 404
    $this->getJson("/api/v1/orders/{$order->id}")
        ->assertStatus(404)
        ->assertJsonPath('code', 'ORDER_NOT_FOUND');
});

test('authenticated customer cannot query order using sequential integer ID', function () {
    $customer = User::factory()->create(['role' => Role::Customer]);
    $order = createTestOrder(['user_id' => $customer->id]);

    // Customer lookup using numeric ID must also return 404 (only alphanumeric code allowed)
    $this->actingAs($customer)
        ->getJson("/api/v1/orders/{$order->id}")
        ->assertStatus(404)
        ->assertJsonPath('code', 'ORDER_NOT_FOUND');
});

test('admin can query order using either sequential integer ID or order code', function () {
    $admin = User::factory()->create(['role' => Role::Admin]);
    $order = createTestOrder();

    // Admin lookup using numeric ID succeeds
    $this->actingAs($admin)
        ->getJson("/api/v1/orders/{$order->id}")
        ->assertOk()
        ->assertJsonPath('code', $order->code);

    // Admin lookup using code succeeds
    $this->actingAs($admin)
        ->getJson("/api/v1/orders/{$order->code}")
        ->assertOk()
        ->assertJsonPath('code', $order->code);
});

test('customer A cannot view customer B order (returns 403 Forbidden)', function () {
    $customerA = User::factory()->create(['role' => Role::Customer]);
    $customerB = User::factory()->create(['role' => Role::Customer]);

    $orderB = createTestOrder(['user_id' => $customerB->id]);

    $this->actingAs($customerA)
        ->getJson("/api/v1/orders/{$orderB->code}")
        ->assertStatus(403)
        ->assertJsonPath('code', 'FORBIDDEN');
});

test('customer can view their own order using order code', function () {
    $customer = User::factory()->create(['role' => Role::Customer]);
    $order = createTestOrder(['user_id' => $customer->id]);

    $this->actingAs($customer)
        ->getJson("/api/v1/orders/{$order->code}")
        ->assertOk()
        ->assertJsonPath('code', $order->code)
        ->assertJsonPath('recipientName', 'Budi Sudarsono');
});

test('unauthenticated guest cannot view registered user order code (returns 401 AUTH_REQUIRED)', function () {
    $customer = User::factory()->create(['role' => Role::Customer]);
    $order = createTestOrder(['user_id' => $customer->id]);

    $this->getJson("/api/v1/orders/{$order->code}")
        ->assertStatus(401)
        ->assertJsonPath('code', 'AUTH_REQUIRED');
});

test('unauthenticated guest can view guest order using alphanumeric order code', function () {
    $order = createTestOrder(['user_id' => null]);

    $this->getJson("/api/v1/orders/{$order->code}")
        ->assertOk()
        ->assertJsonPath('code', $order->code);
});

test('logged in customer viewing guest order with matching phone auto-claims it', function () {
    $customer = User::factory()->create([
        'role' => Role::Customer,
        'phone' => '082211335577',
    ]);

    $guestOrder = createTestOrder([
        'user_id' => null,
        'buyer_phone' => '6282211335577',
    ]);

    $this->actingAs($customer)
        ->getJson("/api/v1/orders/{$guestOrder->code}")
        ->assertOk();

    expect($guestOrder->refresh()->user_id)->toBe($customer->id);
});

test('payment proof upload enforces IDOR and ownership checks', function () {
    Storage::fake('public');

    $customerA = User::factory()->create(['role' => Role::Customer]);
    $customerB = User::factory()->create(['role' => Role::Customer]);

    $orderA = createTestOrder(['user_id' => $customerA->id]);
    $guestOrder = createTestOrder(['user_id' => null]);

    $pngBytes = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', true);
    $file = UploadedFile::fake()->createWithContent('bukti.png', is_string($pngBytes) ? $pngBytes : '');

    // 1. Upload using numeric ID is rejected with 404 for non-admin
    $this->postJson("/api/v1/orders/{$orderA->id}/payment-proof", ['proof' => $file])
        ->assertStatus(404)
        ->assertJsonPath('code', 'ORDER_NOT_FOUND');

    // 2. Unauthenticated guest cannot upload proof to registered user order
    $this->postJson("/api/v1/orders/{$orderA->code}/payment-proof", ['proof' => $file])
        ->assertStatus(401)
        ->assertJsonPath('code', 'AUTH_REQUIRED');

    // 3. Customer B cannot upload proof to Customer A order
    $this->actingAs($customerB)
        ->postJson("/api/v1/orders/{$orderA->code}/payment-proof", ['proof' => $file])
        ->assertStatus(403)
        ->assertJsonPath('code', 'FORBIDDEN');

    // 4. Guest can upload proof to their own guest order
    $this->postJson("/api/v1/orders/{$guestOrder->code}/payment-proof", ['proof' => $file])
        ->assertOk()
        ->assertJsonPath('status', 'pending_verification')
        ->assertJsonPath('paymentProofName', 'bukti.png');

    // 5. Customer A can upload proof to their own order
    $this->actingAs($customerA)
        ->postJson("/api/v1/orders/{$orderA->code}/payment-proof", ['proof' => $file])
        ->assertOk()
        ->assertJsonPath('status', 'pending_verification');
});
