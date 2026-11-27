<?php

namespace App\Http\Controllers\Api\V1;

use App\Enums\OrderStatus;
use App\Enums\Role;
use App\Http\Controllers\Controller;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\Product;
use App\Models\RealtimeEvent;
use App\Models\User;
use App\Support\OrderPresenter;
use Illuminate\Database\QueryException;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    private const FREE_SHIPPING_MIN = 200000;

    private const SHIPPING_FLAT = 15000;

    public const SIZE_DELTAS = [
        'standard' => 0,
        'medium' => 45000,
        'deluxe' => 95000,
    ];

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
                    if ($user->phone !== null && $user->phone !== '') {
                        $q->orWhere('buyer_phone', $user->phone);
                    }
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

    public function show(Request $request, string $codeOrId): JsonResponse
    {
        $order = $this->resolveOrderForUser($request, $codeOrId);
        if ($order instanceof JsonResponse) {
            return $order;
        }

        return response()->json(OrderPresenter::toArray($order));
    }

    public function store(Request $request): JsonResponse
    {
        /** @var array<string, mixed> $validated */
        $validated = $request->validate([
            'recipientName' => ['required', 'string', 'min:2', 'max:120'],
            'recipientPhone' => ['required', 'string', 'min:9', 'max:32'],
            'buyerPhone' => ['nullable', 'string', 'min:9', 'max:32'],
            'shippingAddress' => ['required', 'string', 'min:10', 'max:500'],
            'customNote' => ['nullable', 'string', 'max:500'],
            'paymentMethod' => ['nullable', 'string', Rule::in(['bca_transfer', 'qris'])],
            'couponCode' => ['nullable', 'string', 'max:40'],
            'idempotencyKey' => ['required', 'string', 'max:64'],
            'items' => ['required', 'array', 'min:1', 'max:50'],
            'items.*.productId' => ['nullable'],
            'items.*.slug' => ['nullable', 'string', 'max:160'],
            'items.*.name' => ['nullable', 'string', 'max:180'],
            'items.*.price' => ['nullable', 'integer', 'min:0'],
            'items.*.qty' => ['required', 'integer', 'min:1', 'max:99'],
            'items.*.sizeId' => ['nullable', 'string', 'max:64'],
            'items.*.variantPriceDelta' => ['nullable', 'integer', 'min:0', 'max:5000000'],
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
            $order = DB::transaction(function () use ($validated, $requestedItems, $idempotencyKey, $userId, $request): Order {
                $resolvedItems = [];
                $subtotal = 0;

                foreach ($requestedItems as $line) {
                    $qty = (int) ($line['qty'] ?? 1);
                    $product = $this->lockProductForLine($line);

                    if ($product === null) {
                        $ref = is_string($line['slug'] ?? null) && trim($line['slug']) !== ''
                            ? trim($line['slug'])
                            : (string) ($line['productId'] ?? $line['name'] ?? 'Item');

                        throw new \InvalidArgumentException("PRODUCT_NOT_FOUND: Produk '{$ref}' tidak ditemukan di katalog atau sedang tidak aktif.");
                    }

                    if ($product->stock < $qty) {
                        throw new \RuntimeException('STOCK_INSUFFICIENT:'.$product->name);
                    }

                    $product->decrement('stock', $qty);
                    $product->increment('sold', $qty);

                    $pricing = $this->resolveProductVariantPricing($product, $line);
                    $unitPrice = $pricing['unitPrice'];
                    $subtotal += $unitPrice * $qty;

                    $originalPrice = $product->original_price !== null
                        ? $product->original_price + $pricing['variantPriceDelta']
                        : null;

                    $resolvedItems[] = [
                        'product_id' => $product->id,
                        'product_slug' => $product->slug,
                        'name' => $product->name,
                        'price' => $unitPrice,
                        'original_price' => $originalPrice,
                        'qty' => $qty,
                        'image_url' => $product->image_url,
                        'category' => $product->category,
                        'variant_label' => $pricing['variantLabel'],
                    ];
                }

                $buyerPhone = is_string($validated['buyerPhone'] ?? null) && trim((string) $validated['buyerPhone']) !== ''
                    ? trim((string) $validated['buyerPhone'])
                    : (string) $validated['recipientPhone'];

                $shippingCost = $subtotal >= self::FREE_SHIPPING_MIN || $subtotal === 0 ? 0 : self::SHIPPING_FLAT;
                $rawCouponCode = trim((string) ($validated['couponCode'] ?? ''));
                $discount = 0;
                $appliedCoupon = null;

                if ($rawCouponCode !== '') {
                    /** @var Coupon|null $coupon */
                    $coupon = Coupon::query()
                        ->whereRaw('UPPER(code) = ?', [strtoupper($rawCouponCode)])
                        ->lockForUpdate()
                        ->first();

                    if ($coupon !== null && $coupon->isValidForSubtotal($subtotal)) {
                        if ($coupon->isUsedByUser($userId, $buyerPhone)) {
                            throw new \InvalidArgumentException('COUPON_ALREADY_USED: Kupon ini sudah pernah Anda gunakan sebelumnya.');
                        }

                        $discount = $coupon->calculateDiscount($subtotal);
                        $appliedCoupon = $coupon;
                    }
                }

                $total = max(0, $subtotal + $shippingCost - $discount);

                $order = Order::query()->create([
                    'code' => $this->generateOrderCode(),
                    'user_id' => $userId,
                    'idempotency_key' => $idempotencyKey,
                    'status' => OrderStatus::PendingPayment,
                    'recipient_name' => (string) $validated['recipientName'],
                    'recipient_phone' => (string) $validated['recipientPhone'],
                    'buyer_phone' => $buyerPhone,
                    'shipping_address' => (string) $validated['shippingAddress'],
                    'custom_note' => is_string($validated['customNote'] ?? null) ? $validated['customNote'] : null,
                    'payment_method' => is_string($validated['paymentMethod'] ?? null) ? $validated['paymentMethod'] : 'bca_transfer',
                    'coupon_code' => $appliedCoupon?->code,
                    'payment_deadline' => now()->addDay(),
                    'subtotal' => $subtotal,
                    'shipping_cost' => $shippingCost,
                    'discount' => $discount,
                    'total' => $total,
                ]);

                if ($request->user() !== null && $request->user()->phone === null) {
                    $request->user()->update(['phone' => $buyerPhone]);
                }

                if ($appliedCoupon !== null) {
                    $appliedCoupon->incrementUsage();
                }

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
        } catch (\InvalidArgumentException $exception) {
            $msg = $exception->getMessage();
            if (str_starts_with($msg, 'PRODUCT_NOT_FOUND:')) {
                return response()->json([
                    'message' => trim(substr($msg, strlen('PRODUCT_NOT_FOUND:'))),
                    'code' => 'PRODUCT_NOT_FOUND',
                ], 422);
            }

            if (str_starts_with($msg, 'COUPON_ALREADY_USED:')) {
                return response()->json([
                    'message' => trim(substr($msg, strlen('COUPON_ALREADY_USED:'))),
                    'code' => 'COUPON_ALREADY_USED',
                ], 422);
            }

            return response()->json([
                'message' => $exception->getMessage(),
                'code' => 'INVALID_VARIANT_DELTA',
            ], 422);
        } catch (UniqueConstraintViolationException|QueryException $exception) {
            $existing = Order::query()->where('idempotency_key', $idempotencyKey)->first();
            if ($existing !== null) {
                return response()->json(OrderPresenter::toArray($existing), 200);
            }

            throw $exception;
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
        $order = $this->resolveOrderForUser($request, $codeOrId);
        if ($order instanceof JsonResponse) {
            return $order;
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

        if ($order->payment_proof_path !== null && Storage::disk('public')->exists($order->payment_proof_path)) {
            Storage::disk('public')->delete($order->payment_proof_path);
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

    public function cancel(Request $request, string $code): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $userIsStaff = in_array($user->role, [Role::Admin, Role::StoreOwner], true);
        $order = $this->findOrder($code, allowNumeric: $userIsStaff);
        if ($order === null) {
            return response()->json([
                'message' => 'Pesanan tidak ditemukan.',
                'code' => 'ORDER_NOT_FOUND',
            ], 404);
        }

        $cancelledBy = $userIsStaff ? 'admin/pemilik toko' : 'pelanggan (ID: '.$user->id.')';

        // Pelanggan biasa tidak boleh membatalkan pesanan milik akun user lain
        if (! $userIsStaff && $order->user_id !== null && $order->user_id !== $user->id) {
            return response()->json([
                'message' => 'Anda tidak memiliki hak akses untuk membatalkan pesanan ini.',
                'code' => 'FORBIDDEN',
            ], 403);
        }

        // Jika pesanan dibuat sebagai tamu (user_id === null), verifikasi kesesuaian nomor HP pembeli
        if (! $userIsStaff && $order->user_id === null) {
            $inputPhone = is_string($request->input('buyerPhone')) ? trim((string) $request->input('buyerPhone')) : null;
            $userPhone = $user->phone;
            $targetPhone = $order->buyer_phone ?? $order->recipient_phone;

            $matches = false;
            foreach ([$userPhone, $inputPhone] as $candidate) {
                if ($candidate !== null && self::normalizePhone($candidate) === self::normalizePhone($targetPhone)) {
                    $matches = true;
                    break;
                }
            }

            if (! $matches) {
                return response()->json([
                    'message' => 'Pesanan tamu ini tidak terhubung dengan nomor telepon Anda.',
                    'code' => 'FORBIDDEN',
                ], 403);
            }

            $order->user_id = $user->id;
            $order->save();
        }

        // Admin & StoreOwner dapat membatalkan pesanan dari status apapun yang masih cancellable
        // Pelanggan hanya boleh membatalkan saat masih pending_payment (belum ada bukti bayar)
        $cancellableStatuses = $userIsStaff
            ? [OrderStatus::PendingPayment, OrderStatus::PendingVerification]
            : [OrderStatus::PendingPayment];

        if (! in_array($order->status, $cancellableStatuses, true)) {
            $allowed = implode(', ', array_map(static fn (OrderStatus $s): string => $s->value, $cancellableStatuses));

            return response()->json([
                'message' => "Pesanan dengan status '{$order->status->value}' tidak dapat dibatalkan. Status yang diperbolehkan: {$allowed}.",
                'code' => 'INVALID_ORDER_STATUS',
            ], 422);
        }

        /** @var array<string, mixed> $validated */
        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:255'],
        ]);

        $reason = is_string($validated['reason'] ?? null) && trim((string) $validated['reason']) !== ''
            ? trim((string) $validated['reason'])
            : null;

        $timelineNote = $reason !== null
            ? "Pesanan dibatalkan oleh {$cancelledBy}. Alasan: {$reason}"
            : "Pesanan dibatalkan oleh {$cancelledBy}.";

        $wasCancelled = false;

        DB::transaction(function () use ($order, $timelineNote, $cancellableStatuses, &$wasCancelled): void {
            /** @var Order|null $lockedOrder */
            $lockedOrder = Order::query()->with('items')->lockForUpdate()->find($order->id);
            if ($lockedOrder === null || ! in_array($lockedOrder->status, $cancellableStatuses, true)) {
                return;
            }

            foreach ($lockedOrder->items as $item) {
                $product = null;
                if ($item->product_id !== null) {
                    $product = Product::query()->lockForUpdate()->find($item->product_id);
                } elseif ($item->product_slug !== '') {
                    $product = Product::query()
                        ->whereRaw('LOWER(slug) = ?', [strtolower($item->product_slug)])
                        ->lockForUpdate()
                        ->first();
                }

                if ($product !== null) {
                    $product->increment('stock', $item->qty);
                    $product->update([
                        'sold' => max(0, $product->sold - $item->qty),
                    ]);
                }
            }

            if ($lockedOrder->coupon_code !== null) {
                Coupon::query()
                    ->whereRaw('UPPER(code) = ?', [strtoupper($lockedOrder->coupon_code)])
                    ->lockForUpdate()
                    ->first()
                    ?->decrementUsage();
            }

            $lockedOrder->status = OrderStatus::Cancelled;
            $lockedOrder->save();

            $lockedOrder->timelines()->create([
                'status' => OrderStatus::Cancelled->value,
                'note' => $timelineNote,
                'created_at' => now(),
            ]);

            $wasCancelled = true;
        });

        if (! $wasCancelled && $order->refresh()->status !== OrderStatus::Cancelled) {
            return response()->json([
                'message' => "Pesanan dengan status '{$order->status->value}' tidak dapat dibatalkan.",
                'code' => 'INVALID_ORDER_STATUS',
            ], 422);
        }

        if ($wasCancelled) {
            RealtimeEvent::publish('orders', [
                'action' => 'status_updated',
                'code' => $order->code,
                'status' => OrderStatus::Cancelled->value,
            ]);

            RealtimeEvent::publish('products', [
                'action' => 'stock_restored',
                'code' => $order->code,
            ]);
        }

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
                ->where('is_published', true)
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
                ->where('is_published', true)
                ->where('id', (int) $productId)
                ->lockForUpdate()
                ->first();
        }

        return null;
    }

    /**
     * Resolves the unit price and variant price delta for an order line item.
     * Price is strictly dictated by the database product price + valid size delta.
     * Client-submitted prices are ignored to prevent price tampering.
     *
     * @param  array<string, mixed>  $line
     * @return array{unitPrice: int, variantPriceDelta: int, variantLabel: string|null}
     */
    private function resolveProductVariantPricing(Product $product, array $line): array
    {
        $basePrice = $product->price;
        $delta = 0;

        $sizeId = isset($line['sizeId']) && is_string($line['sizeId'])
            ? strtolower(trim($line['sizeId']))
            : null;

        if (isset($line['variantPriceDelta']) && is_numeric($line['variantPriceDelta'])) {
            $providedDelta = max(0, (int) $line['variantPriceDelta']);
            if ($sizeId !== null && array_key_exists($sizeId, self::SIZE_DELTAS)) {
                $expectedDelta = self::SIZE_DELTAS[$sizeId];
                if ($providedDelta !== $expectedDelta) {
                    throw new \InvalidArgumentException("Delta harga varian ({$providedDelta}) tidak valid untuk ukuran {$sizeId} ({$expectedDelta}).");
                }
            }
            $delta = $providedDelta;
        } elseif ($sizeId !== null && array_key_exists($sizeId, self::SIZE_DELTAS)) {
            $delta = self::SIZE_DELTAS[$sizeId];
        } elseif (isset($line['variantLabel']) && is_string($line['variantLabel'])) {
            $label = strtolower($line['variantLabel']);
            if (str_contains($label, 'deluxe')) {
                $delta = self::SIZE_DELTAS['deluxe'];
            } elseif (str_contains($label, 'medium')) {
                $delta = self::SIZE_DELTAS['medium'];
            }
        }

        $unitPrice = $basePrice + $delta;

        $variantLabel = is_string($line['variantLabel'] ?? null) && trim($line['variantLabel']) !== ''
            ? trim($line['variantLabel'])
            : ($sizeId !== null ? ucfirst($sizeId) : null);

        return [
            'unitPrice' => $unitPrice,
            'variantPriceDelta' => $delta,
            'variantLabel' => $variantLabel,
        ];
    }

    private function findOrder(string $codeOrId, bool $allowNumeric = false): ?Order
    {
        $trimmed = trim($codeOrId);
        if (ctype_digit($trimmed)) {
            if (! $allowNumeric) {
                return null;
            }

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

    /**
     * Resolves and authorizes order access based on requester role and IDOR privacy rules.
     */
    private function resolveOrderForUser(Request $request, string $codeOrId): Order|JsonResponse
    {
        $user = $request->user();
        $isStaff = $user !== null && in_array($user->role, [Role::Admin, Role::StoreOwner], true);

        $order = $this->findOrder($codeOrId, allowNumeric: $isStaff);
        if ($order === null) {
            return response()->json([
                'message' => 'Pesanan tidak ditemukan.',
                'code' => 'ORDER_NOT_FOUND',
            ], 404);
        }

        // Admin & StoreOwner dapat melihat dan mengelola semua pesanan
        if ($isStaff) {
            return $order;
        }

        // Jika requester adalah pengguna terautentikasi (pelanggan):
        if ($user !== null) {
            // Jika pesanan milik akun user lain, tolak akses (403)
            if ($order->user_id !== null && $order->user_id !== $user->id) {
                return response()->json([
                    'message' => 'Anda tidak memiliki hak akses untuk melihat pesanan ini.',
                    'code' => 'FORBIDDEN',
                ], 403);
            }

            // Jika pesanan tamu dan nomor HP cocok, hubungkan ke akun pelanggan
            if ($order->user_id === null && $user->phone !== null && $user->phone !== '') {
                $targetPhone = $order->buyer_phone ?? $order->recipient_phone;
                if (self::normalizePhone($user->phone) === self::normalizePhone($targetPhone)) {
                    $order->user_id = $user->id;
                    $order->save();
                }
            }

            return $order;
        }

        // Jika requester adalah tamu (unauthenticated):
        // Pesanan milik akun terdaftar tidak boleh diakses oleh publik/tamu tanpa login
        if ($order->user_id !== null) {
            return response()->json([
                'message' => 'Pesanan ini terhubung dengan akun terdaftar. Silakan masuk terlebih dahulu untuk melihat pesanan.',
                'code' => 'AUTH_REQUIRED',
            ], 401);
        }

        // Pesanan tamu murni (user_id === null) dapat diakses tamu yang memegang kode acak rahasia
        return $order;
    }

    public static function normalizePhone(?string $phone): string
    {
        if ($phone === null) {
            return '';
        }

        $digits = preg_replace('/\D+/', '', $phone) ?? '';
        if (str_starts_with($digits, '62')) {
            $digits = '0'.substr($digits, 2);
        }

        return $digits;
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
