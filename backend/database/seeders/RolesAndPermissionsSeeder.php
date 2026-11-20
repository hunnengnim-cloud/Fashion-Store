<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        // Reset cached roles/permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // ── Define all permissions ─────────────────────────────────
        $permissions = [
            // Products
            'product.view', 'product.create', 'product.update', 'product.delete',
            // Categories & Brands
            'category.view', 'category.create', 'category.update', 'category.delete',
            'brand.view',    'brand.create',    'brand.update',    'brand.delete',
            // Inventory
            'inventory.view', 'inventory.update', 'inventory.adjust',
            // Orders
            'order.view', 'order.update_status', 'order.cancel', 'order.refund',
            // Customers
            'customer.view', 'customer.update', 'customer.deactivate',
            // Promotions
            'coupon.view', 'coupon.create', 'coupon.update', 'coupon.delete',
            'banner.view', 'banner.create', 'banner.update', 'banner.delete',
            // Reports
            'report.view', 'report.export',
            // Admin users
            'admin.view', 'admin.create', 'admin.update', 'admin.delete',
            // Reviews
            'review.view', 'review.approve', 'review.delete',
            // Settings
            'setting.view', 'setting.update',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'sanctum']);
        }

        // ── Super Admin ────────────────────────────────────────────
        $superAdmin = Role::firstOrCreate(['name' => 'super_admin', 'guard_name' => 'sanctum']);
        $superAdmin->syncPermissions(Permission::all());

        // ── Shop Admin ─────────────────────────────────────────────
        $shopAdmin = Role::firstOrCreate(['name' => 'shop_admin', 'guard_name' => 'sanctum']);
        $shopAdmin->syncPermissions([
            'product.view', 'product.create', 'product.update', 'product.delete',
            'category.view', 'category.create', 'category.update', 'category.delete',
            'brand.view', 'brand.create', 'brand.update', 'brand.delete',
            'inventory.view', 'inventory.update', 'inventory.adjust',
            'order.view', 'order.update_status', 'order.cancel',
            'customer.view', 'customer.update',
            'coupon.view', 'coupon.create', 'coupon.update', 'coupon.delete',
            'banner.view', 'banner.create', 'banner.update', 'banner.delete',
            'report.view', 'report.export',
            'review.view', 'review.approve', 'review.delete',
        ]);

        // ── Inventory Manager ──────────────────────────────────────
        $inventoryMgr = Role::firstOrCreate(['name' => 'inventory_manager', 'guard_name' => 'sanctum']);
        $inventoryMgr->syncPermissions([
            'product.view', 'product.create', 'product.update',
            'category.view', 'brand.view',
            'inventory.view', 'inventory.update', 'inventory.adjust',
            'order.view',
        ]);

        // ── Order Manager ──────────────────────────────────────────
        $orderMgr = Role::firstOrCreate(['name' => 'order_manager', 'guard_name' => 'sanctum']);
        $orderMgr->syncPermissions([
            'product.view',
            'order.view', 'order.update_status', 'order.cancel',
            'customer.view',
            'report.view',
        ]);

        // ── Customer ───────────────────────────────────────────────
        Role::firstOrCreate(['name' => 'customer', 'guard_name' => 'sanctum']);
        // Customers access their own data via policies — no Spatie permissions needed

        $this->command->info('Roles and permissions seeded.');
    }
}
