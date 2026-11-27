<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id',
        'product_id',
        'product_name_snapshot',
        'slug_snapshot',
        'image_snapshot',
        'size_id',
        'size_label',
        'wrap_id',
        'wrap_label',
        'unit_price_snapshot',
        'qty',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'unit_price_snapshot' => 'integer',
            'qty' => 'integer',
        ];
    }

    /** @return BelongsTo<Order, $this> */
    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    /** @return BelongsTo<Product, $this> */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }
}
