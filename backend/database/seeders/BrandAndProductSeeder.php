<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\ProductVariant;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class BrandAndProductSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Brands
        $brandsData = [
            ['name' => 'Studio KH',   'slug' => 'studio-kh',   'is_active' => true],
            ['name' => 'Bloom KH',    'slug' => 'bloom-kh',    'is_active' => true],
            ['name' => 'Little Stars', 'slug' => 'little-stars', 'is_active' => true],
            ['name' => 'Street KH',   'slug' => 'street-kh',   'is_active' => true],
            ['name' => 'Urban Lux',   'slug' => 'urban-lux',   'is_active' => true],
            ['name' => 'Indigo Co.',  'slug' => 'indigo-co',   'is_active' => true],
        ];

        $brandMap = [];
        foreach ($brandsData as $b) {
            $brand = Brand::firstOrCreate(['slug' => $b['slug']], $b);
            $brandMap[$b['name']] = $brand->id;
        }

        // Map categories
        $catMap = [
            'men' => Category::where('slug', 'mens-clothing')->value('id') ?? 1,
            'women' => Category::where('slug', 'womens-clothing')->value('id') ?? 2,
            'kids' => Category::where('slug', 'childrens-clothing')->value('id') ?? 3,
            'shoes' => Category::where('slug', 'shoes')->value('id') ?? 4,
            'accessories' => Category::where('slug', 'accessories')->value('id') ?? 5,
        ];

        // 2. 20 Fashion Catalog Products
        $products = [
            // Men
            [
                'name_en' => 'Essential Linen Shirt',
                'name_km' => 'អាវក្រណាត់លីនែនប្រណិត',
                'slug' => 'essential-linen-shirt',
                'brand' => 'Studio KH',
                'cat' => 'men',
                'base_price' => 34.99,
                'sale_price' => 24.99,
                'stock' => 42,
                'is_featured' => true,
                'image' => 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&q=80',
                'sizes' => ['S', 'M', 'L', 'XL'],
                'colors' => ['White', 'Navy', 'Olive', 'Beige'],
                'desc' => 'Crafted from 100% natural breathable European linen. Tailored regular fit designed for comfortable tropical elegance.',
            ],
            [
                'name_en' => 'Classic Denim Jacket',
                'name_km' => 'អាវខូវប៊យបុរាណ 12oz',
                'slug' => 'classic-denim-jacket',
                'brand' => 'Indigo Co.',
                'cat' => 'men',
                'base_price' => 89.99,
                'sale_price' => null,
                'stock' => 15,
                'is_featured' => true,
                'image' => 'https://images.unsplash.com/photo-1601333144130-8cbb312386b6?w=600&q=80',
                'sizes' => ['M', 'L', 'XL', 'XXL'],
                'colors' => ['Classic Indigo', 'Light Wash', 'Washed Black'],
                'desc' => 'Vintage washed heavy-duty 12oz denim jacket with signature bronze hardware and reinforced double-needle stitching.',
            ],
            [
                'name_en' => 'Slim Chino Pants',
                'name_km' => 'ខោឈីណូជើងតូចទំនើប',
                'slug' => 'slim-chino-pants',
                'brand' => 'Studio KH',
                'cat' => 'men',
                'base_price' => 49.99,
                'sale_price' => 39.99,
                'stock' => 28,
                'is_featured' => false,
                'image' => 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=600&q=80',
                'sizes' => ['30', '32', '34', '36'],
                'colors' => ['Khaki', 'Charcoal', 'Navy'],
                'desc' => 'Stretch cotton twill trousers tailored with a clean tapered leg, angled side pockets, and durable button-tab closure.',
            ],
            [
                'name_en' => 'Tailored Wool Blazer',
                'name_km' => 'អាវធំរោមចៀមម៉ូដកាត់ដេរពិសេស',
                'slug' => 'tailored-wool-blazer',
                'brand' => 'Studio KH',
                'cat' => 'men',
                'base_price' => 119.00,
                'sale_price' => 89.00,
                'stock' => 12,
                'is_featured' => true,
                'image' => 'https://images.unsplash.com/photo-1534030347209-467a5b0ad3e6?w=600&q=80',
                'sizes' => ['38R', '40R', '42R', '44R'],
                'colors' => ['Charcoal Gray', 'Deep Navy', 'Sand'],
                'desc' => 'Modern notch-lapel unstructured blazer made with fine breathable tropical wool. Suitable for conferences and evenings.',
            ],
            [
                'name_en' => 'Knit Crewneck Sweater',
                'name_km' => 'អាវយឺតកក្បាលមូលក្រណាត់ត្បាញ',
                'slug' => 'knit-crewneck-sweater',
                'brand' => 'Studio KH',
                'cat' => 'men',
                'base_price' => 48.00,
                'sale_price' => 36.00,
                'stock' => 22,
                'is_featured' => false,
                'image' => 'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=600&q=80',
                'sizes' => ['S', 'M', 'L', 'XL'],
                'colors' => ['Oatmeal', 'Navy', 'Olive Heather'],
                'desc' => 'Fine gauge organic cotton crewneck pullover with ribbed cuffs and hem. The essential year-round layer.',
            ],
            [
                'name_en' => 'Oxford Cotton Shirt',
                'name_km' => 'អាវសាច់ក្រណាត់អកស៍ហ្វត Oxford',
                'slug' => 'oxford-cotton-shirt',
                'brand' => 'Studio KH',
                'cat' => 'men',
                'base_price' => 42.00,
                'sale_price' => 29.99,
                'stock' => 35,
                'is_featured' => true,
                'image' => 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=600&q=80',
                'sizes' => ['S', 'M', 'L', 'XL'],
                'colors' => ['Light Blue', 'White', 'Pink'],
                'desc' => 'Crisp, durable garment-washed Oxford cotton shirt with button-down collar and mother-of-pearl buttons.',
            ],
            [
                'name_en' => 'Casual Linen Shorts',
                'name_km' => 'ខោខ្លីលីនែនសម្រាប់ដើរកម្សាន្ត',
                'slug' => 'casual-linen-shorts',
                'brand' => 'Studio KH',
                'cat' => 'men',
                'base_price' => 36.00,
                'sale_price' => 26.00,
                'stock' => 19,
                'is_featured' => false,
                'image' => 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=600&q=80',
                'sizes' => ['S', 'M', 'L', 'XL'],
                'colors' => ['Sand', 'Navy', 'Sage'],
                'desc' => 'Lightweight drawstring linen shorts for effortless warm-weather style and coastal weekend relaxation.',
            ],

            // Women
            [
                'name_en' => 'Floral Wrap Dress',
                'name_km' => 'រ៉ូបផ្កា Wrap Dress ម៉ូដទាន់សម័យ',
                'slug' => 'floral-wrap-dress',
                'brand' => 'Bloom KH',
                'cat' => 'women',
                'base_price' => 59.99,
                'sale_price' => 42.00,
                'stock' => 24,
                'is_featured' => true,
                'image' => 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=600&q=80',
                'sizes' => ['XS', 'S', 'M', 'L'],
                'colors' => ['Floral Multi', 'Pastel Pink', 'Sage'],
                'desc' => 'A breezy wrap dress adorned with delicate tropical botanicals. Features an adjustable waist tie and flowy midi hem.',
            ],
            [
                'name_en' => 'Silk Blouse',
                'name_km' => 'អាវសូត្រធម្មជាតិរលើបប្រណិត',
                'slug' => 'silk-blouse',
                'brand' => 'Bloom KH',
                'cat' => 'women',
                'base_price' => 45.00,
                'sale_price' => 33.00,
                'stock' => 18,
                'is_featured' => false,
                'image' => 'https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=600&q=80',
                'sizes' => ['XS', 'S', 'M', 'L'],
                'colors' => ['Ivory', 'Champagne', 'Blush'],
                'desc' => 'Sumptuous lightweight silk satin with subtle pearl sheen. Perfectly complements tailored trousers or weekend denim.',
            ],
            [
                'name_en' => 'Boho Maxi Skirt',
                'name_km' => 'សំពត់វែង Boho Maxi Skirt',
                'slug' => 'boho-maxi-skirt',
                'brand' => 'Bloom KH',
                'cat' => 'women',
                'base_price' => 52.00,
                'sale_price' => 38.00,
                'stock' => 16,
                'is_featured' => false,
                'image' => 'https://images.unsplash.com/photo-1583496661160-fb5218afa9a1?w=600&q=80',
                'sizes' => ['S', 'M', 'L'],
                'colors' => ['Terracotta', 'Cream Bohemian', 'Midnight Flora'],
                'desc' => 'Tiered lightweight cotton-viscose blend maxi skirt with elastic smocked waist and playful ruffled hemline.',
            ],
            [
                'name_en' => 'Pleated Midi Dress',
                'name_km' => 'រ៉ូបភ្លី Midi Dress ដ៏ស្រស់ស្អាត',
                'slug' => 'pleated-midi-dress',
                'brand' => 'Bloom KH',
                'cat' => 'women',
                'base_price' => 64.99,
                'sale_price' => 49.99,
                'stock' => 20,
                'is_featured' => true,
                'image' => 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=600&q=80',
                'sizes' => ['XS', 'S', 'M', 'L'],
                'colors' => ['Emerald Green', 'Champagne Gold', 'Royal Blue'],
                'desc' => 'Sophisticated accordion-pleated sleeveless dress featuring a high neckline and matching gold-accent belt.',
            ],
            [
                'name_en' => 'Linen Wide-Leg Trousers',
                'name_km' => 'ខោជើងធំលីនែននារីទាន់សម័យ',
                'slug' => 'linen-wide-leg-trousers',
                'brand' => 'Bloom KH',
                'cat' => 'women',
                'base_price' => 55.00,
                'sale_price' => 39.00,
                'stock' => 26,
                'is_featured' => true,
                'image' => 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=600&q=80',
                'sizes' => ['XS', 'S', 'M', 'L'],
                'colors' => ['Flax Ecru', 'Soft Olive', 'Charcoal'],
                'desc' => 'High-rise wide-leg linen pants with tailored front pleats and concealed zip for breezy summer refinement.',
            ],

            // Kids
            [
                'name_en' => 'Kids Cotton Set',
                'name_km' => 'ឈុតកូនក្មេងកប្បាសសរីរាង្គ',
                'slug' => 'kids-cotton-set',
                'brand' => 'Little Stars',
                'cat' => 'kids',
                'base_price' => 29.99,
                'sale_price' => 19.99,
                'stock' => 32,
                'is_featured' => true,
                'image' => 'https://images.unsplash.com/photo-1519457431-44ccd64a579b?w=600&q=80',
                'sizes' => ['2-3Y', '4-5Y', '6-7Y', '8-9Y'],
                'colors' => ['Sky Blue', 'Sunny Yellow', 'Pastel Mint'],
                'desc' => 'Ultra-soft hypoallergenic 100% organic cotton tee and shorts set. Designed for everyday adventures.',
            ],
            [
                'name_en' => 'Kids Denim Overalls',
                'name_km' => 'ខោអៀមខូវប៊យកូនក្មេង',
                'slug' => 'kids-denim-overalls',
                'brand' => 'Little Stars',
                'cat' => 'kids',
                'base_price' => 32.00,
                'sale_price' => 24.00,
                'stock' => 18,
                'is_featured' => false,
                'image' => 'https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=600&q=80',
                'sizes' => ['3-4Y', '5-6Y', '7-8Y'],
                'colors' => ['Medium Denim', 'Light Vintage'],
                'desc' => 'Durable washed denim dungarees with adjustable shoulder buckles, functional bib pocket, and relaxed play fit.',
            ],

            // Shoes
            [
                'name_en' => 'White Sneakers',
                'name_km' => 'ស្បែកជើងស្នីកឃើពណ៌សបុរាណ',
                'slug' => 'white-sneakers',
                'brand' => 'Street KH',
                'cat' => 'shoes',
                'base_price' => 79.99,
                'sale_price' => 59.99,
                'stock' => 25,
                'is_featured' => true,
                'image' => 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80',
                'sizes' => ['39', '40', '41', '42', '43', '44'],
                'colors' => ['Crisp White', 'Triple Black'],
                'desc' => 'Minimalist low-top street sneakers with padded memory foam insole and vulcanized non-slip rubber outsole.',
            ],
            [
                'name_en' => 'Leather Chelsea Boots',
                'name_km' => 'ស្បែកជើងប៊ូតស្បែក Chelsea Boots',
                'slug' => 'leather-chelsea-boots',
                'brand' => 'Street KH',
                'cat' => 'shoes',
                'base_price' => 99.99,
                'sale_price' => 79.99,
                'stock' => 14,
                'is_featured' => true,
                'image' => 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?w=600&q=80',
                'sizes' => ['40', '41', '42', '43', '44'],
                'colors' => ['Cognac Brown', 'Matte Black'],
                'desc' => 'Full-grain oiled leather chelsea boots with elastic side gussets and pull loops. Built to age with character.',
            ],
            [
                'name_en' => 'Classic Suede Loafers',
                'name_km' => 'ស្បែកជើងឡូហ្វ័រស្បែកស្រាល Suede',
                'slug' => 'classic-suede-loafers',
                'brand' => 'Street KH',
                'cat' => 'shoes',
                'base_price' => 89.00,
                'sale_price' => 69.00,
                'stock' => 19,
                'is_featured' => true,
                'image' => 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=600&q=80',
                'sizes' => ['40', '41', '42', '43', '44'],
                'colors' => ['Sand Suede', 'Navy Suede', 'Dark Brown'],
                'desc' => 'Supple Italian suede driving loafers with penny keeper strap and flexible rubber pebble driving sole.',
            ],

            // Accessories
            [
                'name_en' => 'Leather Crossbody Bag',
                'name_km' => 'កាបូបស្បែកឆៀង Crossbody',
                'slug' => 'leather-crossbody-bag',
                'brand' => 'Urban Lux',
                'cat' => 'accessories',
                'base_price' => 54.00,
                'sale_price' => 39.99,
                'stock' => 14,
                'is_featured' => true,
                'image' => 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600&q=80',
                'sizes' => ['One Size'],
                'colors' => ['Caramel', 'Black', 'Wine Red'],
                'desc' => 'Compact everyday saddle silhouette bag with magnetic flap, custom brass hardware, and adjustable strap.',
            ],
            [
                'name_en' => 'Minimalist Canvas Tote',
                'name_km' => 'កាបូបយួរក្រណាត់កង់វ៉ាស Tote',
                'slug' => 'minimalist-canvas-tote',
                'brand' => 'Studio KH',
                'cat' => 'accessories',
                'base_price' => 24.00,
                'sale_price' => 16.00,
                'stock' => 50,
                'is_featured' => false,
                'image' => 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&q=80',
                'sizes' => ['One Size'],
                'colors' => ['Natural Ecru', 'Washed Black'],
                'desc' => 'Heavyweight 16oz natural cotton canvas tote with interior zip organizer pocket and reinforced shoulder straps.',
            ],
            [
                'name_en' => 'Classic Polarized Sunglasses',
                'name_km' => 'វ៉ែនតាការពារកម្ដៅថ្ងៃ Polarized',
                'slug' => 'classic-polarized-sunglasses',
                'brand' => 'Urban Lux',
                'cat' => 'accessories',
                'base_price' => 35.00,
                'sale_price' => 25.00,
                'stock' => 40,
                'is_featured' => true,
                'image' => 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=600&q=80',
                'sizes' => ['One Size'],
                'colors' => ['Tortoise', 'Glossy Black', 'Amber'],
                'desc' => 'Acetate handcrafted sunglasses with UV400 polarized anti-glare scratch-resistant lenses.',
            ],
        ];

        $firstVariant = null;

        foreach ($products as $p) {
            $catId = $catMap[$p['cat']] ?? 1;
            $brandId = $brandMap[$p['brand']] ?? null;

            $product = Product::firstOrCreate(
                ['slug' => $p['slug']],
                [
                    'category_id' => $catId,
                    'brand_id' => $brandId,
                    'name_en' => $p['name_en'],
                    'name_km' => $p['name_km'],
                    'description_en' => $p['desc'],
                    'description_km' => $p['desc'],
                    'base_price' => $p['base_price'],
                    'sale_price' => $p['sale_price'],
                    'currency' => 'USD',
                    'is_featured' => $p['is_featured'],
                    'is_active' => true,
                    'total_sold' => rand(15, 120),
                    'total_views' => rand(100, 500),
                    'average_rating' => 4.9,
                    'review_count' => rand(10, 45),
                ]
            );

            // Primary Image
            ProductImage::firstOrCreate(
                ['product_id' => $product->id, 'is_primary' => true],
                [
                    'image_path' => $p['image'],
                    'alt_text_en' => $p['name_en'],
                    'alt_text_km' => $p['name_km'],
                    'sort_order' => 1,
                ]
            );

            // Variants for Sizes and Colors
            foreach ($p['sizes'] as $size) {
                foreach ($p['colors'] as $color) {
                    $sku = strtoupper(Str::slug($p['name_en'].'-'.$size.'-'.$color));
                    $variant = ProductVariant::firstOrCreate(
                        ['sku' => $sku],
                        [
                            'product_id' => $product->id,
                            'size_label' => $size,
                            'color_name_en' => $color,
                            'stock_quantity' => rand(5, 20),
                            'price_override' => null,
                            'is_active' => true,
                        ]
                    );
                    if (! $firstVariant) {
                        $firstVariant = $variant;
                    }
                }
            }
        }

        // 3. Seed Realistic Orders for Admin Dashboard & POS
        $admin = User::where('name', 'AdminStore')->first();
        $customer = User::where('email', 'dara@example.com')->first();
        $orderUser = $customer ?: $admin;

        if ($orderUser && $firstVariant) {
            $order1 = Order::firstOrCreate(
                ['order_number' => 'ORD-20261102-8821'],
                [
                    'user_id' => $orderUser->id,
                    'shipping_recipient' => 'Sokha Chan',
                    'shipping_phone' => '+855 12 345 678',
                    'shipping_address_line1' => '#42 St. 214, BKK1',
                    'shipping_city' => 'Phnom Penh',
                    'shipping_province' => 'Phnom Penh',
                    'shipping_country' => 'Cambodia',
                    'subtotal' => 268.00,
                    'discount_amount' => 0.00,
                    'shipping_fee' => 0.00,
                    'tax_amount' => 0.00,
                    'total_amount' => 268.00,
                    'currency' => 'USD',
                    'khr_total' => 268.00 * 4100,
                    'usd_to_khr_rate' => 4100,
                    'fulfillment_status' => 'delivered',
                    'payment_status' => 'paid',
                ]
            );

            $prod = Product::find($firstVariant->product_id);
            if ($prod) {
                OrderItem::firstOrCreate(
                    ['order_id' => $order1->id, 'product_id' => $prod->id],
                    [
                        'product_variant_id' => $firstVariant->id,
                        'product_name_en' => $prod->name_en,
                        'product_name_km' => $prod->name_km,
                        'product_sku' => $firstVariant->sku,
                        'size_label' => $firstVariant->size_label,
                        'color_name_en' => $firstVariant->color_name_en,
                        'unit_price' => 134.00,
                        'final_price' => 134.00,
                        'quantity' => 2,
                        'line_total' => 268.00,
                    ]
                );
            }

            Payment::firstOrCreate(
                ['order_id' => $order1->id],
                [
                    'payment_method' => 'bakong_khqr',
                    'transaction_id' => 'TXN-BK-20261102-8821',
                    'amount' => 268.00,
                    'currency' => 'USD',
                    'status' => 'paid',
                    'paid_at' => now(),
                    'gateway_response' => ['method' => 'Bakong KHQR', 'currency' => 'USD'],
                ]
            );

            $order2 = Order::firstOrCreate(
                ['order_number' => 'ORD-20261102-9412'],
                [
                    'user_id' => $orderUser->id,
                    'shipping_recipient' => 'Dara Sok',
                    'shipping_phone' => '+855 10 999 888',
                    'shipping_address_line1' => '#88 Mao Tse Toung Blvd',
                    'shipping_city' => 'Phnom Penh',
                    'shipping_province' => 'Phnom Penh',
                    'shipping_country' => 'Cambodia',
                    'subtotal' => 185.00,
                    'discount_amount' => 0.00,
                    'shipping_fee' => 0.00,
                    'tax_amount' => 0.00,
                    'total_amount' => 185.00,
                    'currency' => 'USD',
                    'khr_total' => 185.00 * 4100,
                    'usd_to_khr_rate' => 4100,
                    'fulfillment_status' => 'processing',
                    'payment_status' => 'paid',
                ]
            );

            if ($prod) {
                OrderItem::firstOrCreate(
                    ['order_id' => $order2->id, 'product_id' => $prod->id],
                    [
                        'product_variant_id' => $firstVariant->id,
                        'product_name_en' => $prod->name_en,
                        'product_name_km' => $prod->name_km,
                        'product_sku' => $firstVariant->sku,
                        'size_label' => $firstVariant->size_label,
                        'color_name_en' => $firstVariant->color_name_en,
                        'unit_price' => 185.00,
                        'final_price' => 185.00,
                        'quantity' => 1,
                        'line_total' => 185.00,
                    ]
                );
            }

            Payment::firstOrCreate(
                ['order_id' => $order2->id],
                [
                    'payment_method' => 'bakong_khqr',
                    'transaction_id' => 'TXN-BK-20261102-9412',
                    'amount' => 185.00,
                    'currency' => 'USD',
                    'status' => 'paid',
                    'paid_at' => now(),
                    'gateway_response' => ['method' => 'Bakong KHQR', 'currency' => 'USD'],
                ]
            );
        }
    }
}
