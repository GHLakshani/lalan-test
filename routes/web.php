<?php

use App\Enums\ServiceRequestPriority;
use App\Enums\ServiceRequestStatus;
use Illuminate\Support\Facades\Route;

Route::get('/', fn () => redirect()->route('login'));

Route::view('/login', 'auth.login')->name('login');
Route::view('/profile', 'profile')->name('profile');

Route::prefix('service-requests')->name('service-requests.')->group(function () {
    Route::view('/', 'service-requests.index', [
        'priorities' => ServiceRequestPriority::cases(),
        'statuses' => ServiceRequestStatus::cases(),
    ])->name('index');

    Route::view('/create', 'service-requests.create', [
        'priorities' => ServiceRequestPriority::cases(),
    ])->name('create');

    Route::get('/{id}', fn (int $id) => view('service-requests.show', ['id' => $id]))
        ->whereNumber('id')
        ->name('show');
});
