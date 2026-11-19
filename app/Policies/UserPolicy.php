<?php

namespace App\Policies;

use App\Models\User;
use Illuminate\Auth\Access\Response;

class UserPolicy
{
    public function viewAny(User $actor): Response
    {
        return $this->adminOnly($actor);
    }

    public function view(User $actor, User $user): Response
    {
        return $this->adminOnly($actor);
    }

    public function create(User $actor): Response
    {
        return $this->adminOnly($actor);
    }

    public function update(User $actor, User $user): Response
    {
        return $this->adminOnly($actor);
    }

    public function delete(User $actor, User $user): Response
    {
        $admin = $this->adminOnly($actor);

        if ($admin->denied()) {
            return $admin;
        }

        return $actor->is($user)
            ? Response::deny('You cannot delete your own account.')
            : Response::allow();
    }

    private function adminOnly(User $actor): Response
    {
        return $actor->isAdmin()
            ? Response::allow()
            : Response::deny('Only administrators can manage users.');
    }
}
