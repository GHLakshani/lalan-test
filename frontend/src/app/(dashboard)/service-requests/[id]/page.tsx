"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PriorityBadge, StatusBadge } from "@/components/badge";
import { useServiceRequest } from "@/components/request-context";
import { StatusTimeline } from "@/components/status-timeline";
import { Alert, ButtonLink, Card, Skeleton } from "@/components/ui";
import { WorkflowStepper } from "@/components/workflow-stepper";
import { formatDateTime, initials } from "@/lib/format";

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 text-sm">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-right font-medium text-slate-900">{children}</dd>
    </div>
  );
}

export default function RequestDetailsPage() {
  const { request } = useServiceRequest();
  const created = useSearchParams().get("created") === "1";
  const history = request?.status_history ?? [];
  const recent = [...history].sort((a, b) => b.version - a.version).slice(0, 3);
  const base = request ? `/service-requests/${request.id}` : "";

  return (
    <div className="space-y-6">
      {created && request && <Alert tone="success">Service request #{request.id} was created successfully.</Alert>}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-6">
            <h2 className="text-sm font-semibold text-slate-900">Description</h2>
            {request ? (
              <p className="mt-2 whitespace-pre-line wrap-break-word text-sm leading-6 text-slate-700">{request.description}</p>
            ) : (
              <div className="mt-3 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-6 py-4">
              <h2 className="font-semibold text-slate-900">Recent activity</h2>
              {request && (
                <Link href={`${base}/history`} className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                  View full history
                </Link>
              )}
            </div>
            <div className="p-6">
              {request ? (
                <StatusTimeline entries={recent} />
              ) : (
                <div className="space-y-4">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-5 w-1/2" />
                </div>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-sm font-semibold text-slate-900">Current status</h2>
            {request ? (
              <>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <StatusBadge status={request.status} />
                  <span className="rounded-md bg-indigo-50 px-2 py-1 font-mono text-sm font-semibold text-indigo-700">
                    Version {request.version}
                  </span>
                </div>
                <div className="mt-6 px-1">
                  <WorkflowStepper current={request.status.value} />
                </div>
                {request.next_status ? (
                  <ButtonLink href={`${base}/status`} className="mt-6 w-full">
                    Change status
                  </ButtonLink>
                ) : (
                  <p className="mt-6 text-sm text-slate-500">Resolved is the final status. No further changes are allowed.</p>
                )}
              </>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-7 w-24" />
                </div>
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-9 w-full" />
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-sm font-semibold text-slate-900">Details</h2>
            <dl className="mt-2 divide-y divide-slate-100">
              <DetailRow label="Requested by">
                {request ? (
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[11px] font-semibold text-indigo-700"
                      aria-hidden="true"
                    >
                      {initials(request.requested_by?.name ?? "?")}
                    </span>
                    {request.requested_by?.name ?? "Unknown"}
                  </span>
                ) : (
                  <Skeleton className="h-6 w-28" />
                )}
              </DetailRow>
              <DetailRow label="Priority">
                {request ? <PriorityBadge priority={request.priority} /> : <Skeleton className="h-5 w-16" />}
              </DetailRow>
              <DetailRow label="Created">
                {request ? formatDateTime(request.created_at) : <Skeleton className="h-4 w-32" />}
              </DetailRow>
              <DetailRow label="Last updated">
                {request ? formatDateTime(request.updated_at) : <Skeleton className="h-4 w-32" />}
              </DetailRow>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
