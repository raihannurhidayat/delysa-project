<?php

namespace App\Enums;

enum OrderStatus: string
{
    case PendingPayment = 'pending_payment';
    case PendingVerification = 'pending_verification';
    case Paid = 'paid';
    case Processing = 'processing';
    case Shipped = 'shipped';
    case Delivered = 'delivered';
    case Cancelled = 'cancelled';
    case Rejected = 'rejected';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_map(static fn (self $status): string => $status->value, self::cases());
    }

    public function canTransitionTo(self $next): bool
    {
        if ($this === $next) {
            return true;
        }

        return match ($this) {
            self::PendingPayment => in_array($next, [
                self::PendingVerification,
                self::Paid,
                self::Cancelled,
                self::Rejected,
            ], true),
            self::PendingVerification => in_array($next, [
                self::Paid,
                self::Processing,
                self::Rejected,
                self::Cancelled,
            ], true),
            self::Paid => in_array($next, [
                self::Processing,
                self::Shipped,
                self::Cancelled,
            ], true),
            self::Processing => in_array($next, [
                self::Shipped,
                self::Delivered,
                self::Cancelled,
            ], true),
            self::Shipped => in_array($next, [
                self::Delivered,
            ], true),
            self::Delivered, self::Cancelled, self::Rejected => false,
        };
    }

    public function restoresStock(): bool
    {
        return in_array($this, [self::Cancelled, self::Rejected], true);
    }
}
