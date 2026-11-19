"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ArrowLeftIcon, TrashIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { RoleBadge } from "@/components/role-badge";
import { AccessDenied, Button, ButtonLink, Card, ErrorState, Skeleton } from "@/components/ui";
import { UserForm } from "@/components/user-form";
import { useAuth } from "@/context/auth-context";
import { useApi } from "@/hooks/use-api";
import { useRemote } from "@/hooks/use-remote";
import { errorMessage, isStatus } from "@/lib/errors";
import type { UserInput } from "@/lib/types";

export function EditUser() {
  const api = useApi();
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user: currentUser } = useAuth();
  const isAdmin = Boolean(currentUser?.is_admin);

  const fetchUser = useCallback(() => api.getUser(id), [api, id]);
  const { data, error, loading, reload } = useRemote(api.ready && isAdmin ? id : null, fetchUser);
  const user = loading ? null : data;

  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (currentUser && !isAdmin) {
    return <AccessDenied message="Only administrators can manage users." />;
  }

  const isSelf = user !== null && user.id === currentUser?.id;

  async function handleSubmit(input: UserInput) {
    const updated = await api.updateUser(id, input);
    router.push(`/users?saved=${encodeURIComponent(updated.name)}`);
  }

  async function handleDelete() {
    if (!user) {
      return;
    }

    setDeleting(true);
    setDeleteError(null);

    try {
      await api.deleteUser(user.id);
      router.push(`/users?deleted=${encodeURIComponent(user.name)}`);
    } catch (failure) {
      setDeleteError(errorMessage(failure));
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/users"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to users
      </Link>

      {error ? (
        isStatus(error, 404) ? (
          <Card className="px-6 py-14 text-center" role="alert">
            <p className="text-lg font-semibold text-slate-900">User not found</p>
            <p className="mt-1 text-sm text-slate-500">The user may have been deleted.</p>
            <ButtonLink href="/users" variant="secondary" className="mt-6">
              View all users
            </ButtonLink>
          </Card>
        ) : (
          <ErrorState error={error} onRetry={reload} title="Unable to load this user" />
        )
      ) : !user ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-96 w-full" />
        </div>
      ) : (
        <>
          <PageHeader
            title={`Edit ${user.name}`}
            description={
              <span className="inline-flex flex-wrap items-center gap-2">
                <RoleBadge role={user.role} />
                <span>
                  {user.service_requests_count ?? 0} service{" "}
                  {(user.service_requests_count ?? 0) === 1 ? "request" : "requests"}
                </span>
              </span>
            }
          />

          <UserForm key={user.id} user={user} isSelf={isSelf} submitLabel="Save changes" onSubmit={handleSubmit} />

          {!isSelf && (
            <Card className="mt-6 border-rose-200 p-6">
              <h2 className="text-base font-semibold text-slate-900">Delete user</h2>
              <p className="mt-1 text-sm text-slate-500">
                The user is signed out immediately and can no longer log in. Their service requests and status history are
                kept for auditing.
              </p>
              <Button
                type="button"
                variant="danger"
                className="mt-4"
                onClick={() => {
                  setDeleteError(null);
                  setConfirming(true);
                }}
              >
                <TrashIcon className="h-4 w-4" />
                Delete user
              </Button>
            </Card>
          )}

          <ConfirmDialog
            open={confirming}
            title="Delete user?"
            confirmLabel="Delete user"
            busy={deleting}
            error={deleteError}
            onConfirm={handleDelete}
            onCancel={() => setConfirming(false)}
          >
            <p>
              <span className="font-medium text-slate-900">{user.name}</span> will be signed out and will no longer be able to
              log in. Their service requests and status history are kept.
            </p>
          </ConfirmDialog>
        </>
      )}
    </div>
  );
}
