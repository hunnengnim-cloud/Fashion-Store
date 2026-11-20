<?php

namespace App\Enums;

enum UserRole: string
{
    case SuperAdmin = 'super_admin';
    case ShopAdmin = 'shop_admin';
    case InventoryManager = 'inventory_manager';
    case OrderManager = 'order_manager';
    case Customer = 'customer';
}
