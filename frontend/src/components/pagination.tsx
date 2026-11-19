import { ChevronLeftIcon, ChevronRightIcon } from "@/components/icons";
import type { PaginationMeta } from "@/lib/types";

function pageWindow(current: number, last: number): (number | "gap")[] {
  if (last <= 7) {
    return Array.from({ length: last }, (_, index) => index + 1);
  }

  const pages = new Set([1, last, current - 1, current, current + 1]);
  const sorted = [...pages].filter((page) => page >= 1 && page <= last).sort((a, b) => a - b);
  const result: (number | "gap")[] = [];

  sorted.forEach((page, index) => {
    if (index > 0 && page - sorted[index - 1] > 1) {
      result.push("gap");
    }
    result.push(page);
  });

  return result;
}

export function Pagination({
  meta,
  onPageChange,
  disabled = false,
}: {
  meta: PaginationMeta;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}) {
  const { current_page: current, last_page: last, from, to, total } = meta;

  const pageButton =
    "inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row">
      <p className="text-sm text-slate-500">
        {total > 0 ? (
          <>
            Showing <span className="font-medium text-slate-700">{from}</span> to{" "}
            <span className="font-medium text-slate-700">{to}</span> of{" "}
            <span className="font-medium text-slate-700">{total}</span> requests
          </>
        ) : (
          "No requests found"
        )}
      </p>

      {last > 1 && (
        <nav className="flex items-center gap-1" aria-label="Pagination">
          <button
            type="button"
            className={`${pageButton} text-slate-600 hover:bg-slate-100`}
            onClick={() => onPageChange(current - 1)}
            disabled={disabled || current <= 1}
            aria-label="Previous page"
          >
            <ChevronLeftIcon className="h-4 w-4" />
          </button>

          {pageWindow(current, last).map((page, index) =>
            page === "gap" ? (
              <span key={`gap-${index}`} className="px-1 text-sm text-slate-400">
                ...
              </span>
            ) : (
              <button
                key={page}
                type="button"
                className={`${pageButton} ${
                  page === current ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
                onClick={() => onPageChange(page)}
                disabled={disabled || page === current}
                aria-current={page === current ? "page" : undefined}
              >
                {page}
              </button>
            ),
          )}

          <button
            type="button"
            className={`${pageButton} text-slate-600 hover:bg-slate-100`}
            onClick={() => onPageChange(current + 1)}
            disabled={disabled || current >= last}
            aria-label="Next page"
          >
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </nav>
      )}
    </div>
  );
}
