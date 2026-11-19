"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Alert, Button, FieldError, Spinner, fieldProps, inputClass } from "@/components/ui";
import { useAuth } from "@/context/auth-context";
import { errorMessage, fieldErrors } from "@/lib/errors";

const demoAccounts = [
  { label: "Demo Admin", email: "admin@example.com" },
  { label: "Demo User", email: "user@example.com" },
];

export default function LoginPage() {
  const { user, loading, login, notice, clearNotice } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setMessage(null);
    clearNotice();
    setSubmitting(true);

    try {
      await login(email, password);
      router.replace("/dashboard");
    } catch (error) {
      const validation = fieldErrors(error);

      if (Object.keys(validation).length > 0) {
        setErrors(validation);
      } else {
        setMessage(errorMessage(error));
      }
      setSubmitting(false);
    }
  }

  function fillDemo(demoEmail: string) {
    setEmail(demoEmail);
    setPassword("password");
    setErrors({});
    setMessage(null);
  }

  if (loading || user) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Spinner className="h-8 w-8" />
      </main>
    );
  }

  return (
    <main className="flex min-h-screen">
      <section className="hidden flex-1 flex-col justify-between bg-slate-900 p-12 text-white lg:flex">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500 font-bold">SD</span>
          <span className="text-lg font-semibold">Service Desk</span>
        </div>
        <div className="max-w-md">
          <h2 className="text-3xl font-semibold leading-tight">Track every service request in one place.</h2>
          <p className="mt-4 text-slate-400">
            Log new issues, follow their progress and find any request quickly with search and filters.
          </p>
        </div>
        <p className="text-sm text-slate-500">Laravel API with a Next.js frontend</p>
      </section>

      <section className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Sign in</h1>
          <p className="mt-1 text-sm text-slate-500">Welcome back. Please enter your details.</p>

          {notice && (
            <div className="mt-6">
              <Alert tone="warning">{notice}</Alert>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                {...fieldProps("email", errors.email?.[0])}
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className={`${inputClass} mt-1.5`}
              />
              <FieldError id="email-error" message={errors.email?.[0]} />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <input
                {...fieldProps("password", errors.password?.[0])}
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className={`${inputClass} mt-1.5`}
              />
              <FieldError id="password-error" message={errors.password?.[0]} />
            </div>

            {message && <Alert>{message}</Alert>}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting && <Spinner className="h-4 w-4 text-white" />}
              {submitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Demo accounts</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => fillDemo(account.email)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left transition hover:border-indigo-300 hover:bg-indigo-50/50"
                >
                  <span className="block text-sm font-medium text-slate-900">{account.label}</span>
                  <span className="block truncate text-xs text-slate-500">{account.email}</span>
                </button>
              ))}
            </div>
            <p className="mt-3 text-xs text-slate-400">Password for both accounts: password</p>
          </div>
        </div>
      </section>
    </main>
  );
}
