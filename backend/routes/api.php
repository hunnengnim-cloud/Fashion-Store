<?php

use App\Http\Controllers\Api\V1\Auth\ForgotPasswordController;
use App\Http\Controllers\Api\V1\Auth\GoogleAuthController;
use App\Http\Controllers\Api\V1\Auth\LoginController;
use App\Http\Controllers\Api\V1\Auth\LogoutController;
use App\Http\Controllers\Api\V1\Auth\RegisterController;
use App\Http\Controllers\Api\V1\Customer\AddressController;
use App\Http\Controllers\Api\V1\Customer\ProfileController;
use App\Http\Controllers\Api\V1\Payment\BakongPaymentController;
use App\Models\Order;
use App\Models\User;
use App\Services\TelegramService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — /api/v1/
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function (): void {

    // ── Health check (public) ─────────────────────────────────────
    Route::get('health', fn () => response()->json([
        'status' => 'ok',
        'version' => 'v1',
        'time' => now()->toIso8601String(),
    ]));

    // ── Bakong KHQR Payment Gateway ──────────────────────────────
    Route::prefix('payment/bakong')->name('payment.bakong.')->group(function (): void {
        Route::post('qr', [BakongPaymentController::class, 'generateQr'])->name('qr');
        Route::post('check', [BakongPaymentController::class, 'checkTransaction'])->name('check');
        Route::get('info', [BakongPaymentController::class, 'gatewayInfo'])->name('info');
    });

    // ── Telegram Order Receipt Notification ───────────────────────
    Route::post('telegram/send-receipt', function (Request $request, TelegramService $telegram): JsonResponse {
        $validated = $request->validate([
            'id' => 'nullable|string',
            'order_id' => 'nullable|string',
            'date' => 'nullable|string',
            'name' => 'nullable|string',
            'phone' => 'nullable|string',
            'address' => 'nullable|string',
            'items' => 'nullable|array',
            'total' => 'nullable|numeric',
            'khr_total' => 'nullable|numeric',
            'payment' => 'nullable|string',
            'status' => 'nullable|string',
        ]);

        $orderData = $validated;
        $orderData['id'] = $validated['id'] ?? $validated['order_id'] ?? 'CS-'.date('YmdHis');

        $result = $telegram->sendOrderReceipt($orderData);

        return response()->json($result, $result['ok'] ? 200 : 422);
    })->name('telegram.receipt');

    // ── Customer Confirms Order Delivery (Controlled by User) ───
    Route::post('orders/{order}/confirm-delivery', function (string $order): JsonResponse {
        $found = Order::where('id', $order)->orWhere('order_number', $order)->first();
        if ($found) {
            $found->fulfillment_status = 'delivered';
            $found->delivered_at = now();
            if ($found->payment_status !== 'paid') {
                $found->payment_status = 'paid';
            }
            $found->save();

            return response()->json([
                'success' => true,
                'message' => 'ការបញ្ជាទិញត្រូវបានបញ្ជាក់ថាបានទទួលទំនិញ និងទូទាត់ប្រាក់រួចរាល់ (Delivered & Paid)!',
                'order' => $found,
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Order delivery noted.',
        ]);
    })->name('orders.confirm-delivery');

    // ── Public Auth (rate limited: 10/min per IP) ─────────────────
    Route::middleware('throttle:auth')->group(function (): void {
        Route::post('register', RegisterController::class)->name('auth.register');
        Route::post('login', LoginController::class)->name('auth.login');
        Route::post('auth/google', GoogleAuthController::class)->name('auth.google');
        Route::post('auth/validate-email', [GoogleAuthController::class, 'validateRealEmail'])->name('auth.validate-email');
        Route::post('forgot-password', [ForgotPasswordController::class, 'sendResetLink'])->name('auth.forgot');
        Route::post('reset-password', [ForgotPasswordController::class, 'resetPassword'])->name('auth.reset');
    });

    // ── Authenticated Routes (rate limited: 60/min per user) ──────
    Route::middleware(['auth:sanctum', 'throttle:api'])->group(function (): void {

        // ── Auth ──────────────────────────────────────────────────
        Route::post('logout', LogoutController::class)->name('auth.logout');
        Route::post('logout-all', [LogoutController::class, 'logoutAll'])->name('auth.logout-all');

        // ── Profile ───────────────────────────────────────────────
        Route::get('user', [ProfileController::class, 'show'])->name('profile.show');
        Route::patch('user', [ProfileController::class, 'update'])->name('profile.update');
        Route::post('user/change-password', [ProfileController::class, 'changePassword'])->name('profile.password');
        Route::post('user/set-password', function (Request $request): JsonResponse {
            $validated = $request->validate([
                'password' => ['required', 'string', 'min:6'],
            ]);

            $request->user()->update([
                'password' => Hash::make($validated['password']),
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'ពាក្យសម្ងាត់ត្រូវបានរក្សាទុកជោគជ័យ! លោកអ្នកអាចប្រើប្រាស់វាសម្រាប់ Login លើកក្រោយបាន។',
            ]);
        })->name('user.set-password');
        Route::post('user/avatar', [ProfileController::class, 'uploadAvatar'])->name('profile.avatar');

        // ── Addresses ─────────────────────────────────────────────
        Route::prefix('addresses')->name('addresses.')->group(function (): void {
            Route::get('/', [AddressController::class, 'index'])->name('index');
            Route::post('/', [AddressController::class, 'store'])->name('store');
            Route::patch('/{address}', [AddressController::class, 'update'])->name('update');
            Route::delete('/{address}', [AddressController::class, 'destroy'])->name('destroy');
            Route::patch('/{address}/set-default', [AddressController::class, 'setDefault'])->name('default');
        });

        // ── Customer Order History ────────────────────────────────
        Route::get('customer/orders', function (Request $request): JsonResponse {
            $user = $request->user();
            $orders = Order::where('user_id', $user->id)
                ->with('items')
                ->latest()
                ->get();

            return response()->json([
                'success' => true,
                'customer' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                ],
                'orders_count' => $orders->count(),
                'total_spent_usd' => (float) $orders->sum('total_amount'),
                'orders' => $orders,
            ]);
        })->name('customer.orders');

        // ── Admin-only Routes ─────────────────────────────────────
        Route::prefix('admin')
            ->name('admin.')
            ->middleware('role:super_admin|shop_admin|inventory_manager|order_manager')
            ->group(function (): void {

                Route::get('dashboard', function (Request $request): JsonResponse {
                    $user = $request->user();

                    return response()->json([
                        'message' => 'Admin dashboard',
                        'admin' => [
                            'name' => $user->name,
                            'email' => $user->email,
                            'roles' => $user->getRoleNames(),
                        ],
                    ]);
                })->name('dashboard');

                // Phase 3 — Products (stub)
                Route::get('products', fn () => response()->json(['message' => 'Products — coming in Phase 3']))->name('products.index');
                // Orders API
                Route::get('orders', fn () => response()->json(['message' => 'Orders — coming in Phase 7']))->name('orders.index');
                Route::patch('orders/{order}/status', function (Request $request, string $order): JsonResponse {
                    $found = Order::where('id', $order)->orWhere('order_number', $order)->first();
                    if ($found) {
                        $validated = $request->validate([
                            'status' => 'nullable|string',
                            'delivery_stage' => 'nullable|integer',
                            'payment_status' => 'nullable|string',
                            'shipping_provider' => 'nullable|string',
                            'tracking_number' => 'nullable|string',
                        ]);
                        if (isset($validated['status'])) {
                            $found->fulfillment_status = $validated['status'];
                            if ($validated['status'] === 'delivered') {
                                $found->delivered_at = now();
                                if ($found->payment_status !== 'paid') {
                                    $found->payment_status = 'paid';
                                }
                            } elseif ($validated['status'] === 'shipped') {
                                $found->shipped_at = now();
                            } elseif ($validated['status'] === 'confirmed') {
                                $found->confirmed_at = now();
                            }
                        }
                        if (isset($validated['payment_status'])) {
                            $found->payment_status = $validated['payment_status'];
                        }
                        if (isset($validated['shipping_provider'])) {
                            $found->shipping_provider = $validated['shipping_provider'];
                        }
                        if (isset($validated['tracking_number'])) {
                            $found->tracking_number = $validated['tracking_number'];
                        }
                        $found->save();

                        return response()->json(['message' => 'Order status updated successfully.', 'order' => $found]);
                    }

                    return response()->json(['message' => 'Order status noted.']);
                })->name('orders.update-status');
                Route::delete('orders/{order}', function (string $order): JsonResponse {
                    $found = Order::where('id', $order)->orWhere('order_number', $order)->first();
                    if ($found) {
                        $found->delete();
                    }

                    return response()->json(['message' => 'Order deleted successfully.']);
                })->name('orders.destroy');

                // Reports API
                Route::get('reports', function (Request $request): JsonResponse {
                    $startDate = $request->query('start_date');
                    $endDate = $request->query('end_date');

                    $query = Order::query()->with('items');
                    if ($startDate) {
                        $query->whereDate('created_at', '>=', $startDate);
                    }
                    if ($endDate) {
                        $query->whereDate('created_at', '<=', $endDate);
                    }

                    $orders = $query->latest()->get();

                    $totalRevenueUsd = (float) $orders->sum('total_amount');
                    $totalRevenueKhr = (float) $orders->sum('khr_total');
                    if ($totalRevenueKhr <= 0) {
                        $totalRevenueKhr = round($totalRevenueUsd * 4100);
                    }
                    $orderCount = $orders->count();
                    $avgOrderValue = $orderCount > 0 ? round($totalRevenueUsd / $orderCount, 2) : 0.00;

                    return response()->json([
                        'summary' => [
                            'total_revenue_usd' => $totalRevenueUsd,
                            'total_revenue_khr' => $totalRevenueKhr,
                            'total_orders' => $orderCount,
                            'avg_order_value' => $avgOrderValue,
                        ],
                        'orders' => $orders,
                    ]);
                })->name('reports.index');
                // Users API
                Route::get('users', function (): JsonResponse {
                    $users = User::with('roles')->latest()->get()->map(function ($u) {
                        $avatarUrl = null;
                        if ($u->avatar) {
                            if (filter_var($u->avatar, FILTER_VALIDATE_URL)) {
                                $avatarUrl = $u->avatar;
                            } elseif (str_starts_with($u->avatar, '/')) {
                                $avatarUrl = asset(ltrim($u->avatar, '/'));
                            } else {
                                $avatarUrl = asset('storage/'.$u->avatar);
                            }
                        } else {
                            $avatarUrl = match (strtolower(trim($u->email ?? ''))) {
                                'hunnengnim@gmail.com' => asset('avatars/hunnengnim.jpg'),
                                'neng120726@gmail.com', 'neng12072006@gmail.com' => asset('avatars/neng.jpg'),
                                default => $u->email ? 'https://i.pravatar.cc/150?u='.urlencode(strtolower(trim($u->email))) : null,
                            };
                        }

                        return [
                            'id' => $u->id,
                            'name' => $u->name,
                            'email' => $u->email,
                            'phone' => $u->phone,
                            'avatar' => $avatarUrl,
                            'roles' => $u->getRoleNames(),
                            'is_active' => (bool) $u->is_active,
                            'created_at' => $u->created_at ? $u->created_at->format('M d, Y') : 'Oct 18, 2026',
                        ];
                    });

                    return response()->json(['data' => $users]);
                })->name('users.index');

                Route::post('users', function (Request $request, \App\Services\EmailVerificationService $emailVerifier): JsonResponse {
                    $validated = $request->validate([
                        'name' => 'required|string|max:255',
                        'email' => 'required|string|email|max:255|unique:users,email',
                        'phone' => 'nullable|string|max:20',
                        'password' => 'required|string|min:8',
                        'role' => 'nullable|string',
                    ]);

                    $requestedRole = strtolower($validated['role'] ?? 'customer');
                    if (in_array($requestedRole, ['super_admin', 'admin', 'shop_admin', 'order_manager', 'inventory_manager'], true)) {
                        return response()->json([
                            'message' => 'Admin account is strictly unique (AdminStore). Additional admin accounts cannot be created. Only customer accounts can be created.',
                            'errors' => ['role' => ['ការបង្កើតអាខោនគឺបានតែ Customer ទេ។ Admin មានតែមួយអាខោនប៉ុណ្ណោះ។']],
                        ], 422);
                    }

                    $check = $emailVerifier->validateRealEmail($validated['email']);
                    if (! $check['valid']) {
                        return response()->json([
                            'message' => $check['message'],
                            'errors' => ['email' => [$check['message']]],
                        ], 422);
                    }

                    $user = User::create([
                        'name' => $validated['name'],
                        'email' => $validated['email'],
                        'phone' => $validated['phone'] ?? null,
                        'password' => Hash::make($validated['password']),
                        'email_verified_at' => now(),
                        'is_active' => true,
                    ]);

                    $user->assignRole('customer');

                    $avatarUrl = 'https://i.pravatar.cc/150?u='.urlencode(strtolower(trim($user->email)));
                    $user->update(['avatar' => $avatarUrl]);

                    return response()->json([
                        'message' => 'Customer account created successfully',
                        'user' => [
                            'id' => $user->id,
                            'name' => $user->name,
                            'email' => $user->email,
                            'phone' => $user->phone,
                            'avatar' => $avatarUrl,
                            'roles' => ['customer'],
                            'is_active' => true,
                            'created_at' => $user->created_at ? $user->created_at->format('M d, Y') : 'Oct 18, 2026',
                        ],
                    ], 201);
                })->name('users.store');

                Route::patch('users/{user}/status', function (User $user): JsonResponse {
                    $user->update(['is_active' => ! $user->is_active]);

                    return response()->json([
                        'message' => 'User status updated',
                        'is_active' => (bool) $user->is_active,
                    ]);
                })->name('users.toggle-status');

                Route::delete('users/{user}', function (Request $request, string $userId): JsonResponse {
                    $user = User::withTrashed()->find($userId);
                    if (! $user) {
                        return response()->json(['message' => 'User not found.'], 404);
                    }

                    if ($request->user() && (int) $request->user()->id === (int) $user->id) {
                        return response()->json(['message' => 'You cannot delete your own logged-in account.'], 403);
                    }

                    if ($user->hasRole('super_admin') || in_array($user->email, ['adminstore@clothingshop.com', 'admin@clothingshop.com', 'admin@fashionstore.com'], true) || (int) $user->id === 1) {
                        return response()->json(['message' => 'Cannot delete the Super Admin account.'], 403);
                    }

                    try {
                        \Illuminate\Support\Facades\DB::transaction(function () use ($user) {
                            // 1. Delete associated orders and items (satisfies restrictOnDelete)
                            if (\Illuminate\Support\Facades\Schema::hasTable('orders')) {
                                $orders = \App\Models\Order::where('user_id', $user->id)->get();
                                foreach ($orders as $order) {
                                    if (\Illuminate\Support\Facades\Schema::hasTable('order_items')) {
                                        \App\Models\OrderItem::where('order_id', $order->id)->delete();
                                    }
                                    if (\Illuminate\Support\Facades\Schema::hasTable('payments')) {
                                        \App\Models\Payment::where('order_id', $order->id)->delete();
                                    }
                                    $order->forceDelete();
                                }
                            }

                            // 2. Delete cart & cart items
                            if (\Illuminate\Support\Facades\Schema::hasTable('carts')) {
                                if (\Illuminate\Support\Facades\Schema::hasTable('cart_items')) {
                                    \App\Models\CartItem::whereHas('cart', fn ($q) => $q->where('user_id', $user->id))->delete();
                                }
                                \App\Models\Cart::where('user_id', $user->id)->delete();
                            }

                            // 3. Delete wishlist & wishlist items
                            if (\Illuminate\Support\Facades\Schema::hasTable('wishlists')) {
                                if (\Illuminate\Support\Facades\Schema::hasTable('wishlist_items')) {
                                    \App\Models\WishlistItem::whereHas('wishlist', fn ($q) => $q->where('user_id', $user->id))->delete();
                                }
                                \App\Models\Wishlist::where('user_id', $user->id)->delete();
                            }

                            // 4. Delete addresses
                            if (\Illuminate\Support\Facades\Schema::hasTable('addresses')) {
                                \App\Models\Address::where('user_id', $user->id)->delete();
                            }

                            // 5. Delete tokens & roles
                            $user->tokens()->delete();
                            $user->roles()->detach();

                            // 6. Permanently force delete the user
                            $user->forceDelete();
                        });

                        return response()->json([
                            'status' => 'success',
                            'message' => 'User deleted successfully.',
                        ]);
                    } catch (\Throwable $e) {
                        \Illuminate\Support\Facades\Log::error('User deletion error: '.$e->getMessage());

                        return response()->json(['message' => 'Cannot delete user: '.$e->getMessage()], 422);
                    }
                })->name('users.destroy');

                Route::get('customers/{user}/orders', function (User $user): JsonResponse {
                    $orders = Order::where('user_id', $user->id)
                        ->with('items')
                        ->latest()
                        ->get();

                    return response()->json([
                        'customer' => [
                            'id' => $user->id,
                            'name' => $user->name,
                            'email' => $user->email,
                            'phone' => $user->phone,
                            'avatar' => $user->avatar ? asset('storage/'.$user->avatar) : null,
                            'created_at' => $user->created_at?->format('M d, Y'),
                        ],
                        'orders_count' => $orders->count(),
                        'total_spent_usd' => (float) $orders->sum('total_amount'),
                        'orders' => $orders,
                    ]);
                })->name('customers.orders');

                Route::post('upload', function (Request $request): JsonResponse {
                    $request->validate([
                        'image' => 'required|image|mimes:jpeg,png,jpg,webp,gif|max:8192',
                    ]);

                    $file = $request->file('image');
                    $filename = time().'_'.uniqid().'.'.$file->getClientOriginalExtension();
                    $path = $file->storeAs('uploads', $filename, 'public');

                    return response()->json([
                        'message' => 'Image uploaded successfully.',
                        'url' => asset('storage/'.$path),
                        'path' => $path,
                    ]);
                })->name('upload');

            });

    }); // end auth:sanctum

    // ── Catch-all: unknown /api/v1/* endpoints ────────────────────
    Route::fallback(fn () => response()->json([
        'message' => 'API endpoint not found.',
    ], 404));

}); // end v1
