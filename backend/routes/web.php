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

Route::get('/', function () {
    $spaIndex = file_exists(public_path('index.html'))
        ? public_path('index.html')
        : (file_exists(public_path('app/index.html')) ? public_path('app/index.html') : null);

    if ($spaIndex) {
        return response()->file($spaIndex);
    }

    return response()->json([
        'service' => 'Fashion Store API',
        'status' => 'ok',
        'api_base' => '/api/v1',
        'frontend_url' => env('FRONTEND_URL', 'http://localhost:5173'),
    ]);
});

Route::get('/api/health', fn (): JsonResponse => response()->json([
    'service' => 'Fashion Store API',
    'status' => 'ok',
    'api_base' => '/api/v1',
    'frontend_url' => env('FRONTEND_URL', 'http://localhost:5173'),
]));

/*
|--------------------------------------------------------------------------
| Static Media & Uploads Serving
|--------------------------------------------------------------------------
| Ensure uploaded images from /uploads/*, /storage/*, and /avatars/* are
| served directly with correct image Content-Type headers rather than
| falling through to the SPA index.html fallback.
*/
Route::get('/uploads/{filename}', function (string $filename) {
    $cleanFilename = basename($filename);
    $candidates = [
        public_path('uploads/'.$cleanFilename),
        storage_path('app/public/uploads/'.$cleanFilename),
        storage_path('app/uploads/'.$cleanFilename),
        public_path('storage/uploads/'.$cleanFilename),
    ];

    foreach ($candidates as $filePath) {
        if (file_exists($filePath) && is_file($filePath)) {
            $mime = @mime_content_type($filePath) ?: 'image/jpeg';

            return response()->file($filePath, [
                'Content-Type' => $mime,
                'Cache-Control' => 'public, max-age=31536000',
            ]);
        }
    }

    return response()->json(['message' => 'Image not found.'], 404);
})->where('filename', '[A-Za-z0-9_.\-]+');

Route::get('/storage/{path}', function (string $path) {
    $cleanPath = ltrim(str_replace(['../', '..\\'], '', $path), '/');
    $candidates = [
        storage_path('app/public/'.$cleanPath),
        public_path('storage/'.$cleanPath),
        public_path($cleanPath),
        storage_path('app/'.$cleanPath),
    ];

    foreach ($candidates as $filePath) {
        if (file_exists($filePath) && is_file($filePath)) {
            $mime = @mime_content_type($filePath) ?: 'image/jpeg';

            return response()->file($filePath, [
                'Content-Type' => $mime,
                'Cache-Control' => 'public, max-age=31536000',
            ]);
        }
    }

    return response()->json(['message' => 'File not found.'], 404);
})->where('path', '.*');

Route::get('/avatars/{filename}', function (string $filename) {
    $cleanFilename = basename($filename);
    $candidates = [
        public_path('avatars/'.$cleanFilename),
        storage_path('app/public/avatars/'.$cleanFilename),
        storage_path('app/avatars/'.$cleanFilename),
    ];

    foreach ($candidates as $filePath) {
        if (file_exists($filePath) && is_file($filePath)) {
            $mime = @mime_content_type($filePath) ?: 'image/jpeg';

            return response()->file($filePath, [
                'Content-Type' => $mime,
                'Cache-Control' => 'public, max-age=31536000',
            ]);
        }
    }

    return response()->json(['message' => 'Avatar not found.'], 404);
})->where('filename', '[A-Za-z0-9_.\-]+');

Route::fallback(function () {
    $spaIndex = file_exists(public_path('index.html'))
        ? public_path('index.html')
        : (file_exists(public_path('app/index.html')) ? public_path('app/index.html') : null);

    if ($spaIndex) {
        return response()->file($spaIndex);
    }

    return response()->json([
        'service' => 'Fashion Store API',
        'status' => 'ok',
        'api_base' => '/api/v1',
        'frontend_url' => env('FRONTEND_URL', 'http://localhost:5173'),
    ]);
});
