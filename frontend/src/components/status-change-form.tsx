"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { StatusBadge } from "@/components/badge";
import { Alert, Button, FieldError, Spinner, fieldProps, inputClass } from "@/components/ui";
import { LockIcon } from "@/components/icons";
import { useAuth } from "@/context/auth-context";
import { useApi } from "@/hooks/use-api";
import { PERMISSIONS, can } from "@/lib/permissions";
import { ApiError } from "@/lib/api";
import { errorMessage, fieldErrors } from "@/lib/errors";
import type { ServiceRequest } from "@/lib/types";

const REMARK_LIMIT = 1000;

type Feedback = { tone: "success" | "error" | "warning"; message: string } | null;

export function StatusChangeForm({
  request,
  onChange,
}: {
  request: ServiceRequest;
  onChange: (request: ServiceRequest) => void;
}) {
  const api = useApi();
  const { user } = useAuth();
  const [remark, setRemark] = useState("");
  const [remarkError, setRemarkError] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const next = request.next_status;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!next) {
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    setRemarkError(undefined);

    try {
      const updated = await api.updateServiceRequestStatus(request.id, {
        status: next.value,
        expected_version: request.version,
        remark: remark.trim() === "" ? undefined : remark.trim(),
      });

      onChange(updated);
      setRemark("");
      setFeedback({
        tone: "success",
        message: `Status changed to ${updated.status.label}. This request is now version ${updated.version}.`,
      });
    } catch (error) {
      if (error instanceof ApiError && error.status === 409 && error.payload.current_version === undefined) {
        setFeedback({ tone: "error", message: error.errors.status?.[0] ?? error.message });
      } else if (error instanceof ApiError && error.status === 409) {
        const latest = error.payload.data as ServiceRequest | null | undefined;

        if (latest) {
          onChange(latest);
        }

        setFeedback({
          tone: "warning",
          message: `${error.message} The latest details have been loaded. Please review them before trying again.`,
        });
      } else {
        const errors = fieldErrors(error);
        setRemarkError(errors.remark?.[0]);
        setFeedback({
          tone: "error",
          message: errors.status?.[0] ?? errors.expected_version?.[0] ?? (errors.remark ? "Please fix the remark and try again." : errorMessage(error)),
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  const feedbackBox = feedback && (
    <Alert tone={feedback.tone}>
      {feedback.message}
      {feedback.tone === "success" && (
        <>
          {" "}
          <Link href={`/service-requests/${request.id}/history`} className="font-medium underline">
            View history
          </Link>
        </>
      )}
    </Alert>
  );

  if (!next) {
    return (
      <div className="space-y-4">
        {feedbackBox}
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">
          This request is <StatusBadge status={request.status} />. Resolved is the final status, so the status can no
          longer be changed.
        </div>
      </div>
    );
  }

  if (!can(user, PERMISSIONS.changeStatus)) {
    return (
      <div className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600" role="note">
        <LockIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
        <p>
          You do not have permission to change the status of service requests. Ask an administrator to grant the
          &ldquo;Change request status&rdquo; permission.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
        <span>Move from</span>
        <StatusBadge status={request.status} />
        <span>to</span>
        <StatusBadge status={next} />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label htmlFor="remark" className="block text-sm font-medium text-slate-700">
            Remark <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <span className="text-xs text-slate-500" aria-live="polite">
            {remark.length}/{REMARK_LIMIT}
          </span>
        </div>
        <textarea
          {...fieldProps("remark", remarkError)}
          rows={4}
          maxLength={REMARK_LIMIT}
          value={remark}
          onChange={(event) => setRemark(event.target.value)}
          placeholder="Add a note about this change"
          className={`${inputClass} mt-1.5 resize-y`}
        />
        <FieldError id="remark-error" message={remarkError} />
      </div>

      {feedbackBox}

      <Button type="submit" className="w-full sm:w-auto" disabled={submitting || !api.ready}>
        {submitting && <Spinner className="h-4 w-4 text-white" />}
        {submitting ? "Updating..." : `Mark as ${next.label}`}
      </Button>

      <p className="text-xs text-slate-500">
        You are updating version <span className="font-mono font-medium text-slate-700">v{request.version}</span>. If the
        request changes before you save, your update will be rejected.
      </p>
    </form>
  );
}
