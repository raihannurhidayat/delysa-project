<?php

namespace App\Services;

use App\Models\Coupon;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderStatusHistory;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ProductVariant;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use InvalidArgumentException;

class OrderService
{
    public const SHIPPING_COST_FLAT = 15000;

    /**
     * Valid status transitions for the order state machine.
     *
     * @var array<string, list<string>>
     */
    public const TRANSITIONS = [
        'pending_payment' => ['pending_verification', 'cancelled'],
        'pending_verification' => ['paid', 'rejected', 'cancelled'],
        'paid' => ['processing', 'cancelled'],
        'processing' => ['shipped'],
        'shipped' => ['delivered'],
        'delivered' => [],
        'cancelled' => [],
        'rejected' => [],
    ];

    public function __construct(
        private readonly StockService $stockService,
    ) {}

    /**
     * Create an order atomically with idempotency and soft stock reservation.
     *
     * @param  array{
     *   user_id?: int|null,
     *   guest_token?: string|null,
     *   recipient_name: string,
     *   recipient_phone: string,
     *   shipping_address: string,
     *   custom_note?: string|null,
     *   idempotency_key: string,
     *   payment_method?: string|null,
     *   coupon_code?: string|null,
     *   items: array<int, array{
     *     product_id?: int|null,
     *     slug?: string|null,
     *     size_id?: string|null,
     *     wrap_id?: string|null,
     *     qty: int,
     *     note?: string|null
     *   }>
     * }  $payload
     */
    public function createOrder(array $payload): Order
    {
        $existing = Order::query()
            ->with(['items', 'payment', 'histories'])
            ->where('idempotency_key', $payload['idempotency_key'])
            ->first();

        if ($existing) {
            return $existing;
        }

        return DB::transaction(function () use ($payload): Order {
            $resolvedLines = [];
            $stockToReserve = [];
            $subtotal = 0;

            foreach ($payload['items'] as $line) {
                $productQuery = Product::query()->where('is_active', true);
                if (! empty($line['product_id'])) {
                    $productQuery->whereKey($line['product_id']);
                } elseif (! empty($line['slug'])) {
                    $productQuery->where('slug', $line['slug']);
                } else {
                    throw new InvalidArgumentException('Item pesanan wajib menyertakan product_id atau slug.');
                }

                /** @var Product $product */
                $product = $productQuery->firstOrFail();

                $sizeId = $line['size_id'] ?? 'standard';
                $wrapId = $line['wrap_id'] ?? 'standard';

                /** @var ProductVariant|null $sizeVariant */
                $sizeVariant = $product->variants()
                    ->where('type', 'size')
                    ->where('variant_id', $sizeId)
                    ->first();
                /** @var ProductVariant|null $wrapVariant */
                $wrapVariant = $product->variants()
                    ->where('type', 'wrap')
                    ->where('variant_id', $wrapId)
                    ->first();

                $unitPrice = max(
                    0,
                    $product->price + ($sizeVariant?->price_delta ?? 0) + ($wrapVariant?->price_delta ?? 0),
                );
                $qty = max(1, (int) $line['qty']);
                $subtotal += $unitPrice * $qty;

                $resolvedLines[] = [
                    'product_id' => $product->id,
                    'product_name_snapshot' => $product->name,
                    'slug_snapshot' => $product->slug,
                    'image_snapshot' => $product->image_url,
                    'size_id' => $sizeId,
                    'size_label' => $sizeVariant?->label ?? ucfirst($sizeId),
                    'wrap_id' => $wrapId,
                    'wrap_label' => $wrapVariant?->label ?? ucfirst($wrapId),
                    'unit_price_snapshot' => $unitPrice,
                    'qty' => $qty,
                    'note' => $line['note'] ?? null,
                ];

                $stockToReserve[] = [
                    'product_id' => $product->id,
                    'qty' => $qty,
                ];
            }

            // Atomic stock reservation with lockForUpdate
            $this->stockService->reserve($stockToReserve);

            $discountAmount = 0;
            $couponCode = null;
            if (! empty($payload['coupon_code'])) {
                $coupon = Coupon::query()
                    ->where('code', strtoupper(trim($payload['coupon_code'])))
                    ->where('is_active', true)
                    ->first();

                if ($coupon && $subtotal >= $coupon->min_subtotal) {
                    $couponCode = $coupon->code;
                    $discountAmount = $coupon->discount_type === 'percent'
                        ? (int) floor($subtotal * $coupon->amount / 100)
                        : min($subtotal, $coupon->amount);
                }
            }

            $shippingCost = $subtotal >= 200000 ? 0 : self::SHIPPING_COST_FLAT;
            $total = max(0, $subtotal - $discountAmount + $shippingCost);

            $code = sprintf('DLF-%s-%s', now()->format('Ymd'), strtoupper(Str::random(4)));

            $order = Order::query()->create([
                'user_id' => $payload['user_id'] ?? null,
                'guest_token' => $payload['guest_token'] ?? null,
                'code' => $code,
                'idempotency_key' => $payload['idempotency_key'],
                'status' => 'pending_payment',
                'subtotal' => $subtotal,
                'discount_amount' => $discountAmount,
                'coupon_code' => $couponCode,
                'shipping_cost' => $shippingCost,
                'total' => $total,
                'recipient_name' => $payload['recipient_name'],
                'recipient_phone' => $payload['recipient_phone'],
                'shipping_address' => $payload['shipping_address'],
                'custom_note' => $payload['custom_note'] ?? null,
                'payment_deadline' => now()->addHours(24),
            ]);

            foreach ($resolvedLines as $lineData) {
                OrderItem::query()->create([
                    'order_id' => $order->id,
                    ...$lineData,
                ]);
            }

            Payment::query()->create([
                'order_id' => $order->id,
                'method' => $payload['payment_method'] ?? 'manual_transfer_bca',
                'status' => 'pending',
            ]);

            OrderStatusHistory::query()->create([
                'order_id' => $order->id,
                'status' => 'pending_payment',
                'note' => 'Pesanan dibuat, menunggu pembayaran.',
                'changed_by' => $payload['user_id'] ?? null,
                'created_at' => now(),
            ]);

            return $order->load(['items', 'payment', 'histories']);
        });
    }

