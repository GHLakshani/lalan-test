"use client";

import Link from "next/link";
import { useCallback } from "react";
import { PriorityBadge, StatusBadge, dotClass } from "@/components/badge";
import {
  CheckCircleIcon,
  ClockIcon,
  InboxIcon,
  LayersIcon,
  PlusIcon,
} from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { ButtonLink, Card, ErrorState, Skeleton } from "@/components/ui";
import { useAuth } from "@/context/auth-context";
import { useApi } from "@/hooks/use-api";
import { PERMISSIONS, can } from "@/lib/permissions";
import { useRemote } from "@/hooks/use-remote";
import { formatDate } from "@/lib/format";
import { PRIORITIES, STATUSES } from "@/lib/types";
import type { Priority, ServiceRequest, Status } from "@/lib/types";

type Summary = {
  total: number;
  recent: ServiceRequest[];
  byStatus: Record<Status, number>;
  byPriority: Record<Priority, number>;
};

const statCards: { status: Status; label: string; icon: typeof InboxIcon; tone: string }[] = [
  { status: "open", label: "Open", icon: InboxIcon, tone: "bg-blue-50 text-blue-600" },
  { status: "in_progress", label: "In Progress", icon: ClockIcon, tone: "bg-violet-50 text-violet-600" },
  { status: "resolved", label: "Resolved", icon: CheckCircleIcon, tone: "bg-emerald-50 text-emerald-600" },
];

function greeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  return hour < 18 ? "Good afternoon" : "Good evening";
}

function StatCard({
  href,
  label,
  value,
  icon: Icon,
  tone,
}: {
  href: string;
  label: string;
  value: number | null;
  icon: typeof InboxIcon;
  tone: string;
}) {
  return (
    <Link href={href} className="group">
      <Card className="flex items-center gap-4 p-4 transition group-hover:border-indigo-200 group-hover:shadow-md sm:p-5">
        <span className={`hidden h-11 w-11 shrink-0 items-center justify-center rounded-lg sm:flex ${tone}`} aria-hidden="true">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm text-slate-500">{label}</p>
          {value === null ? (
            <Skeleton className="mt-1 h-7 w-12" />
          ) : (
            <p className="text-2xl font-semibold text-slate-900">{value}</p>
          )}
        </div>
      </Card>
    </Link>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const api = useApi();

  const fetchSummary = useCallback(async (): Promise<Summary> => {
    const [recent, statusPages, priorityPages] = await Promise.all([
      api.listServiceRequests({ per_page: 5 }),
      Promise.all(STATUSES.map((status) => api.listServiceRequests({ status: status.value, per_page: 1 }))),
      Promise.all(PRIORITIES.map((priority) => api.listServiceRequests({ priority: priority.value, per_page: 1 }))),
    ]);

    return {
      total: recent.meta.total,
      recent: recent.data,
      byStatus: Object.fromEntries(STATUSES.map((status, index) => [status.value, statusPages[index].meta.total])) as Record<Status, number>,
      byPriority: Object.fromEntries(
        PRIORITIES.map((priority, index) => [priority.value, priorityPages[index].meta.total]),
      ) as Record<Priority, number>,
    };
  }, [api]);

  const { data, error, loading, reload } = useRemote(api.ready ? "dashboard" : null, fetchSummary);
  const summary = loading ? null : data;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={
          user
            ? `${greeting()}, ${user.name}. Here is an overview of your service desk.`
            : "Here is an overview of your service desk."
        }
        actions={
          can(user, PERMISSIONS.createRequests) ? (
            <ButtonLink href="/service-requests/new">
              <PlusIcon className="h-4 w-4" />
              New request
            </ButtonLink>
          ) : undefined
        }
      />

      {error ? (
        <ErrorState error={error} onRetry={reload} title="Unable to load the dashboard" />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            <StatCard
              href="/service-requests"
              label="Total requests"
              value={summary?.total ?? null}
              icon={LayersIcon}
              tone="bg-indigo-50 text-indigo-600"
            />
            {statCards.map((card) => (
              <StatCard
                key={card.status}
                href={`/service-requests?status=${card.status}`}
                label={card.label}
                value={summary ? summary.byStatus[card.status] : null}
                icon={card.icon}
                tone={card.tone}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                <h2 className="font-semibold text-slate-900">Recent requests</h2>
                <Link href="/service-requests" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                  View all
                </Link>
              </div>

              <ul className="divide-y divide-slate-100">
                {!summary &&
                  Array.from({ length: 5 }, (_, index) => (
                    <li key={index} className="flex items-center gap-4 px-5 py-4">
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-3 w-1/3" />
                      </div>
                      <Skeleton className="h-5 w-16 rounded-full" />
                    </li>
                  ))}

                {summary?.recent.length === 0 && (
                  <li className="px-5 py-10 text-center text-sm text-slate-500">
                    No service requests yet.{" "}
                    <Link href="/service-requests/new" className="font-medium text-indigo-600 hover:text-indigo-500">
                      Create the first one
                    </Link>
                  </li>
                )}

                {summary?.recent.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/service-requests/${item.id}`}
                      className="flex flex-col gap-2 px-5 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:gap-4"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-900">{item.title}</p>
                        <p className="mt-0.5 text-xs text-slate-500">
                          #{item.id} &middot; {item.requested_by?.name ?? "Unknown"} &middot; {formatDate(item.created_at)}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <PriorityBadge priority={item.priority} />
                        <StatusBadge status={item.status} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-5">
              <h2 className="font-semibold text-slate-900">Requests by priority</h2>
              <p className="mt-1 text-sm text-slate-500">Share of all requests</p>

              <ul className="mt-5 space-y-4">
                {PRIORITIES.map((priority) => {
                  const count = summary?.byPriority[priority.value] ?? 0;
                  const percent = summary && summary.total > 0 ? Math.round((count / summary.total) * 100) : 0;

                  return (
                    <li key={priority.value}>
                      <Link href={`/service-requests?priority=${priority.value}`} className="group block">
                        <div className="flex items-center justify-between text-sm">
                          <span className="flex items-center gap-2 font-medium text-slate-700 group-hover:text-indigo-600">
                            <span className={`h-2 w-2 rounded-full ${dotClass(priority.value)}`} />
                            {priority.label}
                          </span>
                          {summary ? (
                            <span className="text-slate-500">
                              {count} <span className="text-slate-400">({percent}%)</span>
                            </span>
                          ) : (
                            <Skeleton className="h-4 w-12" />
                          )}
                        </div>
                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${dotClass(priority.value)}`}
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
