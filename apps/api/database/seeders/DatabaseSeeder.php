<?php

namespace Database\Seeders;

use App\Enums\Role;
use App\Models\Coupon;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $password = (string) config('app.seed_user_password', 'password');

        $accounts = [
            ['name' => 'Customer Delysa', 'email' => 'customer@delysa.test', 'role' => Role::Customer],
            ['name' => 'Pemilik Toko Delysa', 'email' => 'owner@delysa.test', 'role' => Role::StoreOwner],
            ['name' => 'Admin Delysa', 'email' => 'admin@delysa.test', 'role' => Role::Admin],
        ];

        foreach ($accounts as $account) {
            $user = User::query()->updateOrCreate(
                ['email' => $account['email']],
                [
                    'name' => $account['name'],
                    'password' => $password,
                    'email_verified_at' => now(),
                ],
            );

            $user->forceFill(['role' => $account['role']])->save();
        }

        $this->call(ProductSeeder::class);

        $coupons = [
            [
                'code' => 'DELYSAWISUDA',
                'name' => 'Promo Spesial Wisuda',
                'type' => 'percent',
                'value' => 10,
                'max_discount' => 30000,
                'min_order_total' => 100000,
                'usage_limit' => 1000,
                'is_active' => true,
            ],
            [
                'code' => 'HEMAT20K',
                'name' => 'Potongan Langsung 20 Ribu',
                'type' => 'fixed',
                'value' => 20000,
                'max_discount' => null,
                'min_order_total' => 150000,
                'usage_limit' => 500,
                'is_active' => true,
            ],
            [
                'code' => 'DELYSAFIRST',
                'name' => 'Potongan Pengguna Baru',
                'type' => 'fixed',
                'value' => 15000,
                'max_discount' => null,
                'min_order_total' => 50000,
                'usage_limit' => 1000,
                'is_active' => true,
            ],
        ];

        foreach ($coupons as $coupon) {
            Coupon::query()->updateOrCreate(
                ['code' => $coupon['code']],
                $coupon,
            );
        }
    }
}
