<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Support\ProductPresenter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $search = trim((string) $request->query('search', ''));
        $category = trim((string) $request->query('category', ''));
        $minPrice = $request->query('minPrice');
        $maxPrice = $request->query('maxPrice');
        $sort = trim((string) $request->query('sort', ''));
        $page = max(1, (int) $request->query('page', '1'));
        $perPage = min(50, max(1, (int) $request->query('perPage', '12')));

        $baseQuery = Product::query()->where('is_published', true);
        $this->applySharedFilters($baseQuery, $search, $minPrice, $maxPrice);

        /** @var array<string, int> $counts */
        $counts = (clone $baseQuery)
            ->selectRaw('category, COUNT(*) as aggregate')
            ->groupBy('category')
            ->pluck('aggregate', 'category')
            ->map(static fn (mixed $v): int => is_numeric($v) ? (int) $v : 0)
            ->all();

        $listQuery = clone $baseQuery;
        if ($category !== '' && strtolower($category) !== 'all') {
            $listQuery->whereRaw('LOWER(category) = ?', [strtolower($category)]);
        }

        match ($sort) {
            'termurah' => $listQuery->orderBy('price')->orderBy('id'),
            'termahal' => $listQuery->orderByDesc('price')->orderBy('id'),
            'terbaru' => $listQuery->orderByDesc('is_new')->orderByDesc('created_at')->orderByDesc('id'),
            default => $listQuery->orderByDesc('sold')->orderBy('id'),
        };

        $total = (clone $listQuery)->count();
        $products = $listQuery->forPage($page, $perPage)->get();

        $formatted = $products
            ->map(static fn (Product $product): array => ProductPresenter::toShopArray($product))
            ->values()
            ->all();

        return response()->json([
            'data' => $formatted,
            'items' => $formatted,
            'total' => $total,
            'page' => $page,
            'counts' => $counts,
        ]);
    }

    public function flashSale(): JsonResponse
    {
        $products = Product::query()
            ->where('is_published', true)
            ->where('is_flash_sale', true)
            ->orderByDesc('sold')
            ->limit(8)
            ->get()
            ->map(static fn (Product $product): array => ProductPresenter::toShopArray($product))
            ->values()
            ->all();

        return response()->json($products);
    }

    public function bestSellers(): JsonResponse
    {
        $products = Product::query()
            ->where('is_published', true)
            ->orderByDesc('sold')
            ->limit(12)
            ->get()
            ->map(static fn (Product $product): array => ProductPresenter::toShopArray($product))
            ->values()
            ->all();

        return response()->json($products);
    }

    public function newArrivals(): JsonResponse
    {
        $products = Product::query()
            ->where('is_published', true)
            ->orderByDesc('is_new')
            ->orderByDesc('created_at')
            ->limit(12)
            ->get()
            ->map(static fn (Product $product): array => ProductPresenter::toShopArray($product))
            ->values()
            ->all();

        return response()->json($products);
    }

    public function byCategory(Request $request): JsonResponse
    {
        $category = trim((string) $request->query('category', ''));

        $query = Product::query()->where('is_published', true);
        if ($category !== '') {
            $query->whereRaw('LOWER(category) = ?', [strtolower($category)]);
        }

        $products = $query
            ->orderByDesc('sold')
            ->limit(12)
            ->get()
            ->map(static fn (Product $product): array => ProductPresenter::toShopArray($product))
            ->values()
            ->all();

        return response()->json($products);
    }

    public function show(string $slug): JsonResponse
    {
        $product = Product::query()
            ->where('is_published', true)
            ->whereRaw('LOWER(slug) = ?', [strtolower(trim($slug))])
            ->first();

        if ($product === null) {
            return response()->json([
                'message' => 'Produk tidak ditemukan.',
                'code' => 'PRODUCT_NOT_FOUND',
            ], 404);
        }

        return response()->json(ProductPresenter::toDetailArray($product));
    }

    /**
     * @param  Builder<Product>  $query
     */
    private function applySharedFilters(
        Builder $query,
        string $search,
        mixed $minPrice,
        mixed $maxPrice,
    ): void {
        if ($search !== '') {
            $needle = '%'.strtolower($search).'%';
            $query->where(static function (Builder $sub) use ($needle): void {
                $sub->whereRaw('LOWER(name) LIKE ?', [$needle])
                    ->orWhereRaw('LOWER(category) LIKE ?', [$needle])
                    ->orWhereRaw('LOWER(sku) LIKE ?', [$needle]);
            });
        }

        if (is_numeric($minPrice)) {
            $query->where('price', '>=', max(0, (int) $minPrice));
        }

        if (is_numeric($maxPrice)) {
            $query->where('price', '<=', max(0, (int) $maxPrice));
        }
    }
}
