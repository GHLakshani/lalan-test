<?php

namespace App\Http\Controllers\Api;

use App\Actions\ChangeServiceRequestStatus;
use App\Enums\ServiceRequestStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\ServiceRequest\IndexServiceRequestRequest;
use App\Http\Requests\ServiceRequest\StoreServiceRequestRequest;
use App\Http\Requests\ServiceRequest\UpdateServiceRequestStatusRequest;
use App\Http\Resources\ServiceRequestResource;
use App\Models\ServiceRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Gate;

class ServiceRequestController extends Controller
{
    public function index(IndexServiceRequestRequest $request): AnonymousResourceCollection
    {
        $serviceRequests = ServiceRequest::query()
            ->with('user')
            ->visibleTo($request->user())
            ->search($request->validated('search'))
            ->priority($request->validated('priority'))
            ->status($request->validated('status'))
            ->latest()
            ->latest('id')
            ->paginate($request->integer('per_page', 10))
            ->withQueryString();

        return ServiceRequestResource::collection($serviceRequests);
    }

    public function store(StoreServiceRequestRequest $request): JsonResponse
    {
        $serviceRequest = $request->user()
            ->serviceRequests()
            ->create($request->validated());

        return ServiceRequestResource::make($serviceRequest->refresh()->load(['user', 'statusHistories.changedBy']))
            ->response()
            ->setStatusCode(201);
    }

    public function show(ServiceRequest $serviceRequest): ServiceRequestResource
    {
        Gate::authorize('view', $serviceRequest);

        return ServiceRequestResource::make($serviceRequest->load(['user', 'statusHistories.changedBy']));
    }

    public function updateStatus(
        UpdateServiceRequestStatusRequest $request,
        ServiceRequest $serviceRequest,
        ChangeServiceRequestStatus $changeStatus,
    ): ServiceRequestResource {
        Gate::authorize('updateStatus', $serviceRequest);

        $updated = $changeStatus->handle(
            $serviceRequest,
            ServiceRequestStatus::from($request->validated('status')),
            (int) $request->validated('version'),
            $request->user(),
            $request->validated('remark'),
        );

        return ServiceRequestResource::make($updated->load(['user', 'statusHistories.changedBy']));
    }
}
