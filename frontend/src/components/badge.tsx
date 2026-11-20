import type { Option, Priority, Status } from "@/lib/types";

const priorityStyles: Record<Priority, string> = {
  LOW: "bg-slate-100 text-slate-700 ring-slate-200",
  MEDIUM: "bg-sky-50 text-sky-700 ring-sky-200",
  HIGH: "bg-amber-50 text-amber-700 ring-amber-200",
};

const statusStyles: Record<Status, string> = {
  OPEN: "bg-blue-50 text-blue-700 ring-blue-200",
  IN_PROGRESS: "bg-violet-50 text-violet-700 ring-violet-200",
  RESOLVED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
};

const dotStyles: Record<Priority | Status, string> = {
  LOW: "bg-slate-400",
  MEDIUM: "bg-sky-500",
  HIGH: "bg-amber-500",
  OPEN: "bg-blue-500",
  IN_PROGRESS: "bg-violet-500",
  RESOLVED: "bg-emerald-500",
};

const base = "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset";

export function PriorityBadge({ priority }: { priority: Option<Priority> }) {
  return (
    <span className={`${base} ${priorityStyles[priority.value]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[priority.value]}`} />
      {priority.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: Option<Status> }) {
  return (
    <span className={`${base} ${statusStyles[status.value]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotStyles[status.value]}`} />
      {status.label}
    </span>
  );
}

export function dotClass(value: Priority | Status) {
  return dotStyles[value];
}
