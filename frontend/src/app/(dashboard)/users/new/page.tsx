"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { AccessDenied } from "@/components/ui";
import { UserForm } from "@/components/user-form";
import { useAuth } from "@/context/auth-context";
import { useApi } from "@/hooks/use-api";
import type { UserInput } from "@/lib/types";

export default function NewUserPage() {
  const api = useApi();
  const router = useRouter();
  const { user } = useAuth();

  if (user && !user.is_admin) {
    return <AccessDenied message="Only administrators can manage users." />;
  }

  async function handleSubmit(input: UserInput) {
    const created = await api.createUser(input);
    router.push(`/users?saved=${encodeURIComponent(created.name)}`);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/users"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to users
      </Link>

      <PageHeader title="Add user" description="Create an account and choose what this person can do." />

      <UserForm submitLabel="Create user" onSubmit={handleSubmit} />
    </div>
  );
}
