@extends('layouts.app')

@section('title', 'New service request')
@section('page', 'service-requests.create')

@section('content')
    <div class="card card-medium">
        <a href="{{ route('service-requests.index') }}" class="back-link">&larr; Back to service requests</a>
        <h1 class="card-title">New service request</h1>
        <p class="card-subtitle">Describe the issue and choose how urgent it is.</p>

        <form id="request-form" class="form" novalidate>
            <div class="field">
                <label for="title">Title</label>
                <input id="title" name="title" type="text" maxlength="255" required>
                <p class="field-error" data-error-for="title"></p>
            </div>

            <div class="field">
                <label for="description">Description</label>
                <textarea id="description" name="description" rows="6" maxlength="5000" required></textarea>
                <p class="field-error" data-error-for="description"></p>
            </div>

            <div class="field">
                <label for="priority">Priority</label>
                <select id="priority" name="priority" required>
                    <option value="">Select priority</option>
                    @foreach ($priorities as $priority)
                        <option value="{{ $priority->value }}">{{ $priority->label() }}</option>
                    @endforeach
                </select>
                <p class="field-error" data-error-for="priority"></p>
            </div>

            <div id="form-alert" class="alert" role="alert" hidden></div>

            <div class="form-actions">
                <a href="{{ route('service-requests.index') }}" class="btn btn-outline">Cancel</a>
                <button type="submit" class="btn btn-primary btn-inline" id="submit-button">Create request</button>
            </div>
        </form>
    </div>
@endsection

@push('scripts')
    <script src="{{ asset('js/service-requests.js') }}"></script>
@endpush
