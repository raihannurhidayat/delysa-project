<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\OrderStatus;
use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\RealtimeEvent;
use App\Support\OrderPresenter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    private const FREE_SHIPPING_MIN = 200000;

    private const SHIPPING_FLAT = 15000;

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $codesRaw = trim((string) $request->query('codes', ''));
        $codes = $codesRaw !== ''
            ? array_slice(
                array_values(array_filter(array_map(
                    static fn (string $c): string => strtoupper(trim($c)),
                    explode(',', $codesRaw),
                ))),
                0,
                50,
            )
            : [];

        $query = Order::query()->with(['items', 'timelines'])->orderByDesc('created_at')->orderByDesc('id');

        if ($user !== null && in_array($user->role, [Role::Admin, Role::StoreOwner], true)) {
            $orders = $query->limit(200)->get();
        } elseif ($user !== null) {
            $orders = $query
                ->where(static function ($q) use ($user, $codes): void {
                    $q->where('user_id', $user->id);
                    if ($codes !== []) {
                        $q->orWhereIn('code', $codes);
                    }
                })
                ->limit(100)
                ->get();
        } elseif ($codes !== []) {
            $orders = $query->whereIn('code', $codes)->limit(50)->get();
        } else {
            $orders = collect();
        }

        return response()->json([
            'data' => $orders->map(static fn (Order $o): array => OrderPresenter::toArray($o))->values()->all(),
        ]);
    }

    public function show(string $codeOrId): JsonResponse
    {
        $order = $this->findOrder($codeOrId);
        if ($order === null) {
            return response()->json([
                'message' => 'Pesanan tidak ditemukan.',
                'code' => 'ORDER_NOT_FOUND',
            ], 404);
        }

        return response()->json(OrderPresenter::toArray($order));
    }

    public function store(Request $request): JsonResponse
    {
        /** @var array<string, mixed> $validated */
        $validated = $request->validate([
            'recipientName' => ['required', 'string', 'min:2', 'max:120'],
            'recipientPhone' => ['required', 'string', 'min:9', 'max:32'],
            'shippingAddress' => ['required', 'string', 'min:10', 'max:500'],
            'customNote' => ['nullable', 'string', 'max:500'],
            'paymentMethod' => ['nullable', 'string', Rule::in(['bca_transfer', 'qris'])],
            'couponCode' => ['nullable', 'string', 'max:40'],
            'idempotencyKey' => ['required', 'string', 'max:64'],
            'items' => ['nullable', 'array', 'min:1', 'max:50'],
            'items.*.productId' => ['nullable'],
            'items.*.slug' => ['nullable', 'string', 'max:160'],
            'items.*.name' => ['nullable', 'string', 'max:180'],
            'items.*.price' => ['nullable', 'integer', 'min:0'],
            'items.*.qty' => ['required_with:items', 'integer', 'min:1', 'max:99'],
            'items.*.variantLabel' => ['nullable', 'string', 'max:120'],
        ]);

        $idempotencyKey = (string) $validated['idempotencyKey'];
        $existing = Order::query()->where('idempotency_key', $idempotencyKey)->first();
        if ($existing !== null) {
            return response()->json(OrderPresenter::toArray($existing), 200);
        }

        /** @var list<array<string, mixed>> $requestedItems */
        $requestedItems = is_array($validated['items'] ?? null) ? $validated['items'] : [];
        $userId = $request->user()?->id;

        try {
            $order = DB::transaction(function () use ($validated, $requestedItems, $idempotencyKey, $userId): Order {
                $resolvedItems = [];
                $subtotal = 0;

                foreach ($requestedItems as $line) {
                    $qty = (int) ($line['qty'] ?? 1);
                    $product = $this->lockProductForLine($line);

                    if ($product !== null) {
                        if ($product->stock < $qty) {
                            throw new \RuntimeException('STOCK_INSUFFICIENT:'.$product->name);
                        }

                        $product->decrement('stock', $qty);
                        $product->increment('sold', $qty);

                        $unitPrice = $product->price;
                        $subtotal += $unitPrice * $qty;
                        $resolvedItems[] = [
                            'product_id' => $product->id,
                            'product_slug' => $product->slug,
                            'name' => $product->name,
                            'price' => $unitPrice,
                            'original_price' => $product->original_price,
                            'qty' => $qty,
                            'image_url' => $product->image_url,
                            'category' => $product->category,
                            'variant_label' => is_string($line['variantLabel'] ?? null) ? $line['variantLabel'] : null,
                        ];
                    } else {
                        $unitPrice = max(0, (int) ($line['price'] ?? 0));
                        $subtotal += $unitPrice * $qty;
                        $resolvedItems[] = [
                            'product_id' => null,
                            'product_slug' => is_string($line['slug'] ?? null) ? $line['slug'] : 'custom-item',
                            'name' => is_string($line['name'] ?? null) ? $line['name'] : 'Rangkaian Delysa',
                            'price' => $unitPrice,
                            'original_price' => null,
                            'qty' => $qty,
                            'image_url' => null,
                            'category' => 'Buket',
                            'variant_label' => is_string($line['variantLabel'] ?? null) ? $line['variantLabel'] : null,
                        ];
                    }
                }

                $shippingCost = $subtotal >= self::FREE_SHIPPING_MIN || $subtotal === 0 ? 0 : self::SHIPPING_FLAT;
                $couponCode = strtoupper(trim((string) ($validated['couponCode'] ?? '')));
                $discount = $couponCode === 'DELYSAWISUDA'
                    ? min(30000, (int) round($subtotal * 0.1))
                    : 0;
                $total = max(0, $subtotal + $shippingCost - $discount);

                $order = Order::query()->create([
                    'code' => $this->generateOrderCode(),
                    'user_id' => $userId,
                    'idempotency_key' => $idempotencyKey,
                    'status' => OrderStatus::PendingPayment,
                    'recipient_name' => (string) $validated['recipientName'],
                    'recipient_phone' => (string) $validated['recipientPhone'],
                    'shipping_address' => (string) $validated['shippingAddress'],
                    'custom_note' => is_string($validated['customNote'] ?? null) ? $validated['customNote'] : null,
                    'payment_method' => is_string($validated['paymentMethod'] ?? null) ? $validated['paymentMethod'] : 'bca_transfer',
                    'payment_deadline' => now()->addDay(),
                    'subtotal' => $subtotal,
                    'shipping_cost' => $shippingCost,
                    'discount' => $discount,
                    'total' => $total,
                ]);

                foreach ($resolvedItems as $itemData) {
                    $order->items()->create($itemData);
                }

                $order->timelines()->create([
                    'status' => OrderStatus::PendingPayment->value,
                    'note' => 'Pesanan dibuat oleh pelanggan',
                    'created_at' => now(),
                ]);

                return $order;
            });
        } catch (\RuntimeException $exception) {
            if (str_starts_with($exception->getMessage(), 'STOCK_INSUFFICIENT:')) {
                $productName = substr($exception->getMessage(), strlen('STOCK_INSUFFICIENT:'));

                return response()->json([
                    'message' => "STOCK_INSUFFICIENT: Stok tidak mencukupi untuk {$productName}.",
                    'code' => 'STOCK_INSUFFICIENT',
                ], 409);
            }

            throw $exception;
        }

        RealtimeEvent::publish('orders', ['action' => 'created', 'code' => $order->code]);
        RealtimeEvent::publish('products', ['action' => 'stock_changed', 'code' => $order->code]);

        return response()->json(OrderPresenter::toArray($order), 201);
    }

    public function uploadPaymentProof(Request $request, string $codeOrId): JsonResponse
    {
        $order = $this->findOrder($codeOrId);
        if ($order === null) {
            return response()->json([
                'message' => 'Pesanan tidak ditemukan.',
                'code' => 'ORDER_NOT_FOUND',
            ], 404);
        }

        if ($order->status !== OrderStatus::PendingPayment && $order->status !== OrderStatus::PendingVerification) {
            return response()->json([
                'message' => 'Status pesanan saat ini tidak menerima unggahan bukti pembayaran.',
                'code' => 'INVALID_ORDER_STATUS',
            ], 422);
        }

        $request->validate([
            'proof' => ['required', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $file = $request->file('proof');
        if ($file === null) {
            return response()->json(['message' => 'File bukti wajib diunggah.'], 422);
        }

        $storedPath = $file->store('payment-proofs', 'public');
        if (! is_string($storedPath)) {
            return response()->json(['message' => 'Gagal menyimpan file bukti pembayaran.'], 500);
        }

        $order->forceFill([
            'payment_proof_path' => $storedPath,
            'payment_proof_name' => $file->getClientOriginalName(),
            'status' => OrderStatus::PendingVerification,
        ])->save();

        $order->timelines()->create([
            'status' => OrderStatus::PendingVerification->value,
            'note' => 'Bukti pembayaran diunggah pelanggan, menunggu verifikasi admin',
            'created_at' => now(),
        ]);

        RealtimeEvent::publish('orders', [
            'action' => 'proof_uploaded',
            'code' => $order->code,
            'status' => $order->status->value,
        ]);

        return response()->json(OrderPresenter::toArray($order->refresh()));
    }

    /**
     * @param  array<string, mixed>  $line
     */
    private function lockProductForLine(array $line): ?Product
    {
        $slug = is_string($line['slug'] ?? null) ? trim($line['slug']) : '';
        if ($slug !== '') {
            $bySlug = Product::query()
                ->whereRaw('LOWER(slug) = ?', [strtolower($slug)])
                ->lockForUpdate()
                ->first();
            if ($bySlug !== null) {
                return $bySlug;
            }
        }

        $productId = $line['productId'] ?? null;
        if (is_numeric($productId)) {
            return Product::query()
                ->where('id', (int) $productId)
                ->lockForUpdate()
                ->first();
        }

        return null;
    }

    private function findOrder(string $codeOrId): ?Order
    {
        $trimmed = trim($codeOrId);
        if (ctype_digit($trimmed)) {
            $byId = Order::query()->with(['items', 'timelines'])->find((int) $trimmed);
            if ($byId !== null) {
                return $byId;
            }
        }

        return Order::query()
            ->with(['items', 'timelines'])
            ->whereRaw('UPPER(code) = ?', [strtoupper($trimmed)])
            ->first();
    }

    private function generateOrderCode(): string
    {
        $date = now()->format('Ymd');
        do {
            $code = 'DLF-'.$date.'-'.strtoupper(Str::random(4));
        } while (Order::query()->where('code', $code)->exists());

        return $code;
    }
}
