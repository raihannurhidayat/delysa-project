<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\InsufficientStockException;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;

class OrderController extends Controller
{
    public function __construct(
        private readonly OrderService $orderService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $guestToken = $request->header('X-Guest-Token');

        $query = Order::query()
            ->with(['items', 'payment', 'histories'])
            ->latest();

        if ($user) {
            $query->where(function ($q) use ($user, $guestToken): void {
                $q->where('user_id', $user->id);
                if ($guestToken) {
                    $q->orWhere('guest_token', $guestToken);
                }
            });
        } elseif ($guestToken) {
            $query->where('guest_token', $guestToken);
        } else {
            return response()->json(['items' => []]);
        }

        $orders = $query->limit(50)->get();

        return response()->json([
            'items' => $orders->map(fn (Order $o) => $this->toOrderRecord($o))->values(),
        ]);
    }

    public function show(Request $request, string $code): JsonResponse
    {
        $order = Order::query()
            ->with(['items', 'payment', 'histories'])
            ->where('code', strtoupper(trim($code)))
            ->first();

        if (! $order) {
            return response()->json([
                'message' => 'Pesanan tidak ditemukan.',
                'code' => 'ORDER_NOT_FOUND',
            ], 404);
        }

        return response()->json($this->toOrderRecord($order));
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'recipientName' => ['required', 'string', 'min:2', 'max:100'],
            'recipientPhone' => ['required', 'string', 'min:9', 'max:20'],
            'shippingAddress' => ['required', 'string', 'min:10', 'max:500'],
            'customNote' => ['nullable', 'string', 'max:500'],
            'idempotencyKey' => ['required', 'uuid'],
            'paymentMethod' => ['nullable', 'string', 'in:manual_transfer_bca,qris,manual_transfer'],
            'couponCode' => ['nullable', 'string', 'max:32'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.productId' => ['nullable', 'integer'],
            'items.*.slug' => ['nullable', 'string'],
            'items.*.sizeId' => ['nullable', 'string', 'max:64'],
            'items.*.wrapId' => ['nullable', 'string', 'max:64'],
            'items.*.qty' => ['required', 'integer', 'min:1', 'max:99'],
            'items.*.note' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $order = $this->orderService->createOrder([
                'user_id' => $request->user()?->id,
                'guest_token' => $request->header('X-Guest-Token'),
                'recipient_name' => $validated['recipientName'],
                'recipient_phone' => $validated['recipientPhone'],
                'shipping_address' => $validated['shippingAddress'],
                'custom_note' => $validated['customNote'] ?? null,
                'idempotency_key' => $validated['idempotencyKey'],
                'payment_method' => $validated['paymentMethod'] ?? 'manual_transfer_bca',
                'coupon_code' => $validated['couponCode'] ?? null,
                'items' => array_map(fn (array $item) => [
                    'product_id' => $item['productId'] ?? null,
                    'slug' => $item['slug'] ?? null,
                    'size_id' => $item['sizeId'] ?? 'standard',
                    'wrap_id' => $item['wrapId'] ?? 'standard',
                    'qty' => (int) $item['qty'],
                    'note' => $item['note'] ?? null,
                ], $validated['items']),
            ]);
        } catch (InsufficientStockException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'code' => 'STOCK_INSUFFICIENT',
            ], 409);
        }

        return response()->json($this->toOrderRecord($order), 201);
    }

    public function uploadPaymentProof(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'proof' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $order = Order::query()->with(['items', 'payment', 'histories'])->find($id);
        if (! $order) {
            return response()->json([
                'message' => 'Pesanan tidak ditemukan.',
                'code' => 'ORDER_NOT_FOUND',
            ], 404);
        }

        $path = $request->file('proof')->store('payment-proofs', 'local');

        $payment = $order->payment;
        if ($payment) {
            $payment->proof_image_path = $path;
            $payment->status = 'pending';
            $payment->save();
        }

        if ($order->status === 'pending_payment') {
            $order->status = 'pending_verification';
            $order->save();

            OrderStatusHistory::query()->create([
                'order_id' => $order->id,
                'status' => 'pending_verification',
                'note' => 'Bukti pembayaran diunggah, menunggu verifikasi admin.',
                'changed_by' => $request->user()?->id,
                'created_at' => now(),
            ]);
        }

        return response()->json($this->toOrderRecord($order->fresh(['items', 'payment', 'histories'])));
    }

    public function viewProof(Request $request, int $id)
    {
        $order = Order::query()->with('payment')->findOrFail($id);
        $path = $order->payment?->proof_image_path;

        if (! $path || ! Storage::disk('local')->exists($path)) {
            abort(404);
        }

        return Storage::disk('local')->response($path);
    }

    /**
     * @return array<string, mixed>
     */
    public function toOrderRecord(Order $order): array
    {
        $proofUrl = $order->payment?->proof_image_path
            ? URL::temporarySignedRoute('orders.payment-proof.show', now()->addMinutes(15), ['id' => $order->id])
            : null;

        return [
            'id' => $order->id,
            'code' => $order->code,
            'status' => $order->status,
            'createdAt' => $order->created_at?->toIso8601String(),
            'updatedAt' => $order->updated_at?->toIso8601String(),
            'paymentDeadline' => $order->payment_deadline?->toIso8601String(),
            'recipientName' => $order->recipient_name,
            'recipientPhone' => $order->recipient_phone,
            'shippingAddress' => $order->shipping_address,
            'customNote' => $order->custom_note,
            'total' => $order->total,
            'courier' => $order->courier,
            'trackingNumber' => $order->tracking_number,
            'deliveredAt' => $order->delivered_at?->toIso8601String(),
            'proofImageUrl' => $proofUrl,
            'items' => $order->items->map(fn ($item) => [
                'slug' => $item->slug_snapshot,
                'name' => $item->product_name_snapshot,
                'image' => $item->image_snapshot ?? '',
                'sizeId' => $item->size_id,
                'sizeLabel' => $item->size_label,
                'wrapId' => $item->wrap_id,
                'wrapLabel' => $item->wrap_label,
                'price' => $item->unit_price_snapshot,
                'qty' => $item->qty,
                'note' => $item->note,
            ])->values(),
            'totals' => [
                'subtotal' => $order->subtotal,
                'discount' => $order->discount_amount,
                'shipping' => $order->shipping_cost,
                'total' => $order->total,
                'couponCode' => $order->coupon_code,
            ],
            'payment' => [
                'methodId' => $order->payment?->method ?? 'manual_transfer_bca',
                'label' => $order->payment?->method === 'qris' ? 'QRIS' : 'Transfer Manual BCA',
                'description' => 'Pembayaran pesanan Delysa Florist',
                'status' => $order->payment?->status ?? 'pending',
                'rejectReason' => $order->payment?->reject_reason,
                'steps' => [],
            ],
            'timeline' => $order->histories->map(fn ($h) => [
                'status' => $h->status,
                'at' => $h->created_at?->toIso8601String(),
                'note' => $h->note,
            ])->values(),
        ];
    }
}
