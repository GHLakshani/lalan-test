"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo } from "react";
import { PriorityBadge, StatusBadge } from "@/components/badge";
import { ArrowLeftIcon } from "@/components/icons";
import { RequestContext } from "@/components/request-context";
import { ButtonLink, Card, ErrorState, Skeleton } from "@/components/ui";
import { useApi } from "@/hooks/use-api";
import { useRemote } from "@/hooks/use-remote";
import { isStatus } from "@/lib/errors";
import type { ServiceRequest } from "@/lib/types";

function RequestHeader({ request }: { request: ServiceRequest | null }) {
  if (!request) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-2/3" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 text-sm font-medium text-slate-500">
        <span>Request #{request.id}</span>
        <span className="text-slate-300" aria-hidden="true">
          &middot;
        </span>
        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-slate-600">
          <span className="sr-only">Version </span>v{request.version}
        </span>
      </div>
      <h1 className="mt-1 wrap-break-word text-2xl font-semibold tracking-tight text-slate-900">{request.title}</h1>
      <div className="mt-3 flex flex-wrap gap-2">
        <PriorityBadge priority={request.priority} />
        <StatusBadge status={request.status} />
      </div>
    </div>
  );
}

function RequestTabs({ id, historyCount }: { id: string; historyCount: number | null }) {
  const pathname = usePathname();
  const base = `/service-requests/${id}`;

  const tabs = [
    { href: base, label: "Details" },
    { href: `${base}/status`, label: "Status" },
    { href: `${base}/history`, label: "History", count: historyCount },
  ];

  return (
    <nav aria-label="Request sections" className="-mx-4 mt-6 overflow-x-auto border-b border-slate-200 px-4 sm:mx-0 sm:px-0">
      <ul className="flex gap-6">
        {tabs.map((tab) => {
          const active = pathname === tab.href;

          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`-mb-px inline-flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium whitespace-nowrap ${
                  active
                    ? "border-indigo-600 text-indigo-700"
                    : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                }`}
              >
                {tab.label}
                {tab.count != null && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{tab.count}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function RequestShell({ children }: { children: React.ReactNode }) {
  const api = useApi();
  const { id } = useParams<{ id: string }>();

  const fetchRequest = useCallback(() => api.getServiceRequest(id), [api, id]);
  const { data, error, loading, replace, reload } = useRemote(api.ready ? id : null, fetchRequest);
  const request = loading ? null : data;

  useEffect(() => {
    if (request) {
      document.title = `${request.title} | Service Desk`;
    }
  }, [request]);

  const value = useMemo(() => ({ request, replace }), [request, replace]);

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/service-requests"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to service requests
      </Link>

      {error ? (
        isStatus(error, 404) ? (
          <Card className="px-6 py-14 text-center" role="alert">
            <p className="text-lg font-semibold text-slate-900">Service request not found</p>
            <p className="mt-1 text-sm text-slate-500">It may have been removed, or the link is incorrect.</p>
            <ButtonLink href="/service-requests" variant="secondary" className="mt-6">
              View all requests
            </ButtonLink>
          </Card>
        ) : (
          <ErrorState error={error} onRetry={reload} title="Unable to load this request" />
        )
      ) : (
        <>
          <RequestHeader request={request} />
          <RequestTabs id={id} historyCount={request?.status_history?.length ?? null} />
          <div className="mt-6">
            <RequestContext.Provider value={value}>{children}</RequestContext.Provider>
          </div>
        </>
      )}
    </div>
  );
}
