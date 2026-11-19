@extends('layouts.app')

@section('title', 'Service requests')
@section('page', 'service-requests.index')

@section('content')
    <div class="page-header">
        <div>
            <h1 class="page-title">Service requests</h1>
            <p class="muted">Search, filter and browse all service requests.</p>
        </div>
        <a href="{{ route('service-requests.create') }}" class="btn btn-primary btn-inline">New request</a>
    </div>

    <form id="filters" class="filters" role="search">
        <div class="field">
            <label for="search">Search by title</label>
            <input id="search" name="search" type="search" placeholder="e.g. printer">
        </div>

        <div class="field">
            <label for="priority">Priority</label>
            <select id="priority" name="priority">
                <option value="">All priorities</option>
                @foreach ($priorities as $priority)
                    <option value="{{ $priority->value }}">{{ $priority->label() }}</option>
                @endforeach
            </select>
        </div>

        <div class="field">
            <label for="status">Status</label>
            <select id="status" name="status">
                <option value="">All statuses</option>
                @foreach ($statuses as $status)
                    <option value="{{ $status->value }}">{{ $status->label() }}</option>
                @endforeach
            </select>
        </div>

        <div class="field">
            <label for="per_page">Per page</label>
            <select id="per_page" name="per_page">
                @foreach ([10, 25, 50] as $size)
                    <option value="{{ $size }}">{{ $size }}</option>
                @endforeach
            </select>
        </div>

        <div class="filters-actions">
            <button type="button" class="btn btn-outline" id="reset-filters">Reset</button>
        </div>
    </form>

    <div class="card card-flush">
        <div class="table-wrap">
            <table class="table">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Title</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Requested by</th>
                        <th>Created</th>
                    </tr>
                </thead>
                <tbody id="requests-body">
                    <tr>
                        <td colspan="6" class="table-empty">Loading...</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="pagination">
            <p class="muted" id="pagination-summary"></p>
            <div class="pagination-controls">
                <button type="button" class="btn btn-outline btn-sm" id="prev-page" disabled>Previous</button>
                <span class="pagination-page" id="pagination-page"></span>
                <button type="button" class="btn btn-outline btn-sm" id="next-page" disabled>Next</button>
            </div>
        </div>
    </div>
@endsection

@push('scripts')
    <script src="{{ asset('js/service-requests.js') }}"></script>
@endpush
