"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useState } from "react";
import {
  CloseIcon,
  DashboardIcon,
  ListIcon,
  LogoutIcon,
  MenuIcon,
  PlusIcon,
  UserIcon,
} from "@/components/icons";
import { useAuth } from "@/context/auth-context";
import { initials } from "@/lib/format";

const navigation = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: DashboardIcon,
    isActive: (path: string) => path === "/dashboard",
  },
  {
    href: "/service-requests",
    label: "Service Requests",
    icon: ListIcon,
    isActive: (path: string) => path === "/service-requests" || /^\/service-requests\/\d+/.test(path),
  },
  {
    href: "/service-requests/new",
    label: "New Request",
    icon: PlusIcon,
    isActive: (path: string) => path === "/service-requests/new",
  },
  {
    href: "/profile",
    label: "Profile",
    icon: UserIcon,
    isActive: (path: string) => path === "/profile",
  },
];

function Brand() {
  return (
    <Link href="/dashboard" className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500 text-sm font-bold text-white">
        SD
      </span>
      <span className="text-base font-semibold text-white">Service Desk</span>
    </Link>
  );
}

function NavLinks({ pathname, onNavigate }: { pathname: string | null; onNavigate: () => void }) {
  return navigation.map((item) => {
    const active = pathname !== null && item.isActive(pathname);
    const Icon = item.icon;

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        aria-current={active ? "page" : undefined}
        className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
          active ? "bg-slate-800 text-white" : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
        }`}
      >
        <Icon className={`h-5 w-5 shrink-0 ${active ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"}`} />
        {item.label}
      </Link>
    );
  });
}

function ActiveNavLinks({ onNavigate }: { onNavigate: () => void }) {
  return <NavLinks pathname={usePathname()} onNavigate={onNavigate} />;
}

export function Sidebar() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
    router.replace("/login");
  }

  const content = (
    <div className="flex h-full flex-col bg-slate-900">
      <div className="flex h-16 shrink-0 items-center justify-between px-5">
        <Brand />
        <button
          type="button"
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Menu</p>
        <Suspense fallback={<NavLinks pathname={null} onNavigate={() => setOpen(false)} />}>
          <ActiveNavLinks onNavigate={() => setOpen(false)} />
        </Suspense>
      </nav>

      {!user && (
        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <span className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-slate-700" />
            <div className="flex-1 space-y-2">
              <span className="block h-3 w-24 animate-pulse rounded bg-slate-700" />
              <span className="block h-3 w-32 animate-pulse rounded bg-slate-800" />
            </div>
          </div>
        </div>
      )}

      {user && (
        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-700 text-sm font-semibold text-white">
              {initials(user.name)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user.name}</p>
              <p className="truncate text-xs text-slate-400">{user.is_admin ? "Administrator" : "Member"} &middot; {user.email}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="rounded-md p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white disabled:opacity-50"
              aria-label="Log out"
              title="Log out"
            >
              <LogoutIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:hidden">
        <button
          type="button"
          className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <MenuIcon className="h-6 w-6" />
        </button>
        <span className="font-semibold text-slate-900">Service Desk</span>
      </div>

      <div className={`fixed inset-0 z-40 lg:hidden ${open ? "" : "pointer-events-none"}`} inert={!open}>
        <div
          className={`absolute inset-0 bg-slate-900/50 transition-opacity ${open ? "opacity-100" : "opacity-0"}`}
          onClick={() => setOpen(false)}
        />
        <aside
          className={`absolute inset-y-0 left-0 w-72 max-w-[85%] transition-transform duration-200 ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {content}
        </aside>
      </div>

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 lg:block">{content}</aside>
    </>
  );
}
