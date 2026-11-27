<?php

namespace App\Support;

use App\Models\Product;

final class ProductPresenter
{
    private const DEFAULT_IMAGE = 'https://images.unsplash.com/photo-1518895949257-7621c3c786d7?w=800&q=80&auto=format&fit=crop';

    /**
     * Format produk untuk storefront (`UnifiedProduct` + OpenAPI `Product`).
     *
     * @return array<string, mixed>
     */
    public static function toShopArray(Product $product): array
    {
        $image = $product->image_url ?: self::DEFAULT_IMAGE;

        return array_filter([
            'id' => (string) $product->id,
            'numericId' => $product->id,
            'sku' => $product->sku,
            'slug' => $product->slug,
            'name' => $product->name,
            'price' => $product->price,
            'originalPrice' => $product->original_price,
            'discountPercent' => $product->discount_percent,
            'image' => $image,
            'imageUrl' => $image,
            'rating' => round($product->rating, 1),
            'sold' => $product->sold,
            'reviewCount' => $product->review_count,
            'category' => $product->category,
            'stock' => $product->stock,
            'stockTotal' => max($product->stock_total, $product->stock),
            'stockLeft' => $product->stock,
            'badge' => $product->badge,
            'isFlashSale' => $product->is_flash_sale,
            'isNew' => $product->is_new,
            'isActive' => $product->is_published,
        ], static fn (mixed $value): bool => $value !== null);
    }

    /**
     * Format detail produk untuk halaman PDP (`/products/$slug`).
     *
     * @return array<string, mixed>
     */
    public static function toDetailArray(Product $product): array
    {
        $base = self::toShopArray($product);
        $image = $product->image_url ?: self::DEFAULT_IMAGE;

        return array_merge($base, [
            'gallery' => [$image],
            'description' => $product->description
                ?: $product->name.' dirangkai segar oleh florist Delysa Florist Tasikmalaya.',
            'care' => [
                'Potong miring ujung batang 1-2 cm sebelum dimasukkan ke vas berisi air bersih.',
                'Ganti air setiap 1-2 hari dan jauhkan dari sinar matahari langsung.',
                'Simpan di ruangan sejuk agar kesegaran bunga terjaga 5-7 hari.',
            ],
            'specs' => [
                ['label' => 'Kategori', 'value' => $product->category],
                ['label' => 'SKU', 'value' => $product->sku],
                ['label' => 'Satuan', 'value' => $product->stock_unit],
                ['label' => 'Ketersediaan', 'value' => $product->stock > 0 ? "{$product->stock} {$product->stock_unit} siap rangkai" : 'Stok habis'],
            ],
            'shipping' => [
                'Same-day delivery area Tasikmalaya untuk pesanan sebelum 18.00 WIB.',
                'Gratis ongkir Kota Tasikmalaya untuk minimal belanja Rp200.000.',
                'Foto hasil rangkaian dikirim via WhatsApp sebelum kurir berangkat.',
            ],
            'sizes' => [
                ['id' => 'standard', 'label' => 'Standard', 'priceDelta' => 0],
                ['id' => 'medium', 'label' => 'Medium (+15% bunga)', 'priceDelta' => 45000],
                ['id' => 'deluxe', 'label' => 'Deluxe (+30% bunga)', 'priceDelta' => 95000],
            ],
            'wraps' => [
                ['id' => 'blush', 'label' => 'Blush Rose'],
                ['id' => 'ivory', 'label' => 'Ivory Cream'],
                ['id' => 'charcoal', 'label' => 'Charcoal Matte'],
                ['id' => 'sage', 'label' => 'Sage Pastel'],
            ],
            'ratingBreakdown' => [
                ['stars' => 5, 'pct' => 90],
                ['stars' => 4, 'pct' => 8],
                ['stars' => 3, 'pct' => 2],
                ['stars' => 2, 'pct' => 0],
                ['stars' => 1, 'pct' => 0],
            ],
            'reviews' => [],
        ]);
    }

    /**
     * Format produk untuk panel admin (`AdminProduct`).
     *
     * @return array<string, mixed>
     */
    public static function toAdminArray(Product $product): array
    {
        return [
            'id' => $product->id,
            'name' => $product->name,
            'sku' => $product->sku,
            'slug' => $product->slug,
            'category' => $product->category,
            'price' => $product->price,
            'stock' => $product->stock,
            'stockUnit' => $product->stock_unit,
            'minThreshold' => $product->min_threshold,
            'sales' => $product->sold,
            'rating' => round($product->rating, 1),
            'imageUrl' => $product->image_url,
            'isPublished' => $product->is_published,
            'isCustomizable' => $product->is_customizable,
            'description' => $product->description,
            'botanicalTags' => $product->botanical_tags ?? [],
        ];
    }
}
