<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Enums\Permission;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Casts\AsEnumCollection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['name', 'email', 'password'])]
#[Hidden(['password', 'remember_token'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, SoftDeletes;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_admin' => 'boolean',
            'permissions' => AsEnumCollection::of(Permission::class),
        ];
    }

    public function serviceRequests(): HasMany
    {
        return $this->hasMany(ServiceRequest::class);
    }

    public function isAdmin(): bool
    {
        return (bool) $this->is_admin;
    }

    public function hasPermission(Permission $permission): bool
    {
        return $this->isAdmin() || ($this->permissions?->contains($permission) ?? false);
    }

    public function effectivePermissions(): array
    {
        $permissions = $this->isAdmin() ? Permission::cases() : ($this->permissions?->all() ?? []);

        return Permission::values(
            array_values(array_filter(Permission::cases(), fn (Permission $permission) => in_array($permission, $permissions, true)))
        );
    }

    public function assignRole(bool $isAdmin, array $permissions = []): static
    {
        $values = array_map(
            fn (Permission|string $permission) => $permission instanceof Permission ? $permission->value : $permission,
            $permissions,
        );

        return $this->forceFill([
            'is_admin' => $isAdmin,
            'permissions' => $isAdmin ? [] : array_values(array_unique($values)),
        ]);
    }
}
