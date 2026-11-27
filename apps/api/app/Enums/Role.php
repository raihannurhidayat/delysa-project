<?php

namespace App\Enums;

enum Role: string
{
    case Customer = 'customer';
    case StoreOwner = 'store_owner';
    case Admin = 'admin';

    public function label(): string
    {
        return match ($this) {
            self::Customer => 'Pelanggan',
            self::StoreOwner => 'Pemilik Toko',
            self::Admin => 'Admin',
        };
    }

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_map(static fn (self $role): string => $role->value, self::cases());
    }
}
