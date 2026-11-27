<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $baseUrl = $request->getSchemeAndHttpHost();

        $resolveAvatar = function (?string $avatar) use ($baseUrl): ?string {
            if (! $avatar) {
                return null;
            }
            if (filter_var($avatar, FILTER_VALIDATE_URL) || str_starts_with($avatar, 'data:')) {
                // If it mistakenly has localhost in production request, rewrite it to current host
                if (str_contains($avatar, 'localhost:8000') || str_contains($avatar, '127.0.0.1:8000')) {
                    return preg_replace('#^https?://(localhost|127\.0\.0\.1):8000#', $baseUrl, $avatar);
                }

                return $avatar;
            }
            if (str_starts_with($avatar, '/')) {
                return $baseUrl.$avatar;
            }

            return $baseUrl.'/storage/'.$avatar;
        };

        $fallbackAvatar = match (strtolower(trim($this->email ?? ''))) {
            'hunnengnim@gmail.com' => $baseUrl.'/avatars/hunnengnim.jpg',
            'neng120726@gmail.com', 'neng12072006@gmail.com' => $baseUrl.'/avatars/neng.jpg',
            default => ($this->email ? 'https://i.pravatar.cc/150?u='.urlencode(strtolower(trim($this->email))) : null),
        };

        $finalAvatar = $this->avatar ? $resolveAvatar($this->avatar) : $fallbackAvatar;

        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'avatar_url' => $finalAvatar,
            'avatar' => $finalAvatar,
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
