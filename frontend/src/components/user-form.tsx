"use client";

import { FormEvent, useCallback, useState } from "react";
import { Alert, Button, ButtonLink, Card, FieldError, Skeleton, Spinner, fieldProps, inputClass } from "@/components/ui";
import { useApi } from "@/hooks/use-api";
import { useRemote } from "@/hooks/use-remote";
import { errorMessage, fieldErrors } from "@/lib/errors";
import type { PermissionValue, Role, User, UserInput } from "@/lib/types";

const roles: { value: Role; label: string; description: string }[] = [
  { value: "member", label: "Member", description: "Access is controlled by the permissions selected below." },
  { value: "admin", label: "Administrator", description: "Full access to every action, including user management." },
];

function firstError(errors: Record<string, string[]>, prefix: string) {
  const key = Object.keys(errors).find((name) => name === prefix || name.startsWith(`${prefix}.`));
  return key ? errors[key][0] : undefined;
}

export function UserForm({
  user,
  isSelf = false,
  submitLabel,
  onSubmit,
}: {
  user?: User;
  isSelf?: boolean;
  submitLabel: string;
  onSubmit: (input: UserInput) => Promise<void>;
}) {
  const api = useApi();
  const editing = Boolean(user);

  const fetchPermissions = useCallback(() => api.fetchPermissions(), [api]);
  const { data: options, error: optionsError, reload } = useRemote(api.ready ? "permissions" : null, fetchPermissions);

  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [role, setRole] = useState<Role>(user?.role ?? "member");
  const [chosen, setChosen] = useState<PermissionValue[] | null>(user ? user.permissions : null);
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const defaults = options?.filter((option) => option.default).map((option) => option.value) ?? [];
  const selected = chosen ?? defaults;

  function togglePermission(value: PermissionValue) {
    setChosen((current) => {
      const base = current ?? defaults;
      return base.includes(value) ? base.filter((item) => item !== value) : [...base, value];
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});
    setMessage(null);
    setSubmitting(true);

    const input: UserInput = {
      name: name.trim(),
      email: email.trim(),
      role,
      permissions: role === "admin" ? [] : selected,
    };

    if (!editing || password !== "") {
      input.password = password;
      input.password_confirmation = passwordConfirmation;
    }

    try {
      await onSubmit(input);
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

  const nameError = firstError(errors, "name");
  const emailError = firstError(errors, "email");
  const passwordError = firstError(errors, "password");
  const roleError = firstError(errors, "role");
  const permissionsError = firstError(errors, "permissions");

  return (
    <Card>
      <form onSubmit={handleSubmit} noValidate>
        <div className="space-y-8 p-6">
          <section aria-labelledby="account-heading" className="space-y-5">
            <h2 id="account-heading" className="text-base font-semibold text-slate-900">
              Account details
            </h2>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700">
                  Full name <span className="text-rose-600" aria-hidden="true">*</span>
                </label>
                <input
                  {...fieldProps("name", nameError)}
                  type="text"
                  required
                  autoComplete="off"
                  maxLength={255}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={`${inputClass} mt-1.5`}
                />
                <FieldError id="name-error" message={nameError} />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                  Email <span className="text-rose-600" aria-hidden="true">*</span>
                </label>
                <input
                  {...fieldProps("email", emailError)}
                  type="email"
                  required
                  autoComplete="off"
                  maxLength={255}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className={`${inputClass} mt-1.5`}
                />
                <FieldError id="email-error" message={emailError} />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                  {editing ? "New password" : "Password"}{" "}
                  {!editing && (
                    <span className="text-rose-600" aria-hidden="true">
                      *
                    </span>
                  )}
                </label>
                <input
                  {...fieldProps("password", passwordError)}
                  type="password"
                  required={!editing}
                  autoComplete="new-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className={`${inputClass} mt-1.5`}
                />
                <p className="mt-1.5 text-xs text-slate-500">
                  {editing ? "Leave blank to keep the current password. " : ""}At least 8 characters.
                </p>
                <FieldError id="password-error" message={passwordError} />
              </div>

              <div>
                <label htmlFor="password_confirmation" className="block text-sm font-medium text-slate-700">
                  Confirm password
                </label>
                <input
                  id="password_confirmation"
                  type="password"
                  required={!editing}
                  autoComplete="new-password"
                  value={passwordConfirmation}
                  onChange={(event) => setPasswordConfirmation(event.target.value)}
                  className={`${inputClass} mt-1.5`}
                />
              </div>
            </div>
          </section>

          <fieldset aria-describedby={roleError ? "role-error" : isSelf ? "role-self-note" : undefined}>
            <legend className="text-base font-semibold text-slate-900">Role</legend>
            {isSelf && (
              <p id="role-self-note" className="mt-1 text-sm text-slate-500">
                You cannot change your own role.
              </p>
            )}
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {roles.map((option) => {
                const active = role === option.value;

                return (
                  <label
                    key={option.value}
                    className={`flex gap-3 rounded-lg border p-4 transition has-focus-visible:ring-2 has-focus-visible:ring-indigo-500 has-focus-visible:ring-offset-2 ${
                      active ? "border-indigo-600 bg-indigo-50/60 ring-1 ring-indigo-600" : "border-slate-200"
                    } ${isSelf ? "cursor-not-allowed opacity-70" : "cursor-pointer hover:border-slate-300"}`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={option.value}
                      checked={active}
                      disabled={isSelf}
                      onChange={() => setRole(option.value)}
                      className="mt-0.5 h-4 w-4 accent-indigo-600"
                    />
                    <span>
                      <span className="block text-sm font-medium text-slate-900">{option.label}</span>
                      <span className="mt-0.5 block text-xs text-slate-500">{option.description}</span>
                    </span>
                  </label>
                );
              })}
            </div>
            <FieldError id="role-error" message={roleError} />
          </fieldset>

          <fieldset aria-describedby={permissionsError ? "permissions-error" : "permissions-note"}>
            <legend className="text-base font-semibold text-slate-900">Permissions</legend>
            <p id="permissions-note" className="mt-1 text-sm text-slate-500">
              {role === "admin"
                ? "Administrators automatically have every permission."
                : "Choose which actions this member can perform."}
            </p>

            <div className="mt-3 space-y-3">
              {optionsError ? (
                <Alert>
                  {errorMessage(optionsError)}{" "}
                  <button type="button" onClick={reload} className="font-medium underline">
                    Try again
                  </button>
                </Alert>
              ) : !options ? (
                Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-16 w-full" />)
              ) : (
                options.map((option) => {
                  const checked = role === "admin" || selected.includes(option.value);

                  return (
                    <label
                      key={option.value}
                      className={`flex gap-3 rounded-lg border border-slate-200 p-4 ${
                        role === "admin" ? "cursor-not-allowed bg-slate-50" : "cursor-pointer hover:border-slate-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        name="permissions"
                        value={option.value}
                        checked={checked}
                        disabled={role === "admin"}
                        onChange={() => togglePermission(option.value)}
                        className="mt-0.5 h-4 w-4 accent-indigo-600"
                      />
                      <span>
                        <span className="block text-sm font-medium text-slate-900">{option.label}</span>
                        <span className="mt-0.5 block text-xs text-slate-500">{option.description}</span>
                      </span>
                    </label>
                  );
                })
              )}
            </div>
            <FieldError id="permissions-error" message={permissionsError} />
          </fieldset>

          {message && <Alert>{message}</Alert>}
        </div>

        <div className="flex flex-col-reverse gap-3 rounded-b-xl border-t border-slate-200 bg-slate-50/60 px-6 py-4 sm:flex-row sm:justify-end">
          <ButtonLink href="/users" variant="secondary">
            Cancel
          </ButtonLink>
          <Button type="submit" disabled={submitting || !api.ready || (!options && role === "member")}>
            {submitting && <Spinner className="h-4 w-4 text-white" />}
            {submitting ? "Saving..." : submitLabel}
          </Button>
        </div>
      </form>
    </Card>
  );
}
