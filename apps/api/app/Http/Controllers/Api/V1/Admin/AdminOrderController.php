<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\OrderController;
use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Product;
use App\Models\StockMovement;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;

class AdminOrderController extends Controller
{
    public function __construct(
        private readonly OrderService $orderService,
        private readonly OrderController $orderSerializer,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Order::query()
            ->with(['items', 'payment', 'histories'])
            ->latest();

        if ($status = $request->query('status')) {
            if ($status !== 'all') {
                $query->where('status', $status);
            }
        }

        $orders = $query->limit(100)->get();

        return response()->json([
            'items' => $orders->map(fn (Order $o) => $this->orderSerializer->toOrderRecord($o))->values(),
        ]);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'string', 'in:pending_payment,pending_verification,paid,processing,shipped,delivered,cancelled,rejected'],
            'note' => ['nullable', 'string', 'max:500'],
            'courier' => ['nullable', 'string', 'max:100'],
            'trackingNumber' => ['nullable', 'string', 'max:100'],
        ]);

        $order = Order::query()->with(['items', 'payment', 'histories'])->findOrFail($id);

        try {
            $updated = $this->orderService->transitionStatus(
                $order,
                $validated['status'],
                $request->user()?->id,
                $validated['note'] ?? null,
                $validated['courier'] ?? null,
                $validated['trackingNumber'] ?? null,
            );
        } catch (InvalidArgumentException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'code' => 'INVALID_STATUS_TRANSITION',
            ], 422);
        }

        return response()->json($this->orderSerializer->toOrderRecord($updated));
    }

    public function verifyPayment(Request $request, int $id): JsonResponse
    {
        $validated = $request->validate([
            'action' => ['required', 'string', 'in:verify,reject'],
            'rejectReason' => ['required_if:action,reject', 'nullable', 'string', 'max:500'],
        ]);

        $payment = Payment::query()->with('order.items')->findOrFail($id);
        $order = $payment->order;

        if ($validated['action'] === 'verify') {
            $payment->status = 'verified';
            $payment->verified_by = $request->user()?->id;
            $payment->verified_at = now();
            $payment->save();

            $updated = $this->orderService->transitionStatus(
                $order,
                'paid',
                $request->user()?->id,
                'Pembayaran diverifikasi oleh admin.',
            );
        } else {
            $payment->status = 'rejected';
            $payment->reject_reason = $validated['rejectReason'];
            $payment->verified_by = $request->user()?->id;
            $payment->verified_at = now();
            $payment->save();

            $updated = $this->orderService->transitionStatus(
                $order,
                'rejected',
                $request->user()?->id,
                "Pembayaran ditolak: {$validated['rejectReason']}",
            );
        }

        return response()->json($this->orderSerializer->toOrderRecord($updated));
    }

    public function salesReport(Request $request): JsonResponse
    {
        $from = $request->query('from', now()->subDays(30)->toDateString());
        $to = $request->query('to', now()->toDateString());

        $paidOrders = Order::query()
            ->whereIn('status', ['paid', 'processing', 'shipped', 'delivered'])
            ->whereBetween('created_at', ["{$from} 00:00:00", "{$to} 23:59:59"]);

        $totalOrders = (clone $paidOrders)->count();
        $totalRevenue = (int) (clone $paidOrders)->sum('total');
        $lowStockCount = Product::query()
            ->whereColumn('stock', '<=', 'low_stock_threshold')
            ->count();

        $recentMovements = StockMovement::query()
            ->with('product:id,name,sku')
            ->latest('created_at')
            ->limit(25)
            ->get();

        return response()->json([
            'period' => ['from' => $from, 'to' => $to],
            'totalOrders' => $totalOrders,
            'totalRevenue' => $totalRevenue,
            'lowStockCount' => $lowStockCount,
            'recentStockMovements' => $recentMovements,
        ]);
    }
}
