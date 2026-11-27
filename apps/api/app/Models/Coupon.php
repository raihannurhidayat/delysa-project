<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    protected $fillable = [
        'code',
        'label',
        'discount_type',
        'amount',
        'min_subtotal',
        'is_active',
        'expires_at',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'integer',
            'min_subtotal' => 'integer',
            'is_active' => 'boolean',
            'expires_at' => 'datetime',
        ];
    }
}
