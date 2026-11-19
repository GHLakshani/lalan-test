@extends('layouts.guest')

@section('title', 'Sign in')
@section('page', 'login')

@section('content')
    <div class="card">
        <h1 class="card-title">Sign in</h1>
        <p class="card-subtitle">Use your email and password to continue.</p>

        <form id="login-form" class="form" novalidate>
            <div class="field">
                <label for="email">Email</label>
                <input id="email" name="email" type="email" autocomplete="email" required>
                <p class="field-error" data-error-for="email"></p>
            </div>

            <div class="field">
                <label for="password">Password</label>
                <input id="password" name="password" type="password" autocomplete="current-password" required>
                <p class="field-error" data-error-for="password"></p>
            </div>

            <div id="form-alert" class="alert" role="alert" hidden></div>

            <button type="submit" class="btn btn-primary" id="login-button">Sign in</button>
        </form>

        <div class="demo">
            <p class="demo-title">Demo accounts</p>
            <div class="demo-grid">
                <button type="button" class="demo-account" data-email="admin@example.com">
                    <strong>Demo Admin</strong>
                    <span>admin@example.com</span>
                </button>
                <button type="button" class="demo-account" data-email="user@example.com">
                    <strong>Demo User</strong>
                    <span>user@example.com</span>
                </button>
            </div>
        </div>
    </div>
@endsection

@push('scripts')
    <script src="{{ asset('js/auth.js') }}"></script>
@endpush
