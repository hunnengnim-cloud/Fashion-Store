<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $topLevel = [
            ['name_en' => "Men's Clothing",      'name_km' => 'សំលៀកបំពាក់បុរស',  'slug' => 'mens-clothing'],
            ['name_en' => "Women's Clothing",     'name_km' => 'សំលៀកបំពាក់ស្ត្រី', 'slug' => 'womens-clothing'],
            ['name_en' => "Children's Clothing",  'name_km' => 'សំលៀកបំពាក់កុមារ', 'slug' => 'childrens-clothing'],
            ['name_en' => 'Shoes',                'name_km' => 'ស្បែកជើង',          'slug' => 'shoes'],
            ['name_en' => 'Accessories',          'name_km' => 'គ្រឿងសំអាង',        'slug' => 'accessories'],
        ];

        $subCategories = [
            'mens-clothing' => [
                ['name_en' => 'T-Shirts',    'name_km' => 'អាវទីស្ស',      'slug' => 'mens-tshirts'],
                ['name_en' => 'Shirts',      'name_km' => 'អាវឈើឆ្កាង',   'slug' => 'mens-shirts'],
                ['name_en' => 'Pants & Jeans', 'name_km' => 'ខោ និងចាន',   'slug' => 'mens-pants'],
                ['name_en' => 'Jackets',     'name_km' => 'អាវធំ',         'slug' => 'mens-jackets'],
                ['name_en' => 'Hoodies',     'name_km' => 'អាវវត្ថុរំជោរ', 'slug' => 'mens-hoodies'],
            ],
            'womens-clothing' => [
                ['name_en' => 'T-Shirts',    'name_km' => 'អាវទីស្ស',      'slug' => 'womens-tshirts'],
                ['name_en' => 'Dresses',     'name_km' => 'រ៉ូប',           'slug' => 'womens-dresses'],
                ['name_en' => 'Pants & Jeans', 'name_km' => 'ខោ និងចាន',   'slug' => 'womens-pants'],
                ['name_en' => 'Jackets',     'name_km' => 'អាវវែង',        'slug' => 'womens-jackets'],
                ['name_en' => 'Hoodies',     'name_km' => 'អាវវត្ថុរំជោរ', 'slug' => 'womens-hoodies'],
            ],
            'childrens-clothing' => [
                ['name_en' => 'T-Shirts',    'name_km' => 'អាវទីស្ស',    'slug' => 'kids-tshirts'],
                ['name_en' => 'Pants',       'name_km' => 'ខោ',           'slug' => 'kids-pants'],
                ['name_en' => 'Dresses',     'name_km' => 'រ៉ូប',         'slug' => 'kids-dresses'],
            ],
            'shoes' => [
                ['name_en' => 'Sneakers',    'name_km' => 'ស្បែកជើងកីឡា', 'slug' => 'sneakers'],
                ['name_en' => 'Sandals',     'name_km' => 'ស្បែកជើងស',   'slug' => 'sandals'],
                ['name_en' => 'Formal',      'name_km' => 'ស្បែកជើងផ្លូវការ', 'slug' => 'formal-shoes'],
            ],
            'accessories' => [
                ['name_en' => 'Bags',        'name_km' => 'កាបូប',         'slug' => 'bags'],
                ['name_en' => 'Belts',       'name_km' => 'ខ្សែក្រវ៉ាត់',  'slug' => 'belts'],
                ['name_en' => 'Hats & Caps', 'name_km' => 'មួក',           'slug' => 'hats-caps'],
                ['name_en' => 'Watches',     'name_km' => 'នាឡិកា',        'slug' => 'watches'],
            ],
        ];

        foreach ($topLevel as $i => $cat) {
            $parent = Category::firstOrCreate(
                ['slug' => $cat['slug']],
                array_merge($cat, ['sort_order' => $i + 1, 'is_active' => true])
            );

            if (isset($subCategories[$cat['slug']])) {
                foreach ($subCategories[$cat['slug']] as $j => $sub) {
                    Category::firstOrCreate(
                        ['slug' => $sub['slug']],
                        array_merge($sub, [
                            'parent_id' => $parent->id,
                            'sort_order' => $j + 1,
                            'is_active' => true,
                        ])
                    );
                }
            }
        }

        $this->command->info('Categories seeded.');
    }
}
