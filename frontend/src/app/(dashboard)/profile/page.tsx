"use client";

import { Card, Skeleton } from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/context/auth-context";
import { formatDateTime, initials } from "@/lib/format";

export default function ProfilePage() {
  const { user } = useAuth();

  const details = user
    ? [
        { label: "User ID", value: `#${user.id}` },
        { label: "Full name", value: user.name },
        { label: "Email address", value: user.email },
        { label: "Role", value: user.is_admin ? "Administrator (can manage all requests)" : "Member (can manage own requests)" },
        { label: "Email verified", value: formatDateTime(user.email_verified_at, "Not verified") },
        { label: "Member since", value: formatDateTime(user.created_at) },
      ]
    : ["User ID", "Full name", "Email address", "Role", "Email verified", "Member since"].map((label) => ({
        label,
        value: null,
      }));

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Profile" description="Your account details." />

      <Card className="overflow-hidden">
        <div className="flex items-center gap-4 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-white p-6">
          {user ? (
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-lg font-semibold text-white">
              {initials(user.name)}
            </span>
          ) : (
            <Skeleton className="h-14 w-14 rounded-full" />
          )}
          <div className="min-w-0 space-y-1">
            {user ? (
              <>
                <p className="truncate text-lg font-semibold text-slate-900">{user.name}</p>
                <p className="truncate text-sm text-slate-500">{user.email}</p>
              </>
            ) : (
              <>
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-52" />
              </>
            )}
          </div>
        </div>

        <dl className="divide-y divide-slate-100">
          {details.map((item) => (
            <div key={item.label} className="grid grid-cols-1 gap-1 px-6 py-4 text-sm sm:grid-cols-3 sm:gap-4">
              <dt className="text-slate-500">{item.label}</dt>
              <dd className="wrap-break-word font-medium text-slate-900 sm:col-span-2">
                {item.value ?? <Skeleton className="h-4 w-48" />}
              </dd>
            </div>
          ))}
        </dl>
      </Card>
    </div>
  );
}
