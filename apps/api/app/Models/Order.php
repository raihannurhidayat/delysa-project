<?php

namespace App\Models;

use App\Enums\OrderStatus;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $code
 * @property int|null $user_id
 * @property string|null $idempotency_key
 * @property OrderStatus $status
 * @property string $recipient_name
 * @property string $recipient_phone
 * @property string $shipping_address
 * @property string|null $custom_note
 * @property string $payment_method
 * @property string|null $payment_proof_path
 * @property string|null $payment_proof_name
 * @property CarbonInterface|null $payment_deadline
 * @property int $subtotal
 * @property int $shipping_cost
 * @property int $discount
 * @property int $total
 * @property string|null $courier
 * @property string|null $tracking_number
 * @property CarbonInterface|null $delivered_at
 * @property CarbonInterface|null $created_at
 * @property CarbonInterface|null $updated_at
 * @property-read Collection<int, OrderItem> $items
 * @property-read Collection<int, OrderTimeline> $timelines
 * @property-read User|null $user
 */
#[Fillable([
    'code',
    'user_id',
    'idempotency_key',
    'status',
    'recipient_name',
    'recipient_phone',
    'shipping_address',
    'custom_note',
    'payment_method',
    'payment_proof_path',
    'payment_proof_name',
    'payment_deadline',
    'subtotal',
    'shipping_cost',
    'discount',
    'total',
    'courier',
    'tracking_number',
    'delivered_at',
])]
class Order extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'status' => OrderStatus::class,
            'payment_deadline' => 'datetime',
            'delivered_at' => 'datetime',
            'subtotal' => 'integer',
            'shipping_cost' => 'integer',
            'discount' => 'integer',
            'total' => 'integer',
        ];
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * @return HasMany<OrderItem, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * @return HasMany<OrderTimeline, $this>
     */
    public function timelines(): HasMany
    {
        return $this->hasMany(OrderTimeline::class)->orderBy('id');
    }
}
