<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductVariant extends Model
{
    protected $fillable = [
        'product_id',
        'type',
        'variant_id',
        'label',
        'sub_label',
        'stems',
        'price_delta',
        'sort_order',
    ];

    protected function casts(): array
    {
        return [
            'price_delta' => 'integer',
            'sort_order' => 'integer',
        ];
    }

    /** @return BelongsTo<Product, $this> */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
