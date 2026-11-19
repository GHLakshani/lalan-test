@extends('layouts.app')

@section('title', 'Service request')
@section('page', 'service-requests.show')

@section('content')
    <div class="card card-medium" data-request-id="{{ $id }}" id="request-detail">
        <a href="{{ route('service-requests.index') }}" class="back-link">&larr; Back to service requests</a>

        <div id="request-loading" class="muted">Loading...</div>
        <div id="request-error" class="alert" role="alert" hidden></div>

        <div id="request-content" hidden>
            <div class="card-header">
                <h1 class="card-title" data-field="title"></h1>
                <div class="badges">
                    <span class="badge" data-badge="priority"></span>
                    <span class="badge" data-badge="status"></span>
                </div>
            </div>

            <p class="description" data-field="description"></p>

            <dl class="details">
                <div class="details-row">
                    <dt>Request ID</dt>
                    <dd data-field="id"></dd>
                </div>
                <div class="details-row">
                    <dt>Requested by</dt>
                    <dd data-field="requested_by"></dd>
                </div>
                <div class="details-row">
                    <dt>Created</dt>
                    <dd data-field="created_at"></dd>
                </div>
                <div class="details-row">
                    <dt>Last updated</dt>
                    <dd data-field="updated_at"></dd>
                </div>
            </dl>
        </div>
    </div>
@endsection

@push('scripts')
    <script src="{{ asset('js/service-requests.js') }}"></script>
@endpush
