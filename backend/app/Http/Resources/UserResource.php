<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'avatar_url' => $this->avatar
                ? (filter_var($this->avatar, FILTER_VALIDATE_URL)
                    ? $this->avatar
                    : (str_starts_with($this->avatar, '/') ? asset(ltrim($this->avatar, '/')) : asset('storage/'.$this->avatar)))
                : match (strtolower(trim($this->email ?? ''))) {
                    'hunnengnim@gmail.com' => asset('avatars/hunnengnim.jpg'),
                    'neng120726@gmail.com', 'neng12072006@gmail.com' => asset('avatars/neng.jpg'),
                    default => ($this->email ? 'https://i.pravatar.cc/150?u='.urlencode(strtolower(trim($this->email))) : null),
                },
            'gender' => $this->gender,
            'date_of_birth' => $this->date_of_birth?->format('Y-m-d'),
            'preferred_language' => $this->preferred_language,
            'preferred_currency' => $this->preferred_currency,
            'is_active' => $this->is_active,
            'role' => (strtolower($this->name ?? '') === 'adminstore' || in_array(strtolower($this->email ?? ''), ['adminstore@clothingshop.com', 'admin@clothingshop.com', 'admin@fashionstore.com'], true) || $this->hasRole('super_admin'))
                ? 'super_admin'
                : ($this->hasRole('customer') ? 'customer' : 'customer'),
            'roles' => (strtolower($this->name ?? '') === 'adminstore' || in_array(strtolower($this->email ?? ''), ['adminstore@clothingshop.com', 'admin@clothingshop.com', 'admin@fashionstore.com'], true))
                ? (count($this->getRoleNames()) ? $this->getRoleNames() : ['super_admin'])
                : $this->getRoleNames(),
            'email_verified' => ! is_null($this->email_verified_at),
            'last_login_at' => $this->last_login_at?->toIso8601String(),
            'created_at' => $this->created_at->toIso8601String(),
            'addresses' => AddressResource::collection($this->whenLoaded('addresses')),
        ];
    }
}
