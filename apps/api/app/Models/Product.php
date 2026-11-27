<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $sku
 * @property string $slug
 * @property string $name
 * @property string $category
 * @property int $price
 * @property int|null $original_price
 * @property int|null $discount_percent
 * @property int $stock
 * @property int $stock_total
 * @property string $stock_unit
 * @property int $min_threshold
 * @property int $sold
 * @property float $rating
 * @property int $review_count
 * @property string|null $image_url
 * @property string|null $badge
 * @property string|null $description
 * @property list<string>|null $botanical_tags
 * @property bool $is_flash_sale
 * @property bool $is_new
 * @property bool $is_published
 * @property bool $is_customizable
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 */
#[Fillable([
    'sku',
    'slug',
    'name',
    'category',
    'price',
    'original_price',
    'discount_percent',
    'stock',
    'stock_total',
    'stock_unit',
    'min_threshold',
    'sold',
    'rating',
    'review_count',
    'image_url',
    'badge',
    'description',
    'botanical_tags',
    'is_flash_sale',
    'is_new',
    'is_published',
    'is_customizable',
])]
class Product extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price' => 'integer',
            'original_price' => 'integer',
            'discount_percent' => 'integer',
            'stock' => 'integer',
            'stock_total' => 'integer',
            'min_threshold' => 'integer',
            'sold' => 'integer',
            'rating' => 'float',
            'review_count' => 'integer',
            'botanical_tags' => 'array',
            'is_flash_sale' => 'boolean',
            'is_new' => 'boolean',
            'is_published' => 'boolean',
            'is_customizable' => 'boolean',
        ];
    }
}
