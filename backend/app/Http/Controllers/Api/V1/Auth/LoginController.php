<?php

namespace App\Http\Controllers\Api\V1\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\EmailVerificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;

class LoginController extends Controller
{
    public function __construct(
        protected EmailVerificationService $emailVerifier
    ) {}

    /**
     * POST /api/v1/login
     */
    public function __invoke(LoginRequest $request): JsonResponse
    {
        $loginInput = trim($request->email);
        $roleMode = $request->role ? strtolower($request->role) : null;

        // If customer login with an email address, verify that the email domain is real
        if (filter_var($loginInput, FILTER_VALIDATE_EMAIL)) {
            $isKnownAdmin = in_array(strtolower($loginInput), [
                'adminstore@clothingshop.com',
                'admin@clothingshop.com',
                'adminstore@fashionstore.com',
                'admin@fashionstore.com',
            ], true);

            // Customers must have real emails
            if (! $isKnownAdmin) {
                $validation = $this->emailVerifier->validateRealEmail($loginInput);
                if (! $validation['valid']) {
                    return response()->json([
                        'message' => $validation['message'] ?? 'Email នេះមិនពិតប្រាកដឡើយ។ Login មិនជោគជ័យ។',
                        'errors' => [
                            'email' => [$validation['message'] ?? 'Email នេះមិនមានម៉ាស៊ីនបម្រើទទួលសំបុត្រ ឬជា Email ក្លែងក្លាយឡើយ។'],
                        ],
                    ], 422);
                }
            }
        }

        $user = User::where('email', $loginInput)
            ->orWhere('phone', $loginInput)
            ->orWhere('name', $loginInput)
            ->first();

        // Support AdminStore username or admin email aliases
        if (! $user && in_array(strtolower($loginInput), ['adminstore', 'admin', 'admin@clothingshop.com', 'adminstore@clothingshop.com', 'admin@fashionstore.com', 'adminstore@fashionstore.com'], true)) {
            $user = User::where('name', 'AdminStore')
                ->orWhere('email', 'adminstore@clothingshop.com')
                ->orWhere('email', 'admin@clothingshop.com')
                ->orWhere('email', 'adminstore@fashionstore.com')
                ->orWhere('email', 'admin@fashionstore.com')
                ->first();
        }

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return response()->json([
                'message' => 'ឈ្មោះគណនី ឬពាក្យសម្ងាត់មិនត្រឹមត្រូវឡើយ (Invalid credentials).',
            ], 401);
        }

        if (! $user->is_active) {
            return response()->json([
                'message' => 'គណនីរបស់អ្នកត្រូវបានផ្អាក។ សូមទាក់ទងមកផ្នែកបម្រើអតិថិជន។',
            ], 403);
        }

        $isKnownAdmin = in_array(strtolower($user->email ?? ''), [
            'adminstore@clothingshop.com',
            'admin@clothingshop.com',
            'adminstore@fashionstore.com',
            'admin@fashionstore.com',
        ], true) || in_array(strtolower($user->name ?? ''), ['adminstore', 'admin'], true);

        $isSuperAdmin = $user->hasRole('super_admin') || $isKnownAdmin;

        if ($isSuperAdmin && ! $user->hasRole('super_admin')) {
            try {
                $user->assignRole('super_admin');
            } catch (\Throwable $e) {
                // Ignore if role not seeded yet
            }
        }

        // Role-specific check if role parameter was provided
        if ($roleMode === 'admin') {
            if (! $isSuperAdmin) {
                return response()->json([
                    'message' => 'គណនីនេះមិនមែនជា Admin ឡើយ។ នៅក្នុង Admin Login អាចចូលបានតែ Admin តែមួយគត់។',
                ], 403);
            }
        }
        // If an admin logs in while on customer tab, allow login smoothly without blocking!

        // Revoke old tokens for this device if device_name provided
        if ($request->device_name) {
            $user->tokens()->where('name', $request->device_name)->delete();
        }

        $user->update(['last_login_at' => now()]);

        $tokenName = $request->device_name ?? 'api_token';
        $token = $user->createToken($tokenName, ['*'], now()->addDays(30))->plainTextToken;

        return response()->json([
            'message' => $isSuperAdmin ? 'ចូលប្រព័ន្ធ Admin ជោគជ័យ!' : 'ចូលគណនី Customer ជោគជ័យ!',
            'data' => [
                'user' => new UserResource($user->load(['addresses'])),
                'token' => $token,
                'role' => $isSuperAdmin ? 'admin' : 'customer',
            ],
        ]);
    }
}
