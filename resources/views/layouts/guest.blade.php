<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    @include('layouts.partials.head')
</head>
<body data-page="@yield('page')">
    <main class="container container-center">
        @yield('content')
    </main>

    @include('layouts.partials.scripts')
</body>
</html>
