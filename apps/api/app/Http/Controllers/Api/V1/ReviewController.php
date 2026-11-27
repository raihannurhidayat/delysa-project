<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function store(Request $request, int $productId): JsonResponse
    {
        $validated = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:1000'],
            'variantLabel' => ['nullable', 'string', 'max:100'],
        ]);

        $user = $request->user();
        $product = Product::query()->findOrFail($productId);

        $deliveredOrder = Order::query()
            ->where('user_id', $user->id)
            ->where('status', 'delivered')
            ->whereHas('items', fn ($q) => $q->where('product_id', $product->id))
            ->latest()
            ->first();

        if (! $deliveredOrder) {
            return response()->json([
                'message' => 'Ulasan hanya dapat dikirim setelah pesanan berstatus selesai (delivered).',
                'code' => 'REVIEW_NOT_ELIGIBLE',
            ], 403);
        }

        $review = Review::query()->updateOrCreate(
            [
                'product_id' => $product->id,
                'user_id' => $user->id,
                'order_id' => $deliveredOrder->id,
            ],
            [
                'rating' => $validated['rating'],
                'comment' => $validated['comment'] ?? null,
                'variant_label' => $validated['variantLabel'] ?? 'Standard',
            ]
        );

        $product->review_count = $product->reviews()->count();
        $product->rating = round((float) $product->reviews()->avg('rating'), 1);
        $product->save();

        return response()->json(['review' => $review], 201);
    }
}