    public function transitionStatus(
        Order $order,
        string $nextStatus,
        ?int $actorId = null,
        ?string $note = null,
        ?string $courier = null,
        ?string $trackingNumber = null,
    ): Order {
        $allowed = self::TRANSITIONS[$order->status] ?? [];
        if (! in_array($nextStatus, $allowed, true)) {
            throw new InvalidArgumentException(
                "Transisi status dari '{$order->status}' ke '{$nextStatus}' tidak diizinkan."
            );
        }

        return DB::transaction(function () use ($order, $nextStatus, $actorId, $note, $courier, $trackingNumber): Order {
            if ($nextStatus === 'paid') {
                $this->stockService->commitSale($order, $actorId);
            } elseif (in_array($nextStatus, ['cancelled', 'rejected'], true)
                && in_array($order->status, ['pending_payment', 'pending_verification'], true)) {
                $this->stockService->restore($order, $actorId, $note ?? "Status {$nextStatus}");
            }

            $order->status = $nextStatus;
            if ($courier !== null) {
                $order->courier = $courier;
            }
            if ($trackingNumber !== null) {
                $order->tracking_number = $trackingNumber;
            }
            if ($nextStatus === 'delivered') {
                $order->delivered_at = now();
            }
            $order->save();

            OrderStatusHistory::query()->create([
                'order_id' => $order->id,
                'status' => $nextStatus,
                'note' => $note,
                'changed_by' => $actorId,
                'created_at' => now(),
            ]);

            return $order->fresh(['items', 'payment', 'histories']);
        });
    }
}
