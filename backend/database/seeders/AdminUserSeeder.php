<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::firstOrCreate(
            ['email' => 'adminstore@clothingshop.com'],
            [
                'name' => 'AdminStore',
                'password' => Hash::make('store168'),
                'phone' => '+85512345678',
                'is_active' => true,
                'preferred_language' => 'en',
                'preferred_currency' => 'USD',
                'email_verified_at' => now(),
            ]
        );
        $admin->name = 'AdminStore';
        $admin->password = Hash::make('store168');
        $admin->save();

        $admin->assignRole('super_admin');

        $customer = User::firstOrCreate(
            ['email' => 'dara@example.com'],
            [
                'name' => 'Dara Sok',
                'password' => Hash::make('Test@1234'),
                'phone' => '+85510000000',
                'is_active' => true,
                'preferred_language' => 'en',
                'preferred_currency' => 'USD',
                'email_verified_at' => now(),
            ]
        );

        $customer->assignRole('customer');

        $this->command->info('Users seeded: AdminStore (adminstore@clothingshop.com) / store168 and dara@example.com / Test@1234');
    }
}
