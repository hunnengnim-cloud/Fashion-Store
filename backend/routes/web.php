<?php

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Backend Web Routes
|--------------------------------------------------------------------------
| Laravel operates purely as the REST API backend; the React UI lives in
| the sibling frontend/ application.
*/

Route::get('/api/health', fn (): JsonResponse => response()->json([
    'service' => 'Fashion Store API',
    'status' => 'ok',
    'api_base' => '/api/v1',
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:5173'),
]));

Route::fallback(function () {
    $spaIndex = public_path('app/index.html');
    if (file_exists($spaIndex)) {
        return response()->file($spaIndex);
    }

    return response()->json([
        'service' => 'Fashion Store API',
        'status' => 'ok',
        'api_base' => '/api/v1',
        'frontend_url' => env('FRONTEND_URL', 'http://localhost:5173'),
    ]);
});
