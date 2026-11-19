"use client";

import { useState } from "react";
import { useServiceRequest } from "@/components/request-context";
import { StatusTimeline } from "@/components/status-timeline";
import { Card, Skeleton } from "@/components/ui";

const orders = [
  { value: "asc", label: "Oldest first" },
  { value: "desc", label: "Newest first" },
] as const;

export default function StatusHistoryPage() {
  const { request } = useServiceRequest();
  const [order, setOrder] = useState<"asc" | "desc">("asc");
  const history = request?.status_history ?? [];

  return (
    <Card>
      <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Status history</h2>
          <p className="mt-0.5 text-sm text-slate-500">
            {request
              ? `${history.length} ${history.length === 1 ? "entry" : "entries"} in chronological order. Every change is recorded with its version.`
              : "Loading history..."}
          </p>
        </div>

        <div role="group" aria-label="Sort order" className="inline-flex rounded-lg bg-slate-100 p-1">
          {orders.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={order === option.value}
              onClick={() => setOrder(option.value)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                order === option.value ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {request ? (
          <StatusTimeline entries={history} order={order} />
        ) : (
          <div className="space-y-6" aria-busy="true">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="flex gap-4">
                <Skeleton className="h-6 w-6 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}
