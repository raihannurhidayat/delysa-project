<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $fillable = [
        'category_id',
        'sku',
        'name',
        'slug',
        'description',
        'price',
        'original_price',
        'discount_percent',
        'stock',
        'reserved_stock',
        'stock_unit',
        'low_stock_threshold',
        'sold_count',
        'rating',
        'review_count',
        'badge',
        'image_url',
        'gallery',
        'care_instructions',
        'specs',
        'shipping_info',
        'bonuses',
        'botanical_tags',
        'is_active',
        'is_new',
        'is_flash_sale',
        'flash_sale_stock_left',
        'flash_sale_stock_total',
        'is_customizable',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'integer',
            'original_price' => 'integer',
            'discount_percent' => 'integer',
            'stock' => 'integer',
            'reserved_stock' => 'integer',
            'low_stock_threshold' => 'integer',
            'sold_count' => 'integer',
            'rating' => 'float',
            'review_count' => 'integer',
            'gallery' => 'array',
            'care_instructions' => 'array',
            'specs' => 'array',
            'shipping_info' => 'array',
            'bonuses' => 'array',
            'botanical_tags' => 'array',
            'is_active' => 'boolean',
            'is_new' => 'boolean',
            'is_flash_sale' => 'boolean',
            'flash_sale_stock_left' => 'integer',
            'flash_sale_stock_total' => 'integer',
            'is_customizable' => 'boolean',
        ];
    }

    public function availableStock(): int
    {
        return max(0, $this->stock - $this->reserved_stock);
    }

    /** @return BelongsTo<Category, $this> */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /** @return HasMany<ProductVariant, $this> */
    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class)->orderBy('sort_order');
    }

    /** @return HasMany<StockMovement, $this> */
    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class)->latest('created_at');
    }

    /** @return HasMany<Review, $this> */
    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class)->latest();
    }
}
