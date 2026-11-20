"use client";

import Link from "next/link";
import { StatusBadge } from "@/components/badge";
import { useServiceRequest } from "@/components/request-context";
import { StatusChangeForm } from "@/components/status-change-form";
import { Card, Skeleton } from "@/components/ui";
import { WorkflowStepper } from "@/components/workflow-stepper";
import { formatDateTime } from "@/lib/format";

export default function StatusManagementPage() {
  const { request, replace } = useServiceRequest();
  const lastChange = request?.status_history
    ? [...request.status_history].sort((a, b) => b.version - a.version)[0]
    : undefined;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <Card className="p-6 lg:col-span-3">
        <h2 className="text-lg font-semibold text-slate-900">Change status</h2>
        <p className="mt-1 text-sm text-slate-500">Move this request to the next step and optionally add a remark.</p>
        <div className="mt-6">
          {request ? (
            <StatusChangeForm key={request.id} request={request} onChange={replace} />
          ) : (
            <div className="space-y-4">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          )}
        </div>
      </Card>

      <div className="space-y-6 lg:col-span-2">
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-slate-900">Workflow</h2>
          {request ? (
            <>
              <div className="mt-5 px-1">
                <WorkflowStepper current={request.status.value} />
              </div>
              <dl className="mt-6 space-y-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500">Current status</dt>
                  <dd>
                    <StatusBadge status={request.status} />
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-500">Current version</dt>
                  <dd className="font-mono font-semibold text-slate-900">v{request.version}</dd>
                </div>
                {lastChange && (
                  <div className="flex items-start justify-between gap-3">
                    <dt className="text-slate-500">Last changed</dt>
                    <dd className="text-right text-slate-900">
                      {formatDateTime(lastChange.created_at)}
                      <span className="block text-xs text-slate-500">by {lastChange.actor?.name ?? "System"}</span>
                    </dd>
                  </div>
                )}
              </dl>
            </>
          ) : (
            <div className="mt-5 space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="text-sm font-semibold text-slate-900">Rules</h2>
          <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm text-slate-600">
            <li>Status moves in order: Open, In Progress, Resolved.</li>
            <li>Steps cannot be skipped or reversed.</li>
            <li>Resolved is final and cannot be changed.</li>
            <li>If someone else updates the request first, your change is rejected and the latest version is loaded.</li>
          </ul>
          {request && (
            <Link
              href={`/service-requests/${request.id}/history`}
              className="mt-4 inline-block text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              View status history
            </Link>
          )}
        </Card>
      </div>
    </div>
  );
}
