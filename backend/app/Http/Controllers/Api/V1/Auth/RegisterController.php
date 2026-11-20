<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Resources\UserResource;
use App\Models\Cart;
use App\Models\User;
use App\Models\Wishlist;
use App\Services\EmailVerificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class RegisterController extends Controller
{
    public function __construct(
        protected EmailVerificationService $emailVerifier
    ) {}

    /**
     * POST /api/v1/register
     * Register a new customer account.
     * Creating new accounts is strictly restricted to Customers only.
     */
    public function __invoke(RegisterRequest $request): JsonResponse
    {
        $email = strtolower(trim($request->email));
        $name = trim($request->name);

        // Strict rule 1: Admin cannot be created. Admin account is unique.
        $reservedAdminTerms = ['admin', 'adminstore', 'super_admin', 'administrator', 'root'];
        if (in_array(strtolower($name), $reservedAdminTerms, true) ||
            str_contains($email, 'admin@') ||
            str_contains($email, 'adminstore@')) {
            return response()->json([
                'message' => 'ការបង្កើតអាខោនថ្មីគឺបានតែ Customer ប៉ុណ្ណោះ។ គណនី Admin មានតែមួយគត់ មិនអាចបង្កើតបន្ថែមបានឡើយ (Admin account is unique).',
            ], 422);
        }

        // Strict rule 2: Email must be a REAL email with valid MX mail exchange server
        $validation = $this->emailVerifier->validateRealEmail($email);
        if (! $validation['valid']) {
            return response()->json([
                'message' => $validation['message'] ?? 'Email នេះមិនពិតប្រាកដឡើយ។ ការចុះឈ្មោះមិនជោគជ័យ។',
                'errors' => [
                    'email' => [$validation['message'] ?? 'Email នេះមិនមានម៉ាស៊ីនបម្រើទទួលសំបុត្រ ឬជា Email ក្លែងក្លាយឡើយ។'],
                ],
            ], 422);
        }

        $user = DB::transaction(function () use ($request, $name, $email) {
            $user = User::create([
                'name' => $name,
                'email' => $email,
                'password' => $request->password, // cast hashes it
                'phone' => $request->phone,
                'preferred_language' => $request->preferred_language ?? 'en',
                'preferred_currency' => 'USD',
                'is_active' => true,
                'email_verified_at' => now(), // verified real domain
            ]);

            // Always assign Customer role
            $user->assignRole('customer');

            // Auto-create cart and wishlist
            Cart::create(['user_id' => $user->id]);
            Wishlist::create(['user_id' => $user->id]);

            return $user;
        });

        $token = $user->createToken('customer_token', ['*'], now()->addDays(30))->plainTextToken;

        return response()->json([
            'message' => 'បង្កើតអាខោន Customer ជោគជ័យ!',
            'data' => [
                'user' => new UserResource($user),
                'token' => $token,
                'role' => 'customer',
            ],
        ], 201);
    }
}
