@extends('layouts.app')

@section('title', 'My profile')
@section('page', 'profile')

@section('content')
    <div class="card card-narrow">
        <div id="profile-loading" class="muted">Loading...</div>

        <div id="profile-content" hidden>
            <h1 class="card-title">My profile</h1>
            <p class="card-subtitle">Signed in as <span data-field="name"></span></p>

            <dl class="details">
                <div class="details-row">
                    <dt>ID</dt>
                    <dd data-field="id"></dd>
                </div>
                <div class="details-row">
                    <dt>Name</dt>
                    <dd data-field="name"></dd>
                </div>
                <div class="details-row">
                    <dt>Email</dt>
                    <dd data-field="email"></dd>
                </div>
                <div class="details-row">
                    <dt>Email verified</dt>
                    <dd data-field="email_verified_at"></dd>
                </div>
                <div class="details-row">
                    <dt>Member since</dt>
                    <dd data-field="created_at"></dd>
                </div>
            </dl>
        </div>
    </div>
@endsection

@push('scripts')
    <script src="{{ asset('js/auth.js') }}"></script>
@endpush
