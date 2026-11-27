<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Coupon;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $cart = $this->resolveCart($request, create: false);
        if (! $cart) {
            return response()->json([
                'lines' => [],
                'saved' => [],
                'coupon' => null,
                'instructions' => '',
            ]);
        }

        return response()->json($this->serializeCart($cart));
    }

    public function sync(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'lines' => ['present', 'array'],
            'lines.*.slug' => ['required', 'string'],
            'lines.*.sizeId' => ['nullable', 'string', 'max:64'],
            'lines.*.wrapId' => ['nullable', 'string', 'max:64'],
            'lines.*.qty' => ['required', 'integer', 'min:1', 'max:99'],
            'lines.*.note' => ['nullable', 'string', 'max:500'],
            'saved' => ['nullable', 'array'],
            'couponCode' => ['nullable', 'string', 'max:32'],
            'instructions' => ['nullable', 'string', 'max:500'],
        ]);

        $cart = $this->resolveCart($request, create: true);
        $cart->coupon_code = $validated['couponCode'] ?? null;
        $cart->instructions = $validated['instructions'] ?? '';
        $cart->expires_at = $request->user() ? now()->addDays(30) : now()->addDays(7);
        $cart->save();

        $cart->items()->delete();

        foreach ($validated['lines'] as $line) {
            $product = Product::query()->where('slug', $line['slug'])->first();
            if (! $product) {
                continue;
            }
            CartItem::query()->create([
                'cart_id' => $cart->id,
                'product_id' => $product->id,
                'size_id' => $line['sizeId'] ?? 'standard',
                'wrap_id' => $line['wrapId'] ?? 'standard',
                'qty' => (int) $line['qty'],
                'note' => $line['note'] ?? null,
                'is_saved_for_later' => false,
            ]);
        }

        foreach ($validated['saved'] ?? [] as $line) {
            $product = Product::query()->where('slug', $line['slug'])->first();
            if (! $product) {
                continue;
            }
            CartItem::query()->create([
                'cart_id' => $cart->id,
                'product_id' => $product->id,
                'size_id' => $line['sizeId'] ?? 'standard',
                'wrap_id' => $line['wrapId'] ?? 'standard',
                'qty' => (int) ($line['qty'] ?? 1),
                'note' => $line['note'] ?? null,
                'is_saved_for_later' => true,
            ]);
        }

        return response()->json($this->serializeCart($cart->fresh(['items.product.variants'])));
    }

    private function resolveCart(Request $request, bool $create): ?Cart
    {
        $user = $request->user();
        $guestToken = $request->header('X-Guest-Token');

        if ($user) {
            $cart = Cart::query()->with('items.product.variants')->where('user_id', $user->id)->first();
            if (! $cart && $create) {
                $cart = Cart::query()->create([
                    'user_id' => $user->id,
                    'expires_at' => now()->addDays(30),
                ]);
            }

            return $cart;
        }

        if ($guestToken) {
            $cart = Cart::query()->with('items.product.variants')->where('guest_token', $guestToken)->first();
            if (! $cart && $create) {
                $cart = Cart::query()->create([
                    'guest_token' => $guestToken,
                    'expires_at' => now()->addDays(7),
                ]);
            }

            return $cart;
        }

        return null;
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeCart(Cart $cart): array
    {
        $cart->loadMissing('items.product.variants');

        $mapItem = function (CartItem $item): ?array {
            $p = $item->product;
            if (! $p) {
                return null;
            }
            $size = $p->variants->where('type', 'size')->firstWhere('variant_id', $item->size_id);
            $wrap = $p->variants->where('type', 'wrap')->firstWhere('variant_id', $item->wrap_id);
            $price = max(0, $p->price + ($size?->price_delta ?? 0) + ($wrap?->price_delta ?? 0));

            return [
                'slug' => $p->slug,
                'name' => $p->name,
                'image' => $p->image_url ?? '',
                'sizeId' => $item->size_id,
                'sizeLabel' => $size?->label ?? ucfirst($item->size_id),
                'wrapId' => $item->wrap_id,
                'wrapLabel' => $wrap?->label ?? ucfirst($item->wrap_id),
                'price' => $price,
                'qty' => $item->qty,
                'note' => $item->note,
                'maxQty' => $p->availableStock(),
            ];
        };

        $coupon = null;
        if ($cart->coupon_code) {
            $c = Coupon::query()->where('code', $cart->coupon_code)->where('is_active', true)->first();
            if ($c) {
                $coupon = [
                    'code' => $c->code,
                    'label' => $c->label,
                    'amount' => $c->amount,
                ];
            }
        }

        return [
            'lines' => $cart->items->where('is_saved_for_later', false)->map($mapItem)->filter()->values(),
            'saved' => $cart->items->where('is_saved_for_later', true)->map($mapItem)->filter()->values(),
            'coupon' => $coupon,
            'instructions' => $cart->instructions ?? '',
        ];
    }
}
