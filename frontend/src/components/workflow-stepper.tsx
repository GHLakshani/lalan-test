import { STATUSES } from "@/lib/types";
import type { Status } from "@/lib/types";

export function WorkflowStepper({ current }: { current: Status }) {
  const currentIndex = STATUSES.findIndex((status) => status.value === current);

  return (
    <ol className="flex items-start" aria-label="Status workflow">
      {STATUSES.map((status, index) => {
        const done = index < currentIndex;
        const active = index === currentIndex;
        const last = index === STATUSES.length - 1;

        return (
          <li key={status.value} className="relative flex flex-1 flex-col items-center">
            {!last && (
              <span
                className={`absolute left-1/2 top-3.5 h-0.5 w-full ${done ? "bg-indigo-600" : "bg-slate-200"}`}
                aria-hidden="true"
              />
            )}
            <span
              className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ring-4 ring-white ${
                done
                  ? "bg-indigo-600 text-white"
                  : active
                    ? "bg-white text-indigo-700 ring-indigo-100 outline-2 outline-indigo-600"
                    : "bg-slate-100 text-slate-400"
              }`}
              aria-current={active ? "step" : undefined}
            >
              {done ? (
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4" aria-hidden="true">
                  <path
                    fillRule="evenodd"
                    d="M16.7 5.3a1 1 0 0 1 0 1.4l-8 8a1 1 0 0 1-1.4 0l-4-4a1 1 0 1 1 1.4-1.4L8 12.6l7.3-7.3a1 1 0 0 1 1.4 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                index + 1
              )}
            </span>
            <span
              className={`mt-2 whitespace-nowrap text-xs font-medium ${
                active ? "text-indigo-700" : done ? "text-slate-700" : "text-slate-400"
              }`}
            >
              {status.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
