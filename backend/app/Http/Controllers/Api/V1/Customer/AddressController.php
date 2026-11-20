<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\AddressResource;
use App\Models\Address;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AddressController extends Controller
{
    /**
     * GET /api/v1/addresses
     */
    public function index(Request $request): JsonResponse
    {
        $addresses = $request->user()->addresses()->orderByDesc('is_default')->get();

        return response()->json(['data' => AddressResource::collection($addresses)]);
    }

    /**
     * POST /api/v1/addresses
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'label' => ['sometimes', 'string', 'max:50'],
            'recipient_name' => ['required', 'string', 'max:150'],
            'phone' => ['required', 'string', 'max:20'],
            'address_line1' => ['required', 'string', 'max:255'],
            'address_line2' => ['nullable', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:100'],
            'province' => ['required', 'string', 'max:100'],
            'country' => ['sometimes', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'is_default' => ['boolean'],
        ]);

        $address = DB::transaction(function () use ($request, $validated) {
            if (! empty($validated['is_default'])) {
                $request->user()->addresses()->update(['is_default' => false]);
            }

            // First address is always default
            if ($request->user()->addresses()->count() === 0) {
                $validated['is_default'] = true;
            }

            return $request->user()->addresses()->create($validated);
        });

        return response()->json([
            'message' => 'Address added.',
            'data' => new AddressResource($address),
        ], 201);
    }

    /**
     * PATCH /api/v1/addresses/{address}
     */
    public function update(Request $request, Address $address): JsonResponse
    {
        $this->authorize('update', $address);

        $validated = $request->validate([
            'label' => ['sometimes', 'string', 'max:50'],
            'recipient_name' => ['sometimes', 'string', 'max:150'],
            'phone' => ['sometimes', 'string', 'max:20'],
            'address_line1' => ['sometimes', 'string', 'max:255'],
            'address_line2' => ['nullable', 'string', 'max:255'],
            'city' => ['sometimes', 'string', 'max:100'],
            'province' => ['sometimes', 'string', 'max:100'],
            'country' => ['sometimes', 'string', 'max:100'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'latitude' => ['nullable', 'numeric'],
            'longitude' => ['nullable', 'numeric'],
            'is_default' => ['boolean'],
        ]);

        DB::transaction(function () use ($request, $address, $validated) {
            if (! empty($validated['is_default'])) {
                $request->user()->addresses()->update(['is_default' => false]);
            }
            $address->update($validated);
        });

        return response()->json([
            'message' => 'Address updated.',
            'data' => new AddressResource($address->fresh()),
        ]);
    }

    /**
     * DELETE /api/v1/addresses/{address}
     */
    public function destroy(Request $request, Address $address): JsonResponse
    {
        $this->authorize('delete', $address);

        $address->delete();

        // Promote another address to default if this was default
        if ($address->is_default) {
            $request->user()->addresses()->first()?->update(['is_default' => true]);
        }

        return response()->json(['message' => 'Address removed.']);
    }

    /**
     * PATCH /api/v1/addresses/{address}/set-default
     */
    public function setDefault(Request $request, Address $address): JsonResponse
    {
        $this->authorize('update', $address);

        DB::transaction(function () use ($request, $address) {
            $request->user()->addresses()->update(['is_default' => false]);
            $address->update(['is_default' => true]);
        });

        return response()->json(['message' => 'Default address updated.']);
    }
}
