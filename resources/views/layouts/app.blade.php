<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    @include('layouts.partials.head')
</head>
<body data-page="@yield('page')" data-auth="required">
    <header class="topbar">
        <div class="topbar-inner">
            <a href="{{ route('profile') }}" class="brand">{{ config('app.name') }}</a>
            <nav class="nav">
                <a href="{{ route('profile') }}" @class(['nav-link', 'active' => request()->routeIs('profile')])>Profile</a>
                <button type="button" class="btn btn-outline btn-sm" id="logout-button">Log out</button>
            </nav>
        </div>
    </header>

    <main class="container">
        @yield('content')
    </main>

    @include('layouts.partials.scripts')
</body>
</html>
