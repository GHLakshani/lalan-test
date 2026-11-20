import { StatusBadge, dotClass } from "@/components/badge";
import { formatDateTime } from "@/lib/format";
import type { StatusHistoryEntry } from "@/lib/types";

export function StatusTimeline({
  entries,
  order = "desc",
}: {
  entries: StatusHistoryEntry[];
  order?: "asc" | "desc";
}) {
  if (entries.length === 0) {
    return <p className="text-sm text-slate-500">No status changes recorded yet.</p>;
  }

  const sorted = [...entries].sort((a, b) => (order === "asc" ? a.version - b.version : b.version - a.version));
  const currentId = sorted.reduce((latest, entry) => (entry.version > latest.version ? entry : latest), sorted[0]).id;

  return (
    <ol className="relative">
      {sorted.map((entry, index) => {
        const isCurrent = entry.id === currentId;
        const isLast = index === sorted.length - 1;

        return (
          <li key={entry.id} className="relative flex gap-4 pb-6 last:pb-0">
            {!isLast && <span className="absolute -bottom-1 left-[11px] top-7 w-px bg-slate-200" aria-hidden="true" />}

            <span
              className={`relative mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-4 ring-white ${
                isCurrent ? "bg-indigo-100" : "bg-slate-100"
              }`}
              aria-hidden="true"
            >
              <span className={`h-2.5 w-2.5 rounded-full ${dotClass(entry.to_status.value)}`} />
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-sm text-slate-700">
                {entry.from_status ? (
                  <>
                    <span>Status changed from</span>
                    <StatusBadge status={entry.from_status} />
                    <span>to</span>
                    <StatusBadge status={entry.to_status} />
                  </>
                ) : (
                  <>
                    <span>Request created as</span>
                    <StatusBadge status={entry.to_status} />
                  </>
                )}
                {isCurrent && (
                  <span className="rounded-full bg-indigo-600 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">
                    Current
                  </span>
                )}
              </div>

              {entry.remark && (
                <p className="mt-2 whitespace-pre-line wrap-break-word rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <span className="sr-only">Remark: </span>
                  {entry.remark}
                </p>
              )}

              <p className="mt-1.5 text-xs text-slate-500">
                <span className="font-medium text-slate-700">{entry.actor?.name ?? "System"}</span>
                <span className="mx-1.5 text-slate-300" aria-hidden="true">
                  &middot;
                </span>
                <time dateTime={entry.created_at}>{formatDateTime(entry.created_at)}</time>
                <span className="mx-1.5 text-slate-300" aria-hidden="true">
                  &middot;
                </span>
                <span className="font-mono">
                  <span className="sr-only">version </span>v{entry.version}
                </span>
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
