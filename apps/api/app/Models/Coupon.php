<?php

namespace App\Models;

use App\Enums\OrderStatus;
use Carbon\CarbonInterface;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $code
 * @property string|null $name
 * @property string $type
 * @property int $value
 * @property int|null $max_discount
 * @property int $min_order_total
 * @property int|null $usage_limit
 * @property int $used_count
 * @property bool $is_active
 * @property CarbonInterface|null $starts_at
 * @property CarbonInterface|null $expires_at
 * @property CarbonInterface|null $created_at
 * @property CarbonInterface|null $updated_at
 */
#[Fillable([
    'code',
    'name',
    'type',
    'value',
    'max_discount',
    'min_order_total',
    'usage_limit',
    'used_count',
    'is_active',
    'starts_at',
    'expires_at',
])]
class Coupon extends Model
{
    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'value' => 'integer',
            'max_discount' => 'integer',
            'min_order_total' => 'integer',
            'usage_limit' => 'integer',
            'used_count' => 'integer',
            'is_active' => 'boolean',
            'starts_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    /**
     * Validasi apakah kupon memenuhi syarat untuk subtotal pesanan.
     */
    public function isValidForSubtotal(int $subtotal, ?string &$reason = null): bool
    {
        if (! $this->is_active) {
            $reason = 'Kupon tidak aktif.';

            return false;
        }

        $now = now();

        if ($this->starts_at !== null && $now->lt($this->starts_at)) {
            $reason = 'Kupon belum dapat digunakan.';

            return false;
        }

        if ($this->expires_at !== null && $now->gt($this->expires_at)) {
            $reason = 'Kupon telah kedaluwarsa.';

            return false;
        }

        if ($this->usage_limit !== null && $this->used_count >= $this->usage_limit) {
            $reason = 'Batas kuota penggunaan kupon telah habis.';

            return false;
        }

        if ($subtotal < $this->min_order_total) {
            $reason = 'Subtotal pesanan belum memenuhi syarat minimum kupon.';

            return false;
        }

        return true;
    }

    /**
     * Hitung nilai diskon berdasarkan subtotal pesanan.
     */
    public function calculateDiscount(int $subtotal): int
    {
        if ($subtotal <= 0) {
            return 0;
        }

        if ($this->type === 'percent') {
            $rawDiscount = (int) round($subtotal * ($this->value / 100));

            if ($this->max_discount !== null && $this->max_discount > 0) {
                $rawDiscount = min($rawDiscount, $this->max_discount);
            }

            return min($rawDiscount, $subtotal);
        }

        // Tipe fixed amount
        return min($this->value, $subtotal);
    }

    public function incrementUsage(): void
    {
        $this->increment('used_count');
    }

    public function decrementUsage(): void
    {
        if ($this->used_count > 0) {
            $this->decrement('used_count');
        }
    }

    /**
     * Memeriksa apakah kupon sudah pernah digunakan oleh pengguna atau nomor telepon tertentu pada pesanan aktif/selesai.
     */
    public function isUsedByUser(?int $userId, ?string $phone = null): bool
    {
        if ($userId === null && ($phone === null || trim($phone) === '')) {
            return false;
        }

        $normalizedPhone = $phone !== null && trim($phone) !== ''
            ? preg_replace('/\D+/', '', $phone) ?? ''
            : '';
        if (str_starts_with($normalizedPhone, '62')) {
            $normalizedPhone = '0'.substr($normalizedPhone, 2);
        }

        $activeStatuses = [
            OrderStatus::PendingPayment,
            OrderStatus::PendingVerification,
            OrderStatus::Paid,
            OrderStatus::Processing,
            OrderStatus::Shipped,
            OrderStatus::Delivered,
        ];

        return Order::query()
            ->whereRaw('UPPER(coupon_code) = ?', [strtoupper($this->code)])
            ->whereIn('status', $activeStatuses)
            ->where(function ($query) use ($userId, $phone, $normalizedPhone): void {
                if ($userId !== null) {
                    $query->where('user_id', $userId);
                }

                if ($phone !== null && trim($phone) !== '') {
                    $condition = function ($q) use ($phone, $normalizedPhone): void {
                        $q->where('buyer_phone', $phone)
                            ->orWhere('recipient_phone', $phone);
                        if ($normalizedPhone !== '' && $normalizedPhone !== $phone) {
                            $q->orWhere('buyer_phone', $normalizedPhone)
                                ->orWhere('recipient_phone', $normalizedPhone);
                        }
                    };

                    if ($userId !== null) {
                        $query->orWhere($condition);
                    } else {
                        $query->where($condition);
                    }
                }
            })
            ->exists();
    }
}
