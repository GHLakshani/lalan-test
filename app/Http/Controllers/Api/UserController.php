<?php

namespace App\Http\Controllers\Api;

use App\Enums\Permission;
use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserRequest;
use App\Http\Requests\User\UpdateUserRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        Gate::authorize('viewAny', User::class);

        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'role' => ['nullable', Rule::in(['admin', 'member'])],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
            'page' => ['nullable', 'integer', 'min:1'],
        ]);

        $users = User::query()
            ->withCount('serviceRequests')
            ->when($filters['search'] ?? null, function ($query, string $search) {
                $term = '%'.trim($search).'%';
                $query->where(fn ($inner) => $inner->where('name', 'like', $term)->orWhere('email', 'like', $term));
            })
            ->when($filters['role'] ?? null, fn ($query, string $role) => $query->where('is_admin', $role === 'admin'))
            ->orderBy('name')
            ->orderBy('id')
            ->paginate($request->integer('per_page', 10))
            ->withQueryString();

        return UserResource::collection($users);
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        Gate::authorize('create', User::class);

        $user = new User($request->safe()->only(['name', 'email', 'password']));
        $user->assignRole($request->validated('role') === 'admin', $request->validated('permissions') ?? []);
        $user->email_verified_at = now();
        $user->save();

        return UserResource::make($user->loadCount('serviceRequests'))
            ->response()
            ->setStatusCode(201);
    }

    public function show(User $user): UserResource
    {
        Gate::authorize('view', $user);

        return UserResource::make($user->loadCount('serviceRequests'));
    }

    public function update(UpdateUserRequest $request, User $user): UserResource
    {
        Gate::authorize('update', $user);

        $user->fill($request->safe()->only(['name', 'email']));

        if ($request->filled('password')) {
            $user->password = $request->validated('password');
        }

        $user->assignRole($request->validated('role') === 'admin', $request->validated('permissions') ?? []);
        $user->save();

        return UserResource::make($user->loadCount('serviceRequests'));
    }

    public function destroy(User $user): Response
    {
        Gate::authorize('delete', $user);

        DB::transaction(function () use ($user) {
            $user->tokens()->delete();
            $user->delete();
        });

        return response()->noContent();
    }

    public function permissions(): JsonResponse
    {
        return response()->json([
            'data' => array_map(fn (Permission $permission) => [
                'value' => $permission->value,
                'label' => $permission->label(),
                'description' => $permission->description(),
                'default' => in_array($permission, Permission::defaults(), true),
            ], Permission::cases()),
        ]);
    }
}
