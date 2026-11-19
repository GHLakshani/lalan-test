"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { PencilIcon, PlusIcon, SearchIcon, TrashIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { RoleBadge } from "@/components/role-badge";
import { AccessDenied, Alert, Button, ButtonLink, Card, ErrorState, Skeleton, inputClass } from "@/components/ui";
import { useAuth } from "@/context/auth-context";
import { useApi } from "@/hooks/use-api";
import { useRemote } from "@/hooks/use-remote";
import { errorMessage } from "@/lib/errors";
import { formatDate, initials } from "@/lib/format";
import { PERMISSION_LABELS } from "@/lib/permissions";
import type { Role, User } from "@/lib/types";

const SEARCH_DELAY = 350;

export function UserList() {
  const api = useApi();
  const { user: currentUser } = useAuth();
  const params = useSearchParams();
  const notice = params.get("saved") ?? params.get("deleted");
  const noticeText = params.get("saved")
    ? `${notice} was saved successfully.`
    : params.get("deleted")
      ? `${notice} was deleted.`
      : null;

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [role, setRole] = useState<Role | "">("");
  const [page, setPage] = useState(1);
  const [pendingDelete, setPendingDelete] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deletedName, setDeletedName] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    const current = timer;
    return () => clearTimeout(current.current);
  }, []);

  const filters = useMemo(() => ({ search, role, page }), [search, role, page]);
  const isAdmin = Boolean(currentUser?.is_admin);
  const fetchUsers = useCallback(() => api.listUsers(filters), [api, filters]);
  const { data, error, loading, reload } = useRemote(
    api.ready && isAdmin ? JSON.stringify(filters) : null,
    fetchUsers,
  );

  if (currentUser && !isAdmin) {
    return <AccessDenied message="Only administrators can manage users." />;
  }

  function handleSearch(value: string) {
    setSearchInput(value);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setSearch(value.trim());
      setPage(1);
    }, SEARCH_DELAY);
  }

  async function confirmDelete() {
    if (!pendingDelete) {
      return;
    }

    setDeleting(true);
    setDeleteError(null);

    try {
      await api.deleteUser(pendingDelete.id);
      setDeletedName(pendingDelete.name);
      setPendingDelete(null);
      reload();
    } catch (deleteFailure) {
      setDeleteError(errorMessage(deleteFailure));
    } finally {
      setDeleting(false);
    }
  }

  const hasFilters = search !== "" || role !== "";

  return (
    <>
      <PageHeader
        title="Users"
        description="Create accounts, assign roles and control what each member can do."
        actions={
          <ButtonLink href="/users/new">
            <PlusIcon className="h-4 w-4" />
            Add user
          </ButtonLink>
        }
      />

      {(deletedName || noticeText) && (
        <div className="mb-4">
          <Alert tone="success">{deletedName ? `${deletedName} was deleted.` : noticeText}</Alert>
        </div>
      )}

      <Card className="mb-4 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div>
            <label htmlFor="user-search" className="mb-1.5 block text-xs font-medium text-slate-600">
              Search by name or email
            </label>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="user-search"
                type="search"
                value={searchInput}
                onChange={(event) => handleSearch(event.target.value)}
                placeholder="e.g. demo"
                className={`${inputClass} pl-9`}
              />
            </div>
          </div>
          <div>
            <label htmlFor="user-role" className="mb-1.5 block text-xs font-medium text-slate-600">
              Role
            </label>
            <select
              id="user-role"
              value={role}
              onChange={(event) => {
                setRole(event.target.value as Role | "");
                setPage(1);
              }}
              className={inputClass}
            >
              <option value="">All roles</option>
              <option value="admin">Administrators</option>
              <option value="member">Members</option>
            </select>
          </div>
        </div>
      </Card>

      {error ? (
        <ErrorState error={error} onRetry={reload} title="Unable to load users" />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm" aria-busy={loading}>
              <caption className="sr-only">Users</caption>
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th scope="col" className="px-4 py-3">User</th>
                  <th scope="col" className="px-4 py-3">Role</th>
                  <th scope="col" className="px-4 py-3">Permissions</th>
                  <th scope="col" className="px-4 py-3 text-right">Requests</th>
                  <th scope="col" className="px-4 py-3">Created</th>
                  <th scope="col" className="px-4 py-3 text-right">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className={`divide-y divide-slate-100 bg-white ${loading && data ? "opacity-50" : ""}`}>
                {!data &&
                  Array.from({ length: 4 }, (_, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3.5"><Skeleton className="h-9 w-48" /></td>
                      <td className="px-4 py-3.5"><Skeleton className="h-5 w-20 rounded-full" /></td>
                      <td className="px-4 py-3.5"><Skeleton className="h-5 w-56" /></td>
                      <td className="px-4 py-3.5"><Skeleton className="ml-auto h-4 w-8" /></td>
                      <td className="px-4 py-3.5"><Skeleton className="h-4 w-20" /></td>
                      <td className="px-4 py-3.5"><Skeleton className="ml-auto h-8 w-20" /></td>
                    </tr>
                  ))}

                {data && data.data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-14 text-center">
                      <p className="font-medium text-slate-900">No users found</p>
                      <p className="mt-1 text-slate-500">
                        {hasFilters ? "Try a different search or role." : "Add the first user to get started."}
                      </p>
                      {hasFilters && (
                        <Button
                          variant="secondary"
                          className="mt-4"
                          onClick={() => {
                            clearTimeout(timer.current);
                            setSearchInput("");
                            setSearch("");
                            setRole("");
                            setPage(1);
                          }}
                        >
                          Clear filters
                        </Button>
                      )}
                    </td>
                  </tr>
                )}

                {data?.data.map((item) => {
                  const self = item.id === currentUser?.id;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3">
                          <span
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700"
                            aria-hidden="true"
                          >
                            {initials(item.name)}
                          </span>
                          <div className="min-w-0">
                            <p className="flex items-center gap-2 font-medium text-slate-900">
                              <span className="truncate">{item.name}</span>
                              {self && (
                                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="truncate text-xs text-slate-500">{item.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <RoleBadge role={item.role} />
                      </td>
                      <td className="px-4 py-3.5">
                        {item.is_admin ? (
                          <span className="text-slate-500">All permissions</span>
                        ) : item.permissions.length === 0 ? (
                          <span className="text-slate-400">No permissions</span>
                        ) : (
                          <ul className="flex flex-wrap gap-1.5">
                            {item.permissions.map((permission) => (
                              <li
                                key={permission}
                                className="whitespace-nowrap rounded-md bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                              >
                                {PERMISSION_LABELS[permission]}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-right text-slate-700">
                        {item.service_requests_count ?? 0}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">{formatDate(item.created_at)}</td>
                      <td className="whitespace-nowrap px-4 py-3.5">
                        <div className="flex justify-end gap-1">
                          <Link
                            href={`/users/${item.id}`}
                            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                          >
                            <PencilIcon className="h-4 w-4" />
                            Edit<span className="sr-only"> {item.name}</span>
                          </Link>
                          <button
                            type="button"
                            disabled={self}
                            title={self ? "You cannot delete your own account" : undefined}
                            onClick={() => {
                              setDeleteError(null);
                              setPendingDelete(item);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:text-slate-300 disabled:hover:bg-transparent"
                          >
                            <TrashIcon className="h-4 w-4" />
                            Delete<span className="sr-only"> {item.name}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {data && <Pagination meta={data.meta} noun="users" disabled={loading} onPageChange={setPage} />}
        </Card>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete user?"
        confirmLabel="Delete user"
        busy={deleting}
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      >
        <p>
          <span className="font-medium text-slate-900">{pendingDelete?.name}</span> will be signed out and will no longer be
          able to log in. Their service requests and status history are kept.
        </p>
      </ConfirmDialog>
    </>
  );
}
