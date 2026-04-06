"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/dashboard/SignOutButton";

const nav = [
  { href: "/vendors", label: "Vendors", placeholder: false },
  { href: "/projects", label: "Projects", placeholder: true },
  { href: "/calendar", label: "Calendar", placeholder: true },
  { href: "/settings", label: "Settings", placeholder: true },
] as const;

export function DashboardSidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-full shrink-0 flex-col border-b border-zinc-200 bg-white md:w-52 md:border-r md:border-b-0 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Signed in
        </p>
        <p className="mt-0.5 truncate text-sm text-zinc-800 dark:text-zinc-200">
          {userEmail || "—"}
        </p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {nav.map((item) => {
          const active = !item.placeholder && pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                item.placeholder
                  ? "rounded-lg px-3 py-2 text-sm text-zinc-400 dark:text-zinc-500"
                  : active
                    ? "rounded-lg bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
                    : "rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              }
            >
              {item.label}
              {item.placeholder ? (
                <span className="ml-1 text-xs font-normal">(soon)</span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
        <SignOutButton className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100" />
      </div>
    </aside>
  );
}
