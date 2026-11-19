<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ServiceRequest\IndexServiceRequestRequest;
use App\Http\Requests\ServiceRequest\StoreServiceRequestRequest;
use App\Http\Resources\ServiceRequestResource;
use App\Models\ServiceRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ServiceRequestController extends Controller
{
    public function index(IndexServiceRequestRequest $request): AnonymousResourceCollection
    {
        $serviceRequests = ServiceRequest::query()
            ->with('user')
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

        return ServiceRequestResource::make($serviceRequest->refresh()->load('user'))
            ->response()
            ->setStatusCode(201);
    }

    public function show(ServiceRequest $serviceRequest): ServiceRequestResource
    {
        return ServiceRequestResource::make($serviceRequest->load('user'));
    }
}
