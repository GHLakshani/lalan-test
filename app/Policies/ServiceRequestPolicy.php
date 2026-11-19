<?php

namespace App\Policies;

use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class ServiceRequestPolicy
{
    public function view(User $user, ServiceRequest $serviceRequest): Response
    {
        return $this->ownerOrAdmin($user, $serviceRequest);
    }

    public function updateStatus(User $user, ServiceRequest $serviceRequest): Response
    {
        return $this->ownerOrAdmin($user, $serviceRequest);
    }

    private function ownerOrAdmin(User $user, ServiceRequest $serviceRequest): Response
    {
        return $user->isAdmin() || $serviceRequest->user_id === $user->id
            ? Response::allow()
            : Response::deny('You do not have access to this service request.');
    }
}
