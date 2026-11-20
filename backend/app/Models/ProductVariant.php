<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ProductVariant extends Model
{
    protected $fillable = [
        'product_id', 'size_label', 'size_value', 'size_type',
        'color_name_en', 'color_name_km', 'color_hex',
        'sku', 'price_override', 'sale_price_override',
        'stock_quantity', 'low_stock_threshold', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'price_override' => 'decimal:2',
            'sale_price_override' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    // ── Relationships ──────────────────────────────────────────────

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function cartItems(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function inventoryMovements(): HasMany
    {
        return $this->hasMany(InventoryMovement::class);
    }

    // ── Scopes ─────────────────────────────────────────────────────

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    public function scopeInStock(Builder $query): Builder
    {
        return $query->where('stock_quantity', '>', 0);
    }

    public function scopeLowStock(Builder $query): Builder
    {
        return $query->whereColumn('stock_quantity', '<=', 'low_stock_threshold')
            ->where('stock_quantity', '>', 0);
    }

    // ── Helpers ────────────────────────────────────────────────────

    public function getEffectivePriceAttribute(): string
    {
        if ($this->price_override !== null) {
            return $this->sale_price_override ?? $this->price_override;
        }

        return $this->product->effective_price;
    }

    public function getSizeLabelDisplayAttribute(): string
    {
        return $this->size_type === 'numeric'
            ? ($this->size_value ?? '')
            : ($this->size_label ?? '');
    }

    public function isAvailable(int $quantity = 1): bool
    {
        return $this->is_active && $this->stock_quantity >= $quantity;
    }
}
