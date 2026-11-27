<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Coupon;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Review;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductSeeder extends Seeder
{
    public function run(): void
    {
        $categoryImages = [
            'Wisuda' => 'https://images.unsplash.com/photo-1520763185298-1b434c919102?w=400&q=80&auto=format&fit=crop',
            'Mawar' => 'https://images.unsplash.com/photo-1533616688419-b7a585564566?w=400&q=80&auto=format&fit=crop',
            'Anggrek' => 'https://images.unsplash.com/photo-1457089328109-e5d9bd499191?w=400&q=80&auto=format&fit=crop',
            'Kado' => 'https://images.unsplash.com/photo-1562690868-60bbe7293e94?w=400&q=80&auto=format&fit=crop',
            'Papan' => 'https://images.unsplash.com/photo-1463320726281-696a485928c7?w=400&q=80&auto=format&fit=crop',
            'Meja' => 'https://images.unsplash.com/photo-1463320726281-696a485928c7?w=400&q=80&auto=format&fit=crop',
            'Duka' => 'https://images.unsplash.com/photo-1487530811176-3780de880c2d?w=400&q=80&auto=format&fit=crop',
        ];

        $catalogPath = base_path('../web/src/mock/products/catalog.json');
        $detailPath = base_path('../web/src/mock/products/product-detail.json');

        $catalogItems = file_exists($catalogPath)
            ? json_decode((string) file_get_contents($catalogPath), true)
            : [];
        $detailItems = file_exists($detailPath)
            ? json_decode((string) file_get_contents($detailPath), true)
            : [];

        $detailsBySlug = [];
        foreach ($detailItems as $detail) {
            if (! empty($detail['slug'])) {
                $detailsBySlug[$detail['slug']] = $detail;
            }
        }

        // Merge hero/detail-only products that may not be in catalog.json
        $allBySlug = [];
        foreach ($catalogItems as $item) {
            $allBySlug[$item['slug']] = $item;
        }
        foreach ($detailItems as $detail) {
            if (! isset($allBySlug[$detail['slug']])) {
                $allBySlug[$detail['slug']] = $detail;
            }
        }

        $sortIndex = 1;
        foreach ($categoryImages as $catName => $catImage) {
            Category::query()->updateOrCreate(
                ['slug' => Str::slug($catName)],
                [
                    'name' => $catName,
                    'image_url' => $catImage,
                    'sort_order' => $sortIndex++,
                ]
            );
        }

        $customer = User::query()->where('email', 'customer@delysa.test')->first();

        $index = 1;
        foreach ($allBySlug as $slug => $item) {
            $catName = $item['category'] ?? 'Wisuda';
            $category = Category::query()->firstOrCreate(
                ['slug' => Str::slug($catName)],
                [
                    'name' => $catName,
                    'image_url' => $categoryImages[$catName] ?? ($item['image'] ?? null),
                    'sort_order' => $sortIndex++,
                ]
            );

            $detail = $detailsBySlug[$slug] ?? [];
            $stock = (int) ($item['stock'] ?? $detail['stock'] ?? 10);
            // Ensure mockup products with 0 stock still appear unless intended out-of-stock
            $sku = 'DF-'.strtoupper(Str::substr(Str::slug($catName), 0, 3)).'-'.str_pad((string) $index++, 3, '0', STR_PAD_LEFT);

            $product = Product::query()->updateOrCreate(
                ['slug' => $slug],
                [
                    'category_id' => $category->id,
                    'sku' => $sku,
                    'name' => $item['name'],
                    'description' => $detail['description'] ?? "{$item['name']} — rangkaian kurasi atelier Delysa Florist, Tasikmalaya.",
                    'price' => (int) $item['price'],
                    'original_price' => isset($item['originalPrice']) ? (int) $item['originalPrice'] : null,
                    'discount_percent' => isset($item['discountPercent']) ? (int) $item['discountPercent'] : null,
                    'stock' => $stock,
                    'reserved_stock' => 0,
                    'stock_unit' => $catName === 'Papan' ? 'Stand' : ($catName === 'Meja' ? 'Vas' : 'Buket'),
                    'low_stock_threshold' => 5,
                    'sold_count' => (int) ($item['sold'] ?? 0),
                    'rating' => (float) ($item['rating'] ?? 4.9),
                    'review_count' => (int) ($item['reviewCount'] ?? 0),
                    'badge' => $item['badge'] ?? null,
                    'image_url' => $item['image'] ?? ($detail['image'] ?? null),
                    'gallery' => $detail['gallery'] ?? [($item['image'] ?? '')],
                    'care_instructions' => $detail['care'] ?? [
                        'Potong miring 1-2 cm dan ganti air tiap 1-2 hari.',
                        'Jauhkan dari panas langsung agar bertahan 5-7 hari.',
                    ],
                    'specs' => $detail['specs'] ?? [
                        ['label' => 'Kategori', 'value' => $catName],
                    ],
                    'shipping_info' => $detail['shipping'] ?? [
                        'Same-day Tasikmalaya sebelum 18.00 WIB.',
                    ],
                    'bonuses' => $detail['bonuses'] ?? [],
                    'is_active' => true,
                    'is_new' => (bool) ($item['isNew'] ?? false),
                    'is_flash_sale' => (bool) ($item['isFlashSale'] ?? false),
                    'flash_sale_stock_left' => ($item['isFlashSale'] ?? false) ? $stock : null,
                    'flash_sale_stock_total' => isset($item['stockTotal']) ? (int) $item['stockTotal'] : 20,
                    'is_customizable' => true,
                ]
            );

            // Seed sizes
            $sizes = $detail['sizes'] ?? [
                ['id' => 'standard', 'label' => 'Standard', 'priceDelta' => 0],
            ];
            foreach ($sizes as $sIdx => $size) {
                ProductVariant::query()->updateOrCreate(
                    ['product_id' => $product->id, 'type' => 'size', 'variant_id' => $size['id']],
                    [
                        'label' => $size['label'],
                        'stems' => $size['stems'] ?? null,
                        'price_delta' => (int) ($size['priceDelta'] ?? 0),
                        'sort_order' => $sIdx,
                    ]
                );
            }

            // Seed wraps
            $wraps = $detail['wraps'] ?? [
                ['id' => 'standard', 'label' => 'Standard'],
            ];
            foreach ($wraps as $wIdx => $wrap) {
                ProductVariant::query()->updateOrCreate(
                    ['product_id' => $product->id, 'type' => 'wrap', 'variant_id' => $wrap['id']],
                    [
                        'label' => $wrap['label'],
                        'sub_label' => $wrap['sub'] ?? null,
                        'price_delta' => (int) ($wrap['priceDelta'] ?? 0),
                        'sort_order' => $wIdx,
                    ]
                );
            }

            if ($product->stockMovements()->count() === 0 && $stock > 0) {
                StockMovement::query()->create([
                    'product_id' => $product->id,
                    'type' => 'in',
                    'qty_change' => $stock,
                    'stock_after' => $stock,
                    'reason' => 'Stok awal seeder katalog',
                    'created_at' => now(),
                ]);
            }
        }

        // Seed coupons matching frontend cart-coupons.ts
        Coupon::query()->updateOrCreate(
            ['code' => 'DELYSAFIRST'],
            ['label' => 'Potongan Pengguna Baru', 'discount_type' => 'fixed', 'amount' => 15000, 'min_subtotal' => 50000, 'is_active' => true]
        );
        Coupon::query()->updateOrCreate(
            ['code' => 'DELYSAWISUDA'],
            ['label' => 'Promo Wisuda', 'discount_type' => 'fixed', 'amount' => 25000, 'min_subtotal' => 100000, 'is_active' => true]
        );
    }
}
