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

Route::get('/', fn (): JsonResponse => response()->json([
    'service' => 'Fashion Store API',
    'status' => 'ok',
    'api_base' => '/api/v1',
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:5173'),
]));
