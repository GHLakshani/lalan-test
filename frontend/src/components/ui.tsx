import Link from "next/link";
import type { ComponentProps } from "react";
import { errorMessage, isStatus } from "@/lib/errors";

const buttonBase =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const variants = {
  primary: "bg-indigo-600 text-white shadow-sm hover:bg-indigo-500",
  secondary: "bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50",
  ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
};

type Variant = keyof typeof variants;

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={`${buttonBase} ${variants[variant]} ${className}`} {...props} />;
}

export function ButtonLink({
  variant = "primary",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`${buttonBase} ${variants[variant]} ${className}`} {...props} />;
}

export function Card({ className = "", ...props }: ComponentProps<"div">) {
  return <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`} {...props} />;
}

export const inputClass =
  "block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600";

export function Spinner({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={`animate-spin text-indigo-600 ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-20" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-slate-200/70 ${className}`} />;
}

const alertStyles = {
  error: "bg-rose-50 text-rose-700 ring-rose-200",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  warning: "bg-amber-50 text-amber-800 ring-amber-200",
};

export function Alert({
  children,
  tone = "error",
}: {
  children: React.ReactNode;
  tone?: keyof typeof alertStyles;
}) {
  return (
    <div
      role={tone === "success" ? "status" : "alert"}
      className={`rounded-lg px-4 py-3 text-sm ring-1 ring-inset ${alertStyles[tone]}`}
    >
      {children}
    </div>
  );
}

export function ErrorState({
  error,
  onRetry,
  title = "Something went wrong",
}: {
  error: unknown;
  onRetry?: () => void;
  title?: string;
}) {
  const forbidden = isStatus(error, 403);

  return (
    <Card className="px-6 py-12 text-center" role="alert">
      <p className="text-lg font-semibold text-slate-900">{forbidden ? "Access denied" : title}</p>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{errorMessage(error)}</p>
      {onRetry && !forbidden && (
        <Button type="button" variant="secondary" className="mt-6" onClick={onRetry}>
          Try again
        </Button>
      )}
    </Card>
  );
}

export function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} className="mt-1.5 text-sm text-rose-600">
      {message}
    </p>
  );
}

export function fieldProps(id: string, message?: string) {
  return {
    id,
    "aria-invalid": message ? true : undefined,
    "aria-describedby": message ? `${id}-error` : undefined,
  } as const;
}
