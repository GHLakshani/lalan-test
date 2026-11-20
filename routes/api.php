<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ServiceRequestController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->name('auth.')->group(function () {
    Route::post('/login', [AuthController::class, 'login'])->middleware('throttle:6,1')->name('login');

    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/me', [AuthController::class, 'me'])->name('me');
        Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
    });
});

Route::middleware('auth:sanctum')->group(function () {
    Route::prefix('requests')->name('requests.')->controller(ServiceRequestController::class)->group(function () {
        Route::get('/', 'index')->name('index');
        Route::post('/', 'store')->name('store');
        Route::get('/{serviceRequest}', 'show')->whereNumber('serviceRequest')->name('show');
        Route::patch('/{serviceRequest}/status', 'updateStatus')->whereNumber('serviceRequest')->name('status.update');
        Route::get('/{serviceRequest}/history', 'history')->whereNumber('serviceRequest')->name('history');
    });

    Route::get('/permissions', [UserController::class, 'permissions'])->name('permissions.index');
    Route::apiResource('users', UserController::class);
});
