<?php

use App\Enums\OrderStatus;
use App\Enums\Role;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

function makeProofOrder(array $attributes = []): Order
{
    return Order::query()->create(array_merge([
        'code' => 'DLF-'.now()->format('Ymd').'-'.strtoupper(Str::random(4)),
        'status' => OrderStatus::PendingPayment,
        'recipient_name' => 'Siti Fatimah',
        'recipient_phone' => '081234567890',
        'buyer_phone' => '081234567890',
        'shipping_address' => 'Jl. Sutisna Senjaya No. 12, Tasikmalaya',
        'payment_deadline' => now()->addDay(),
        'subtotal' => 150000,
        'shipping_cost' => 15000,
        'discount' => 0,
        'total' => 165000,
        'idempotency_key' => (string) Str::uuid(),
    ], $attributes));
}

function fakePng(string $filename = 'bukti.png'): UploadedFile
{
    $pngBytes = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', true);

    return UploadedFile::fake()->createWithContent($filename, is_string($pngBytes) ? $pngBytes : '');
}

test('upload payment proof stores image in public disk and updates status to pending_verification', function () {
    Storage::fake('public');

    $order = makeProofOrder();
    $file = fakePng('bukti_transfer.png');

    $res = $this->postJson("/api/v1/orders/{$order->code}/payment-proof", [
        'proof' => $file,
    ]);

    $res->assertOk()
        ->assertJsonPath('status', 'pending_verification')
        ->assertJsonPath('paymentProofName', 'bukti_transfer.png');

    $fresh = $order->fresh();
    expect($fresh->status)->toBe(OrderStatus::PendingVerification)
        ->and($fresh->payment_proof_path)->not->toBeNull()
        ->and($fresh->payment_proof_name)->toBe('bukti_transfer.png');

    Storage::disk('public')->assertExists($fresh->payment_proof_path);
});

test('re-uploading payment proof deletes the previous proof file from storage (prevents disk bloat)', function () {
    Storage::fake('public');

    $order = makeProofOrder();

    // 1. Unggah bukti pertama (misal foto buram/salah nominal)
    $file1 = fakePng('bukti_pertama_buram.png');
    $res1 = $this->postJson("/api/v1/orders/{$order->code}/payment-proof", [
        'proof' => $file1,
    ]);
    $res1->assertOk();

    $firstPath = $order->fresh()->payment_proof_path;
    expect($firstPath)->not->toBeNull();
    Storage::disk('public')->assertExists($firstPath);

    // 2. Unggah ulang bukti kedua (foto baru yang lebih jelas)
    $file2 = fakePng('bukti_kedua_jelas.png');
    $res2 = $this->postJson("/api/v1/orders/{$order->code}/payment-proof", [
        'proof' => $file2,
    ]);
    $res2->assertOk()
        ->assertJsonPath('status', 'pending_verification')
        ->assertJsonPath('paymentProofName', 'bukti_kedua_jelas.png');

    $secondPath = $order->fresh()->payment_proof_path;
    expect($secondPath)->not->toBeNull()
        ->and($secondPath)->not->toBe($firstPath);

    // BUKTI KUNCI PENCEGAHAN DISK BLOAT:
    // File baru wajib ada di disk
    Storage::disk('public')->assertExists($secondPath);
    // File lama WAJIB SUDAH TERHAPUS dari disk, tidak menjadi sampah yatim piatu
    Storage::disk('public')->assertMissing($firstPath);
});

test('payment proof upload is rejected if order is in terminal status (e.g. paid or cancelled)', function () {
    Storage::fake('public');

    $paidOrder = makeProofOrder(['status' => OrderStatus::Paid]);
    $file = fakePng('bukti_iseng.png');

    $this->postJson("/api/v1/orders/{$paidOrder->code}/payment-proof", [
        'proof' => $file,
    ])->assertStatus(422)
        ->assertJsonPath('code', 'INVALID_ORDER_STATUS');

    Storage::disk('public')->assertDirectoryEmpty('payment-proofs');
});

test('cannot upload payment proof to another customers order (IDOR mitigation)', function () {
    Storage::fake('public');

    $owner = User::factory()->create(['role' => Role::Customer]);
    $stranger = User::factory()->create(['role' => Role::Customer]);
    $order = makeProofOrder(['user_id' => $owner->id]);

    $file = fakePng('bukti_stranger.png');

    // Orang asing mencoba mengunggah bukti bayar ke pesanan milik orang lain
    $this->actingAs($stranger)
        ->postJson("/api/v1/orders/{$order->code}/payment-proof", [
            'proof' => $file,
        ])->assertStatus(403)
        ->assertJsonPath('code', 'FORBIDDEN');

    Storage::disk('public')->assertDirectoryEmpty('payment-proofs');
});

test('guest can upload payment proof using valid unguessable order code', function () {
    Storage::fake('public');

    $guestOrder = makeProofOrder(['user_id' => null]);
    $file = fakePng('bukti_guest.png');

    $this->postJson("/api/v1/orders/{$guestOrder->code}/payment-proof", [
        'proof' => $file,
    ])->assertOk()
        ->assertJsonPath('status', 'pending_verification')
        ->assertJsonPath('paymentProofName', 'bukti_guest.png');

    Storage::disk('public')->assertExists($guestOrder->fresh()->payment_proof_path);
});
