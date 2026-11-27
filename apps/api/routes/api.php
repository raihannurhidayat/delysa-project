<?php

use App\Http\Controllers\Api\V1\Admin\AdminOrderController;
use App\Http\Controllers\Api\V1\Admin\AdminProductController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\HealthController;
use App\Http\Controllers\Api\V1\OrderController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\RealtimeController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::prefix('v1')->group(function () {
    Route::get('/health', HealthController::class);

    // Katalog publik (storefront)
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/flash-sale', [ProductController::class, 'flashSale']);
    Route::get('/products/best-sellers', [ProductController::class, 'bestSellers']);
    Route::get('/products/new-arrivals', [ProductController::class, 'newArrivals']);
    Route::get('/products/by-category', [ProductController::class, 'byCategory']);
    Route::get('/products/{slug}', [ProductController::class, 'show']);

    // Pesanan publik & pelanggan (checkout, tracking, upload bukti bayar)
    Route::get('/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);
    Route::get('/orders/{codeOrId}', [OrderController::class, 'show']);
    Route::post('/orders/{codeOrId}/payment-proof', [OrderController::class, 'uploadPaymentProof']);

    // Sinkronisasi real-time (SSE & incremental events cursor)
    Route::get('/realtime/stream', [RealtimeController::class, 'stream']);
    Route::get('/realtime/events', [RealtimeController::class, 'events']);

    Route::prefix('auth')->group(function () {
        Route::post('/register', [AuthController::class, 'register']);
        Route::post('/login', [AuthController::class, 'login'])
            ->middleware('throttle:login');

        Route::middleware(['auth:sanctum', 'session.lifetime'])->group(function () {
            Route::get('/me', [AuthController::class, 'me']);
            Route::post('/logout', [AuthController::class, 'logout']);
        });
    });

    // Panel Admin & Pemilik Toko
    Route::prefix('admin')
        ->middleware(['auth:sanctum', 'session.lifetime', 'role:admin,store_owner'])
        ->group(function () {
            Route::get('/products', [AdminProductController::class, 'index']);
            Route::post('/products', [AdminProductController::class, 'store']);
            Route::get('/products/{product}', [AdminProductController::class, 'show']);
            Route::match(['patch', 'put', 'post'], '/products/{product}', [AdminProductController::class, 'update']);
            Route::delete('/products/{product}', [AdminProductController::class, 'destroy']);

            Route::get('/orders', [AdminOrderController::class, 'index']);
            Route::post('/orders', [AdminOrderController::class, 'store']);
            Route::patch('/orders/{codeOrId}/status', [AdminOrderController::class, 'updateStatus']);
            Route::get('/reports', [AdminOrderController::class, 'report']);
        });
});
