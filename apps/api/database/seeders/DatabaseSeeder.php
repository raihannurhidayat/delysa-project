<?php

namespace Database\Seeders;

use App\Enums\Role;
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
        $password = (string) env('SEED_USER_PASSWORD', 'password');

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
    }
}
