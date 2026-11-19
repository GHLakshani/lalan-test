<?php

namespace App\Policies;

use App\Enums\Permission;
use App\Models\ServiceRequest;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class ServiceRequestPolicy
{
    public function view(User $user, ServiceRequest $serviceRequest): Response
    {
        return $user->hasPermission(Permission::ViewAllRequests) || $serviceRequest->user_id === $user->id
            ? Response::allow()
            : Response::deny('You do not have access to this service request.');
    }

    public function create(User $user): Response
    {
        return $user->hasPermission(Permission::CreateRequests)
            ? Response::allow()
            : Response::deny('You do not have permission to create service requests.');
    }

    public function updateStatus(User $user, ServiceRequest $serviceRequest): Response
    {
        $view = $this->view($user, $serviceRequest);

        if ($view->denied()) {
            return $view;
        }

        return $user->hasPermission(Permission::ChangeRequestStatus)
            ? Response::allow()
            : Response::deny('You do not have permission to change the status of service requests.');
    }
}
