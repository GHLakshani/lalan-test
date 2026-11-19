"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { dotClass } from "@/components/badge";
import { ArrowLeftIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { AccessDenied, Alert, Button, ButtonLink, Card, FieldError, Spinner, fieldProps, inputClass } from "@/components/ui";
import { useAuth } from "@/context/auth-context";
import { useApi } from "@/hooks/use-api";
import { errorMessage, fieldErrors } from "@/lib/errors";
import { PERMISSIONS, can } from "@/lib/permissions";
import { PRIORITIES } from "@/lib/types";
import type { NewServiceRequest } from "@/lib/types";

const TITLE_LIMIT = 255;
const DESCRIPTION_LIMIT = 5000;

const priorityHints: Record<string, string> = {
  low: "Minor issue, no rush",
  medium: "Needs attention soon",
  high: "Affects daily work",
  urgent: "Work is blocked",
};

export default function NewServiceRequestPage() {
  const api = useApi();
  const router = useRouter();
  const { user } = useAuth();
  const [form, setForm] = useState<NewServiceRequest>({ title: "", description: "", priority: "" });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function update<K extends keyof NewServiceRequest>(key: K, value: NewServiceRequest[K]) {
    setForm((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: [] }));
  }

  if (user && !can(user, PERMISSIONS.createRequests)) {
    return <AccessDenied message="You do not have permission to create service requests. Ask an administrator for access." />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setMessage(null);
    setSubmitting(true);

    try {
      const created = await api.createServiceRequest({
        title: form.title.trim(),
        description: form.description.trim(),
        priority: form.priority,
      });
      router.push(`/service-requests/${created.id}?created=1`);
    } catch (error) {
      const validation = fieldErrors(error);

      if (Object.keys(validation).length > 0) {
        setErrors(validation);
        setMessage("Please fix the highlighted fields and try again.");
      } else {
        setMessage(errorMessage(error));
      }
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/service-requests"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to service requests
      </Link>

      <PageHeader title="New service request" description="Describe the issue and choose how urgent it is." />

      <Card>
        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-6 p-6">
            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="title" className="block text-sm font-medium text-slate-700">
                  Title <span className="text-rose-600" aria-hidden="true">*</span>
                </label>
                <span className="text-xs text-slate-500">
                  {form.title.length}/{TITLE_LIMIT}
                </span>
              </div>
              <input
                {...fieldProps("title", errors.title?.[0])}
                required
                type="text"
                maxLength={TITLE_LIMIT}
                placeholder="Short summary of the issue"
                value={form.title}
                onChange={(event) => update("title", event.target.value)}
                className={`${inputClass} mt-1.5`}
              />
              <FieldError id="title-error" message={errors.title?.[0]} />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label htmlFor="description" className="block text-sm font-medium text-slate-700">
                  Description <span className="text-rose-600" aria-hidden="true">*</span>
                </label>
                <span className="text-xs text-slate-500">
                  {form.description.length}/{DESCRIPTION_LIMIT}
                </span>
              </div>
              <textarea
                {...fieldProps("description", errors.description?.[0])}
                required
                rows={6}
                maxLength={DESCRIPTION_LIMIT}
                placeholder="What happened, where, and any steps you have already tried"
                value={form.description}
                onChange={(event) => update("description", event.target.value)}
                className={`${inputClass} mt-1.5 resize-y`}
              />
              <FieldError id="description-error" message={errors.description?.[0]} />
            </div>

            <fieldset aria-describedby={errors.priority?.[0] ? "priority-error" : undefined}>
              <legend className="text-sm font-medium text-slate-700">
                Priority <span className="text-rose-600" aria-hidden="true">*</span>
              </legend>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {PRIORITIES.map((option) => {
                  const selected = form.priority === option.value;

                  return (
                    <label
                      key={option.value}
                      className={`flex cursor-pointer flex-col rounded-lg border p-3 transition has-focus-visible:ring-2 has-focus-visible:ring-indigo-500 has-focus-visible:ring-offset-2 ${
                        selected
                          ? "border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600"
                          : errors.priority?.[0]
                            ? "border-rose-300 hover:border-rose-400"
                            : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="priority"
                        value={option.value}
                        checked={selected}
                        required
                        onChange={() => update("priority", option.value)}
                        className="sr-only"
                      />
                      <span className="flex items-center gap-2 text-sm font-medium text-slate-900">
                        <span className={`h-2 w-2 rounded-full ${dotClass(option.value)}`} />
                        {option.label}
                      </span>
                      <span className="mt-1 text-xs text-slate-500">{priorityHints[option.value]}</span>
                    </label>
                  );
                })}
              </div>
              <FieldError id="priority-error" message={errors.priority?.[0]} />
            </fieldset>

            {message && <Alert>{message}</Alert>}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/60 px-6 py-4 sm:flex-row sm:justify-end">
            <ButtonLink href="/service-requests" variant="secondary">
              Cancel
            </ButtonLink>
            <Button type="submit" disabled={submitting || !api.ready}>
              {submitting && <Spinner className="h-4 w-4 text-white" />}
              {submitting ? "Creating..." : "Create request"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
