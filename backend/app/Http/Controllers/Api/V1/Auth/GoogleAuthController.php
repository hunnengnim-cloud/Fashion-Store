<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\Cart;
use App\Models\User;
use App\Models\Wishlist;
use App\Services\EmailVerificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class GoogleAuthController extends Controller
{
    public function __construct(
        protected EmailVerificationService $emailVerifier
    ) {
    }

    /**
     * Authenticate or register a customer using Google authentication.
     * POST /api/v1/auth/google
     */
    public function __invoke(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'credential' => ['nullable', 'string'],
            'access_token' => ['nullable', 'string'],
            'email' => ['nullable', 'string', 'email'],
            'name' => ['nullable', 'string', 'max:150'],
            'google_id' => ['nullable', 'string'],
            'avatar' => ['nullable', 'string'],
            'device_name' => ['nullable', 'string', 'max:100'],
        ]);

        $googleData = null;

        // 1. Verify Google ID Token if provided
        if (! empty($validated['credential'])) {
            $googleData = $this->emailVerifier->verifyGoogleIdToken($validated['credential']);
            if (! $googleData) {
                return response()->json([
                    'message' => 'ការផ្ទៀងផ្ទាត់ Google Token មិនជោគជ័យឡើយ។ សូមព្យាយាមម្ដងទៀត។ (Invalid Google Token)',
                ], 401);
            }
        }
        // 2. Verify Google Access Token if provided
        elseif (! empty($validated['access_token'])) {
            $googleData = $this->emailVerifier->verifyGoogleAccessToken($validated['access_token']);
            if (! $googleData) {
                return response()->json([
                    'message' => 'ការផ្ទៀងផ្ទាត់ Google Access Token មិនជោគជ័យឡើយ។ (Invalid Google Access Token)',
                ], 401);
            }
        }
        // 3. Connect via Real Verified Google Email
        elseif (! empty($validated['email'])) {
            $check = $this->emailVerifier->validateRealEmail($validated['email']);
            if (! $check['valid']) {
                return response()->json([
                    'message' => $check['message'] ?? 'Email នេះមិនមែនជាគណនី Google ពិតប្រាកដឡើយ។ (Invalid or fake Google email).',
                ], 422);
            }

            $rawUsername = explode('@', $validated['email'])[0];
            $cleanName = trim(preg_replace('/[0-9]+/', '', str_replace(['.', '_', '-'], ' ', $rawUsername)));
            $formattedName = $validated['name'] ?? ($cleanName ? ucwords($cleanName) : ucfirst($rawUsername));

            $googleData = [
                'email' => strtolower($validated['email']),
                'name' => $formattedName,
                'google_id' => $validated['google_id'] ?? 'goog_'.substr(md5(strtolower($validated['email'])), 0, 16),
                'avatar' => $validated['avatar'] ?? null,
                'email_verified' => true,
            ];
        } else {
            return response()->json([
                'message' => 'សូមផ្តល់ព័ត៌មានគណនី Google ឬ Email ពិតប្រាកដ (Google account email required).',
            ], 422);
        }

        $email = $googleData['email'];
        $name = $googleData['name'] ?: 'Customer';
        $googleId = $googleData['google_id'];
        $avatar = $googleData['avatar'];

        // Strict rule: Creating accounts via this endpoint is ONLY for Customers.
        // If an email belongs to Super Admin, redirect them to admin login
        if (in_array(strtolower($email), ['adminstore@clothingshop.com', 'admin@clothingshop.com', 'admin@fashionstore.com'], true)) {
            return response()->json([
                'message' => 'គណនី Admin មិនអាច Login តាមរយៈ Customer Google Login បានទេ។ សូមចូលតាម Admin Login។',
            ], 403);
        }

        // Find or create customer
        $user = User::where('email', $email)
            ->orWhere(function ($q) use ($googleId) {
                if ($googleId) {
                    $q->where('google_id', $googleId);
                }
            })
            ->first();

        $isNewUser = false;

        if (! $user) {
            // Register new customer
            $user = DB::transaction(function () use ($name, $email, $googleId, $avatar) {
                $created = User::create([
                    'name' => $name,
                    'email' => $email,
                    'google_id' => $googleId,
                    'avatar' => $avatar,
                    'password' => Hash::make(Str::random(32)),
                    'email_verified_at' => now(),
                    'is_active' => true,
                    'preferred_language' => 'en',
                    'preferred_currency' => 'USD',
                ]);

                $created->assignRole('customer');

                // Auto create Cart & Wishlist for customer
                Cart::create(['user_id' => $created->id]);
                Wishlist::create(['user_id' => $created->id]);

                return $created;
            });

            $isNewUser = true;
        } else {
            // Update existing user with Google details
            if (! $user->is_active) {
                return response()->json([
                    'message' => 'គណនីរបស់អ្នកត្រូវបានផ្អាក។ សូមទាក់ទងមកផ្នែកបម្រើអតិថិជន។',
                ], 403);
            }

            // Strictly prevent admin from signing in via Customer Google auth
            if ($user->hasRole('super_admin') || strtolower($user->name) === 'adminstore' || in_array(strtolower($user->email), ['adminstore@clothingshop.com', 'admin@clothingshop.com', 'admin@fashionstore.com'], true)) {
                return response()->json([
                    'message' => 'គណនី Admin មិនអាច Login តាមរយៈ Customer Google Login បានទេ។ សូមចូលតាម Admin Login។',
                ], 403);
            }

            $user->update([
                'google_id' => $user->google_id ?: $googleId,
                'email_verified_at' => $user->email_verified_at ?: now(),
                'avatar' => $user->avatar ?: $avatar,
                'last_login_at' => now(),
            ]);

            // Ensure customer role exists
            if (! $user->hasRole('customer') && ! $user->hasRole('super_admin')) {
                $user->assignRole('customer');
            }
        }

        $tokenName = $request->device_name ?? 'google_auth';
        $token = $user->createToken($tokenName, ['*'], now()->addDays(30))->plainTextToken;

        return response()->json([
            'message' => $isNewUser
                ? 'ចុះឈ្មោះ និង Login ជោគជ័យជាមួយគណនី Google ពិត!'
                : 'Login ជោគជ័យជាមួយគណនី Google ពិត!',
            'data' => [
                'user' => new UserResource($user->load(['addresses'])),
                'token' => $token,
                'is_new' => $isNewUser,
            ],
        ]);
    }

    /**
     * Check if an email address is real and valid before submitting.
     * POST /api/v1/auth/validate-email
     */
    public function validateRealEmail(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'string'],
        ]);

        $result = $this->emailVerifier->validateRealEmail($request->email);

        return response()->json($result, $result['valid'] ? 200 : 422);
    }
}

