<?php

namespace App\Http\Controllers\Api\V1\Customer;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class ProfileController extends Controller
{
    /**
     * GET /api/v1/user
     * Return authenticated user profile.
     */
    public function show(Request $request): JsonResponse
    {
        return response()->json([
            'data' => new UserResource($request->user()->load('addresses')),
        ]);
    }

    /**
     * PATCH /api/v1/user
     * Update profile info.
     */
    public function update(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:150'],
            'email' => ['sometimes', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($request->user()->id)],
            'phone' => ['sometimes', 'nullable', 'string', 'max:25'],
            'avatar' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'gender' => ['sometimes', 'nullable', 'in:male,female,other'],
            'date_of_birth' => ['sometimes', 'nullable', 'date', 'before:today'],
            'preferred_language' => ['sometimes', 'in:en,km'],
            'preferred_currency' => ['sometimes', 'in:USD,KHR'],
        ]);

        $request->user()->update($validated);

        return response()->json([
            'status' => 'success',
            'message' => 'Profile updated successfully!',
            'data' => new UserResource($request->user()->fresh()),
        ]);
    }

    /**
     * POST /api/v1/user/change-password
     * Change password for authenticated user.
     */
    public function changePassword(Request $request): JsonResponse
    {
        $request->validate([
            'current_password' => ['nullable', 'string'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
        ]);

        $user = $request->user();

        // If current password exists in database, verify it unless super_admin explicitly resetting
        if (! empty($user->password) && ! empty($request->current_password)) {
            if (! Hash::check($request->current_password, $user->password)) {
                return response()->json([
                    'message' => 'ពាក្យសម្ងាត់បច្ចុប្បន្នមិនត្រឹមត្រូវឡើយ (Current password is incorrect).',
                ], 422);
            }
        } elseif (! empty($user->password) && empty($request->current_password) && ! $user->hasRole('super_admin')) {
            return response()->json([
                'message' => 'សូមបញ្ចូលពាក្យសម្ងាត់បច្ចុប្បន្នរបស់អ្នក (Current password required).',
            ], 422);
        }

        $user->update(['password' => Hash::make($request->password)]);

        return response()->json([
            'status' => 'success',
            'message' => 'ពាក្យសម្ងាត់ត្រូវបានផ្លាស់ប្តូរជោគជ័យ! (Password changed successfully).',
        ]);
    }

    /**
     * POST /api/v1/user/avatar
     * Upload a profile avatar.
     */
    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => ['required', 'file', 'max:25600'], // Support up to 25MB for modern smartphone camera photos
        ]);

        $file = $request->file('avatar');
        $ext = strtolower($file->getClientOriginalExtension() ?: 'jpg');
        if (! in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif', 'heic', 'heif'], true)) {
            $ext = 'jpg';
        }

        $filename = 'avatar_'.$request->user()->id.'_'.time().'.'.$ext;

        // Save to public/avatars directly for 100% reliable serving on all platforms
        $destDir = public_path('avatars');
        if (! is_dir($destDir)) {
            @mkdir($destDir, 0755, true);
        }
        $file->move($destDir, $filename);

        $baseUrl = $request->getSchemeAndHttpHost();
        $avatarPath = '/avatars/'.$filename;
        $avatarUrl = $baseUrl.$avatarPath;

        $request->user()->update(['avatar' => $avatarPath]);

        return response()->json([
            'status' => 'success',
            'message' => 'រូបភាព Profile ត្រូវបានផ្លាស់ប្តូរជោគជ័យ! (Avatar updated successfully).',
            'data' => [
                'avatar_url' => $avatarUrl,
                'avatar' => $avatarPath,
                'user' => new UserResource($request->user()->fresh()),
            ],
        ]);
    }
}
