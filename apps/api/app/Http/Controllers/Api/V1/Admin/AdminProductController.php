<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Services\StockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminProductController extends Controller
{
    public function __construct(
        private readonly StockService $stockService,
    ) {}

    public function index(): JsonResponse
    {
        $products = Product::query()->with('category')->orderByDesc('id')->get();

        return response()->json([
            'items' => $products->map(fn (Product $p) => $this->toAdminProduct($p))->values(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'min:2', 'max:200'],
            'sku' => ['nullable', 'string', 'max:64', 'unique:products,sku'],
            'category' => ['required', 'string', 'max:100'],
            'price' => ['required', 'integer', 'min:0'],
            'stock' => ['required', 'integer', 'min:0'],
            'stockUnit' => ['nullable', 'string', 'max:32'],
            'minThreshold' => ['nullable', 'integer', 'min:0'],
            'imageUrl' => ['nullable', 'string', 'max:500'],
            'isPublished' => ['nullable', 'boolean'],
            'isCustomizable' => ['nullable', 'boolean'],
            'description' => ['nullable', 'string'],
        ]);

        $category = Category::query()->firstOrCreate(
            ['slug' => Str::slug($validated['category'])],
            ['name' => $validated['category']]
        );

        $slug = Str::slug($validated['name']).'-'.Str::lower(Str::random(4));
        $sku = $validated['sku'] ?? 'DF-'.strtoupper(Str::random(6));

        $product = Product::query()->create([
            'category_id' => $category->id,
            'sku' => $sku,
            'name' => $validated['name'],
            'slug' => $slug,
            'description' => $validated['description'] ?? null,
            'price' => $validated['price'],
            'stock' => 0,
            'stock_unit' => $validated['stockUnit'] ?? 'Buket',
            'low_stock_threshold' => $validated['minThreshold'] ?? 5,
            'image_url' => $validated['imageUrl'] ?? null,
            'is_active' => $validated['isPublished'] ?? true,
            'is_customizable' => $validated['isCustomizable'] ?? false,
        ]);

        if ($validated['stock'] > 0) {
            $product = $this->stockService->adjust(
                $product,
                (int) $validated['stock'],
                'Stok awal produk baru',
                $request->user()?->id,
            );
        }

        return response()->json($this->toAdminProduct($product->load('category')), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $product = Product::query()->findOrFail($id);
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'min:2', 'max:200'],
            'category' => ['sometimes', 'string', 'max:100'],
            'price' => ['sometimes', 'integer', 'min:0'],
            'stock' => ['sometimes', 'integer', 'min:0'],
            'stockUnit' => ['sometimes', 'string', 'max:32'],
            'minThreshold' => ['sometimes', 'integer', 'min:0'],
            'imageUrl' => ['nullable', 'string', 'max:500'],
            'isPublished' => ['sometimes', 'boolean'],
            'isCustomizable' => ['sometimes', 'boolean'],
            'description' => ['nullable', 'string'],
        ]);

        if (isset($validated['category'])) {
            $category = Category::query()->firstOrCreate(
                ['slug' => Str::slug($validated['category'])],
                ['name' => $validated['category']]
            );
            $product->category_id = $category->id;
        }

        foreach (['name', 'price', 'description'] as $field) {
            if (array_key_exists($field, $validated)) {
                $product->{$field} = $validated[$field];
            }
        }
        if (isset($validated['stockUnit'])) {
            $product->stock_unit = $validated['stockUnit'];
        }
        if (isset($validated['minThreshold'])) {
            $product->low_stock_threshold = $validated['minThreshold'];
        }
        if (array_key_exists('imageUrl', $validated)) {
            $product->image_url = $validated['imageUrl'];
        }
        if (array_key_exists('isPublished', $validated)) {
            $product->is_active = (bool) $validated['isPublished'];
        }
        if (array_key_exists('isCustomizable', $validated)) {
            $product->is_customizable = (bool) $validated['isCustomizable'];
        }

        $product->save();

        if (isset($validated['stock']) && $validated['stock'] !== $product->stock) {
            $product = $this->stockService->adjust(
                $product,
                (int) $validated['stock'],
                'Penyesuaian stok oleh admin',
                $request->user()?->id,
            );
        }

        return response()->json($this->toAdminProduct($product->fresh('category')));
    }

    public function destroy(int $id): JsonResponse
    {
        $product = Product::query()->findOrFail($id);
        $product->delete();

        return response()->json(null, 204);
    }

    /**
     * @return array<string, mixed>
     */
    private function toAdminProduct(Product $p): array
    {
        return [
            'id' => $p->id,
            'name' => $p->name,
            'sku' => $p->sku,
            'slug' => $p->slug,
            'category' => $p->category?->name ?? 'Umum',
            'price' => $p->price,
            'stock' => $p->stock,
            'stockUnit' => $p->stock_unit,
            'minThreshold' => $p->low_stock_threshold,
            'sales' => $p->sold_count,
            'rating' => $p->rating,
            'imageUrl' => $p->image_url,
            'isPublished' => $p->is_active,
            'isCustomizable' => $p->is_customizable,
            'description' => $p->description,
            'botanicalTags' => $p->botanical_tags ?? [],
        ];
    }
}
