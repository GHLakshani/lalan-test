"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PriorityBadge, StatusBadge } from "@/components/badge";
import { PlusIcon, SearchIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { Pagination } from "@/components/pagination";
import { Button, ButtonLink, Card, ErrorState, Skeleton, inputClass } from "@/components/ui";
import { useApi } from "@/hooks/use-api";
import { useRemote } from "@/hooks/use-remote";
import { formatDate } from "@/lib/format";
import { PAGE_SIZES, PRIORITIES, STATUSES } from "@/lib/types";
import type { Priority, ServiceRequestFilters, Status } from "@/lib/types";

const SEARCH_DELAY = 350;

function parseFilters(params: URLSearchParams): Required<ServiceRequestFilters> {
  const priority = params.get("priority") ?? "";
  const status = params.get("status") ?? "";
  const perPage = Number(params.get("per_page"));
  const page = Number(params.get("page"));

  return {
    search: params.get("search") ?? "",
    priority: PRIORITIES.some((option) => option.value === priority) ? (priority as Priority) : "",
    status: STATUSES.some((option) => option.value === status) ? (status as Status) : "",
    per_page: PAGE_SIZES.includes(perPage) ? perPage : PAGE_SIZES[0],
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}

export function ServiceRequestList() {
  const api = useApi();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = useMemo(() => parseFilters(new URLSearchParams(searchParams.toString())), [searchParams]);

  const [searchInput, setSearchInput] = useState(filters.search);
  const [syncedSearch, setSyncedSearch] = useState(filters.search);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  if (filters.search !== syncedSearch) {
    setSyncedSearch(filters.search);
    setSearchInput(filters.search);
  }

  useEffect(() => {
    const timer = searchTimer;
    return () => clearTimeout(timer.current);
  }, []);

  const updateFilters = useCallback(
    (changes: Partial<Record<keyof ServiceRequestFilters, string | number>>) => {
      const next = new URLSearchParams(searchParams.toString());

      Object.entries(changes).forEach(([key, value]) => {
        if (value === undefined || String(value).trim() === "") {
          next.delete(key);
        } else {
          next.set(key, String(value));
        }
      });

      if (!("page" in changes)) {
        next.delete("page");
      }

      if (next.get("page") === "1") {
        next.delete("page");
      }

      if (next.get("per_page") === String(PAGE_SIZES[0])) {
        next.delete("per_page");
      }

      const query = next.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  function handleSearchChange(value: string) {
    setSearchInput(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => updateFilters({ search: value }), SEARCH_DELAY);
  }

  function resetFilters() {
    clearTimeout(searchTimer.current);
    setSearchInput("");
    router.replace(pathname, { scroll: false });
  }

  const fetchPage = useCallback(() => api.listServiceRequests(filters), [api, filters]);
  const { data, error, loading, reload } = useRemote(api.ready ? JSON.stringify(filters) : null, fetchPage);

  const hasFilters = filters.search !== "" || filters.priority !== "" || filters.status !== "";
  const pageOutOfRange = data !== null && !loading && data.data.length === 0 && data.meta.total > 0;

  return (
    <>
      <PageHeader
        title="Service Requests"
        description="Search, filter and browse all service requests."
        actions={
          <ButtonLink href="/service-requests/new">
            <PlusIcon className="h-4 w-4" />
            New request
          </ButtonLink>
        }
      />

      <Card className="mb-4 p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))_auto]">
          <div className="sm:col-span-2 lg:col-span-1">
            <label htmlFor="search" className="mb-1.5 block text-xs font-medium text-slate-600">
              Search by title
            </label>
            <div className="relative">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                id="search"
                type="search"
                placeholder="e.g. printer"
                value={searchInput}
                onChange={(event) => handleSearchChange(event.target.value)}
                className={`${inputClass} pl-9`}
              />
            </div>
          </div>

          <div>
            <label htmlFor="priority" className="mb-1.5 block text-xs font-medium text-slate-600">
              Priority
            </label>
            <select
              id="priority"
              value={filters.priority}
              onChange={(event) => updateFilters({ priority: event.target.value })}
              className={inputClass}
            >
              <option value="">All priorities</option>
              {PRIORITIES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="status" className="mb-1.5 block text-xs font-medium text-slate-600">
              Status
            </label>
            <select
              id="status"
              value={filters.status}
              onChange={(event) => updateFilters({ status: event.target.value })}
              className={inputClass}
            >
              <option value="">All statuses</option>
              {STATUSES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="per_page" className="mb-1.5 block text-xs font-medium text-slate-600">
              Per page
            </label>
            <select
              id="per_page"
              value={filters.per_page}
              onChange={(event) => updateFilters({ per_page: event.target.value })}
              className={inputClass}
            >
              {PAGE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-end">
            <Button type="button" variant="secondary" className="w-full" onClick={resetFilters} disabled={!hasFilters && searchInput === ""}>
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {error ? (
        <ErrorState error={error} onRetry={reload} title="Unable to load service requests" />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm" aria-busy={loading}>
              <caption className="sr-only">Service requests</caption>
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  <th scope="col" className="px-4 py-3">#</th>
                  <th scope="col" className="px-4 py-3">Title</th>
                  <th scope="col" className="px-4 py-3">Priority</th>
                  <th scope="col" className="px-4 py-3">Status</th>
                  <th scope="col" className="px-4 py-3">Requested by</th>
                  <th scope="col" className="px-4 py-3">Created</th>
                </tr>
              </thead>
              <tbody className={`divide-y divide-slate-100 bg-white transition-opacity ${loading && data ? "opacity-50" : ""}`}>
                {!data &&
                  Array.from({ length: filters.per_page > 10 ? 10 : filters.per_page }, (_, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3.5"><Skeleton className="h-4 w-8" /></td>
                      <td className="px-4 py-3.5"><Skeleton className="h-4 w-64" /></td>
                      <td className="px-4 py-3.5"><Skeleton className="h-5 w-16 rounded-full" /></td>
                      <td className="px-4 py-3.5"><Skeleton className="h-5 w-20 rounded-full" /></td>
                      <td className="px-4 py-3.5"><Skeleton className="h-4 w-24" /></td>
                      <td className="px-4 py-3.5"><Skeleton className="h-4 w-20" /></td>
                    </tr>
                  ))}

                {data && data.data.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-14 text-center">
                      <p className="font-medium text-slate-900">
                        {pageOutOfRange ? "This page is empty" : "No service requests found"}
                      </p>
                      <p className="mt-1 text-slate-500">
                        {pageOutOfRange
                          ? "Go back to the first page to see results."
                          : hasFilters
                            ? "Try a different search or clear the filters."
                            : "Create a request to get started."}
                      </p>
                      <div className="mt-4">
                        {pageOutOfRange ? (
                          <Button variant="secondary" onClick={() => updateFilters({ page: 1 })}>
                            First page
                          </Button>
                        ) : hasFilters ? (
                          <Button variant="secondary" onClick={resetFilters}>
                            Clear filters
                          </Button>
                        ) : (
                          <ButtonLink href="/service-requests/new">New request</ButtonLink>
                        )}
                      </div>
                    </td>
                  </tr>
                )}

                {data?.data.map((item) => (
                  <tr key={item.id} className="group relative hover:bg-slate-50">
                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">#{item.id}</td>
                    <td className="max-w-md px-4 py-3.5">
                      <Link
                        href={`/service-requests/${item.id}`}
                        className="block truncate font-medium text-slate-900 after:absolute after:inset-0 group-hover:text-indigo-600"
                      >
                        {item.title}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <PriorityBadge priority={item.priority} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-600">{item.requested_by?.name ?? "-"}</td>
                    <td className="whitespace-nowrap px-4 py-3.5 text-slate-500">{formatDate(item.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data && <Pagination meta={data.meta} disabled={loading} onPageChange={(page) => updateFilters({ page })} />}
        </Card>
      )}
    </>
  );
}
