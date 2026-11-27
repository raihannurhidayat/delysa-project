<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\RealtimeEvent;
use App\Support\ProductPresenter;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class AdminProductController extends Controller
{
    public function index(): JsonResponse
    {
        $products = Product::query()
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->get()
            ->map(static fn (Product $product): array => ProductPresenter::toAdminArray($product))
            ->values()
            ->all();

        return response()->json(['data' => $products]);
    }

    public function show(Product $product): JsonResponse
    {
        return response()->json(['data' => ProductPresenter::toAdminArray($product)]);
    }

    public function store(Request $request): JsonResponse
    {
        /** @var array<string, mixed> $validated */
        $validated = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:180'],
            'sku' => ['required', 'string', 'max:64', 'unique:products,sku'],
            'slug' => ['nullable', 'string', 'max:160', 'unique:products,slug'],
            'category' => ['required', 'string', 'max:64'],
            'price' => ['required', 'integer', 'min:1'],
            'originalPrice' => ['nullable', 'integer', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'stockUnit' => ['nullable', 'string', 'max:32'],
            'minThreshold' => ['nullable', 'integer', 'min:0'],
            'imageUrl' => ['nullable', 'string', 'max:500'],
            'image' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'isPublished' => ['nullable', 'boolean'],
            'isCustomizable' => ['nullable', 'boolean'],
            'isFlashSale' => ['nullable', 'boolean'],
            'isNew' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string', 'max:3000'],
            'botanicalTags' => ['nullable', 'array'],
            'botanicalTags.*' => ['string', 'max:50'],
        ]);

        $imageUrl = is_string($validated['imageUrl'] ?? null) ? $validated['imageUrl'] : null;
        if ($request->hasFile('image')) {
            $path = $request->file('image')?->store('products', 'public');
            if (is_string($path)) {
                $imageUrl = Storage::disk('public')->url($path);
            }
        }

        $name = (string) $validated['name'];
        $slug = is_string($validated['slug'] ?? null) && trim($validated['slug']) !== ''
            ? Str::slug($validated['slug'])
            : $this->uniqueSlug($name);
        $stock = (int) $validated['stock'];

        $product = Product::query()->create([
            'name' => $name,
            'sku' => strtoupper(trim((string) $validated['sku'])),
            'slug' => $slug,
            'category' => (string) $validated['category'],
            'price' => (int) $validated['price'],
            'original_price' => is_numeric($validated['originalPrice'] ?? null) ? (int) $validated['originalPrice'] : null,
            'stock' => $stock,
            'stock_total' => max(20, $stock),
            'stock_unit' => is_string($validated['stockUnit'] ?? null) ? $validated['stockUnit'] : 'Buket',
            'min_threshold' => is_numeric($validated['minThreshold'] ?? null) ? (int) $validated['minThreshold'] : 5,
            'sold' => 0,
            'rating' => 5.0,
            'review_count' => 0,
            'image_url' => $imageUrl,
            'is_published' => (bool) ($validated['isPublished'] ?? true),
            'is_customizable' => (bool) ($validated['isCustomizable'] ?? true),
            'is_flash_sale' => (bool) ($validated['isFlashSale'] ?? false),
            'is_new' => (bool) ($validated['isNew'] ?? true),
            'description' => is_string($validated['description'] ?? null) ? $validated['description'] : null,
            'botanical_tags' => is_array($validated['botanicalTags'] ?? null) ? array_values($validated['botanicalTags']) : [],
        ]);

        RealtimeEvent::publish('products', ['action' => 'created', 'id' => $product->id, 'slug' => $product->slug]);

        return response()->json(['data' => ProductPresenter::toAdminArray($product)], 201);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        /** @var array<string, mixed> $validated */
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'min:2', 'max:180'],
            'sku' => ['sometimes', 'string', 'max:64', Rule::unique('products', 'sku')->ignore($product->id)],
            'slug' => ['sometimes', 'string', 'max:160', Rule::unique('products', 'slug')->ignore($product->id)],
            'category' => ['sometimes', 'string', 'max:64'],
            'price' => ['sometimes', 'integer', 'min:1'],
            'originalPrice' => ['nullable', 'integer', 'min:0'],
            'stock' => ['sometimes', 'integer', 'min:0'],
            'stockUnit' => ['sometimes', 'string', 'max:32'],
            'minThreshold' => ['sometimes', 'integer', 'min:0'],
            'imageUrl' => ['nullable', 'string', 'max:500'],
            'image' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
            'isPublished' => ['sometimes', 'boolean'],
            'isCustomizable' => ['sometimes', 'boolean'],
            'isFlashSale' => ['sometimes', 'boolean'],
            'isNew' => ['sometimes', 'boolean'],
            'description' => ['nullable', 'string', 'max:3000'],
            'botanicalTags' => ['sometimes', 'array'],
            'botanicalTags.*' => ['string', 'max:50'],
        ]);

        $updates = [];
        if (array_key_exists('name', $validated)) {
            $updates['name'] = (string) $validated['name'];
        }
        if (array_key_exists('sku', $validated)) {
            $updates['sku'] = strtoupper(trim((string) $validated['sku']));
        }
        if (array_key_exists('slug', $validated)) {
            $updates['slug'] = Str::slug((string) $validated['slug']);
        }
        if (array_key_exists('category', $validated)) {
            $updates['category'] = (string) $validated['category'];
        }
        if (array_key_exists('price', $validated)) {
            $updates['price'] = (int) $validated['price'];
        }
        if (array_key_exists('originalPrice', $validated)) {
            $updates['original_price'] = is_numeric($validated['originalPrice']) ? (int) $validated['originalPrice'] : null;
        }
        if (array_key_exists('stock', $validated)) {
            $newStock = (int) $validated['stock'];
            $updates['stock'] = $newStock;
            if ($newStock > $product->stock_total) {
                $updates['stock_total'] = $newStock;
            }
        }
        if (array_key_exists('stockUnit', $validated)) {
            $updates['stock_unit'] = (string) $validated['stockUnit'];
        }
        if (array_key_exists('minThreshold', $validated)) {
            $updates['min_threshold'] = (int) $validated['minThreshold'];
        }
        if (array_key_exists('imageUrl', $validated)) {
            $updates['image_url'] = is_string($validated['imageUrl']) && trim($validated['imageUrl']) !== ''
                ? $validated['imageUrl']
                : null;
        }
        if ($request->hasFile('image')) {
            $path = $request->file('image')?->store('products', 'public');
            if (is_string($path)) {
                $updates['image_url'] = Storage::disk('public')->url($path);
            }
        }
        if (array_key_exists('isPublished', $validated)) {
            $updates['is_published'] = (bool) $validated['isPublished'];
        }
        if (array_key_exists('isCustomizable', $validated)) {
            $updates['is_customizable'] = (bool) $validated['isCustomizable'];
        }
        if (array_key_exists('isFlashSale', $validated)) {
            $updates['is_flash_sale'] = (bool) $validated['isFlashSale'];
        }
        if (array_key_exists('isNew', $validated)) {
            $updates['is_new'] = (bool) $validated['isNew'];
        }
        if (array_key_exists('description', $validated)) {
            $updates['description'] = is_string($validated['description']) ? $validated['description'] : null;
        }
        if (array_key_exists('botanicalTags', $validated) && is_array($validated['botanicalTags'])) {
            $updates['botanical_tags'] = array_values($validated['botanicalTags']);
        }

        $product->fill($updates)->save();

        RealtimeEvent::publish('products', ['action' => 'updated', 'id' => $product->id, 'slug' => $product->slug]);

        return response()->json(['data' => ProductPresenter::toAdminArray($product->refresh())]);
    }

    public function destroy(Product $product): JsonResponse
    {
        $id = $product->id;
        $product->delete();

        RealtimeEvent::publish('products', ['action' => 'deleted', 'id' => $id]);

        return response()->json(null, 204);
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'produk-delysa';
        $slug = $base;
        $suffix = 2;
        while (Product::query()->where('slug', $slug)->exists()) {
            $slug = "{$base}-{$suffix}";
            $suffix++;
        }

        return $slug;
    }
}
