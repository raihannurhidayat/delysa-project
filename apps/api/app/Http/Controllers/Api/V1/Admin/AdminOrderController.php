<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\RealtimeEvent;
use App\Support\OrderPresenter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminOrderController extends Controller
{
    public function index(): JsonResponse
    {
        $orders = Order::query()
            ->with(['items', 'timelines'])
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->limit(200)
            ->get()
            ->map(static fn (Order $order): array => OrderPresenter::toArray($order))
            ->values()
            ->all();

        return response()->json(['data' => $orders]);
    }

    public function store(Request $request): JsonResponse
    {
        /** @var array<string, mixed> $validated */
        $validated = $request->validate([
            'recipientName' => ['required', 'string', 'min:2', 'max:120'],
            'recipientPhone' => ['required', 'string', 'min:9', 'max:32'],
            'shippingAddress' => ['required', 'string', 'min:5', 'max:500'],
            'customNote' => ['nullable', 'string', 'max:500'],
            'paymentMethod' => ['nullable', 'string', Rule::in(['bca_transfer', 'qris'])],
            'status' => ['nullable', 'string', Rule::in(OrderStatus::values())],
            'items' => ['required', 'array', 'min:1'],
            'items.*.productId' => ['nullable'],
            'items.*.slug' => ['nullable', 'string', 'max:160'],
            'items.*.name' => ['required', 'string', 'max:180'],
            'items.*.price' => ['required', 'integer', 'min:0'],
            'items.*.qty' => ['required', 'integer', 'min:1', 'max:99'],
        ]);

        /** @var list<array<string, mixed>> $items */
        $items = $validated['items'];
        $status = OrderStatus::tryFrom((string) ($validated['status'] ?? 'paid')) ?? OrderStatus::Paid;

        $order = DB::transaction(function () use ($validated, $items, $status): Order {
            $subtotal = 0;
            $lines = [];

            foreach ($items as $line) {
                $qty = (int) $line['qty'];
                $price = (int) $line['price'];
                $subtotal += $price * $qty;

                $product = null;
                if (is_numeric($line['productId'] ?? null)) {
                    $product = Product::query()->lockForUpdate()->find((int) $line['productId']);
                } elseif (is_string($line['slug'] ?? null) && trim($line['slug']) !== '') {
                    $product = Product::query()
                        ->whereRaw('LOWER(slug) = ?', [strtolower(trim($line['slug']))])
                        ->lockForUpdate()
                        ->first();
                }

                if ($product !== null && $product->stock >= $qty) {
                    $product->decrement('stock', $qty);
                    $product->increment('sold', $qty);
                }

                $lines[] = [
                    'product_id' => $product?->id,
                    'product_slug' => $product !== null
                        ? $product->slug
                        : (is_string($line['slug'] ?? null) ? $line['slug'] : Str::slug((string) $line['name'])),
                    'name' => (string) $line['name'],
                    'price' => $price,
                    'original_price' => $product?->original_price,
                    'qty' => $qty,
                    'image_url' => $product?->image_url,
                    'category' => $product !== null ? $product->category : 'Buket',
                ];
            }

            $date = now()->format('Ymd');
            do {
                $code = 'DLF-'.$date.'-'.strtoupper(Str::random(4));
            } while (Order::query()->where('code', $code)->exists());

            $order = Order::query()->create([
                'code' => $code,
                'status' => $status,
                'recipient_name' => (string) $validated['recipientName'],
                'recipient_phone' => (string) $validated['recipientPhone'],
                'shipping_address' => (string) $validated['shippingAddress'],
                'custom_note' => is_string($validated['customNote'] ?? null) ? $validated['customNote'] : null,
                'payment_method' => is_string($validated['paymentMethod'] ?? null) ? $validated['paymentMethod'] : 'bca_transfer',
                'payment_deadline' => now()->addDay(),
                'subtotal' => $subtotal,
                'shipping_cost' => 0,
                'discount' => 0,
                'total' => $subtotal,
            ]);

            foreach ($lines as $itemData) {
                $order->items()->create($itemData);
            }

            $order->timelines()->create([
                'status' => $status->value,
                'note' => 'Pesanan manual dicatat oleh admin',
                'created_at' => now(),
            ]);

            return $order;
        });

        RealtimeEvent::publish('orders', ['action' => 'created_manual', 'code' => $order->code]);
        RealtimeEvent::publish('products', ['action' => 'stock_changed', 'code' => $order->code]);

        return response()->json(['data' => OrderPresenter::toArray($order)], 201);
    }

    public function updateStatus(Request $request, string $codeOrId): JsonResponse
    {
        /** @var array<string, mixed> $validated */
        $validated = $request->validate([
            'status' => ['required', 'string', Rule::in(OrderStatus::values())],
            'note' => ['nullable', 'string', 'max:500'],
            'courier' => ['nullable', 'string', 'max:100'],
            'trackingNumber' => ['nullable', 'string', 'max:100'],
        ]);

        $order = ctype_digit(trim($codeOrId))
            ? Order::query()->with(['items', 'timelines'])->find((int) trim($codeOrId))
            : Order::query()->with(['items', 'timelines'])->whereRaw('UPPER(code) = ?', [strtoupper(trim($codeOrId))])->first();

        if ($order === null) {
            return response()->json([
                'message' => 'Pesanan tidak ditemukan.',
                'code' => 'ORDER_NOT_FOUND',
            ], 404);
        }

        $nextStatus = OrderStatus::from((string) $validated['status']);

        if (! $order->status->canTransitionTo($nextStatus)) {
            return response()->json([
                'message' => "Transisi status dari {$order->status->value} ke {$nextStatus->value} tidak diizinkan.",
                'code' => 'INVALID_TRANSITION',
            ], 422);
        }

        $previousStatus = $order->status;
        $restoredStock = false;

        DB::transaction(function () use ($order, $previousStatus, $nextStatus, $validated, &$restoredStock): void {
            if (! $previousStatus->restoresStock() && $nextStatus->restoresStock()) {
                foreach ($order->items as $item) {
                    if ($item->product_id !== null) {
                        $product = Product::query()->lockForUpdate()->find($item->product_id);
                        if ($product !== null) {
                            $product->increment('stock', $item->qty);
                            $product->update(['sold' => max(0, $product->sold - $item->qty)]);
                            $restoredStock = true;
                        }
                    }
                }
            }

            $order->status = $nextStatus;
            if (is_string($validated['courier'] ?? null)) {
                $order->courier = $validated['courier'];
            }
            if (is_string($validated['trackingNumber'] ?? null)) {
                $order->tracking_number = $validated['trackingNumber'];
            }
            if ($nextStatus === OrderStatus::Delivered && $order->delivered_at === null) {
                $order->delivered_at = now();
            }
            $order->save();

            if ($previousStatus !== $nextStatus || is_string($validated['note'] ?? null)) {
                $order->timelines()->create([
                    'status' => $nextStatus->value,
                    'note' => is_string($validated['note'] ?? null) ? $validated['note'] : null,
                    'created_at' => now(),
                ]);
            }
        });

        RealtimeEvent::publish('orders', [
            'action' => 'status_updated',
            'code' => $order->code,
            'status' => $nextStatus->value,
        ]);

        if ($restoredStock) {
            RealtimeEvent::publish('products', [
                'action' => 'stock_restored',
                'code' => $order->code,
            ]);
        }

        return response()->json(['data' => OrderPresenter::toArray($order->refresh())]);
    }

    public function report(Request $request): JsonResponse
    {
        $period = (string) $request->query('period', '30d');
        if (! in_array($period, ['7d', '30d', 'all'], true)) {
            $period = '30d';
        }

        $query = Order::query()->with('items')->orderByDesc('created_at')->orderByDesc('id');
        if ($period === '7d') {
            $query->where('created_at', '>=', now()->subDays(7));
        } elseif ($period === '30d') {
            $query->where('created_at', '>=', now()->subDays(30));
        }

        $orders = $query->get();

        $paidStatuses = [
            OrderStatus::Paid,
            OrderStatus::Processing,
            OrderStatus::Shipped,
            OrderStatus::Delivered,
        ];
        $pendingStatuses = [
            OrderStatus::PendingPayment,
            OrderStatus::PendingVerification,
        ];
        $closedStatuses = [
            OrderStatus::Cancelled,
            OrderStatus::Rejected,
        ];

        $verifiedOrders = $orders->filter(
            static fn (Order $order): bool => in_array($order->status, $paidStatuses, true),
        );
        $totalRevenue = (int) $verifiedOrders->sum('total');
        $completedOrders = $orders->filter(
            static fn (Order $order): bool => $order->status === OrderStatus::Delivered,
        )->count();
        $pendingOrders = $orders->filter(
            static fn (Order $order): bool => in_array($order->status, $pendingStatuses, true),
        )->count();
        $cancelledOrders = $orders->filter(
            static fn (Order $order): bool => in_array($order->status, $closedStatuses, true),
        )->count();
        $verifiedCount = $verifiedOrders->count();
        $averageOrderValue = $verifiedCount > 0 ? (int) round($totalRevenue / $verifiedCount) : 0;

        /** @var array<string, array{category: string, qty: int, revenue: int}> $categoryMap */
        $categoryMap = [];
        /** @var array<string, array{name: string, slug: string, category: string, qty: int, revenue: int}> $productMap */
        $productMap = [];
        $totalItemsSold = 0;

        foreach ($verifiedOrders as $order) {
            foreach ($order->items as $item) {
                /** @var OrderItem $item */
                $lineRevenue = $item->price * $item->qty;
                $category = $item->category ?? 'Lainnya';
                $totalItemsSold += $item->qty;

                if (! isset($categoryMap[$category])) {
                    $categoryMap[$category] = [
                        'category' => $category,
                        'qty' => 0,
                        'revenue' => 0,
                    ];
                }
                $categoryMap[$category]['qty'] += $item->qty;
                $categoryMap[$category]['revenue'] += $lineRevenue;

                $key = $item->product_slug;
                if (! isset($productMap[$key])) {
                    $productMap[$key] = [
                        'name' => $item->name,
                        'slug' => $item->product_slug,
                        'category' => $category,
                        'qty' => 0,
                        'revenue' => 0,
                    ];
                }
                $productMap[$key]['qty'] += $item->qty;
                $productMap[$key]['revenue'] += $lineRevenue;
            }
        }

        $byCategory = array_values($categoryMap);
        usort($byCategory, static fn (array $a, array $b): int => $b['revenue'] <=> $a['revenue']);

        $topProducts = array_values($productMap);
        usort($topProducts, static fn (array $a, array $b): int => $b['revenue'] <=> $a['revenue']);
        $topProducts = array_slice($topProducts, 0, 8);

        $recentOrders = $orders->take(10)->map(static fn (Order $order): array => [
            'code' => $order->code,
            'recipientName' => $order->recipient_name,
            'status' => $order->status->value,
            'total' => $order->total,
            'createdAt' => ($order->created_at ?? now())->toISOString(),
        ])->values()->all();

        return response()->json([
            'period' => $period,
            'summary' => [
                'totalRevenue' => $totalRevenue,
                'totalOrders' => $orders->count(),
                'completedOrders' => $completedOrders,
                'pendingOrders' => $pendingOrders,
                'cancelledOrders' => $cancelledOrders,
                'averageOrderValue' => $averageOrderValue,
                'totalItemsSold' => $totalItemsSold,
            ],
            'byCategory' => $byCategory,
            'topProducts' => $topProducts,
            'recentOrders' => $recentOrders,
        ]);
    }
}
