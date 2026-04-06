import Link from "next/link";
import { SignOutButton } from "@/components/dashboard/SignOutButton";

export function DashboardTopBar({ userEmail }: { userEmail: string }) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900 lg:px-6">
      <div className="flex items-center gap-4">
        <Link
          href="/vendors"
          className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
        >
          Client Track
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden max-w-[200px] truncate text-sm text-zinc-600 sm:inline dark:text-zinc-400">
          {userEmail}
        </span>
        <SignOutButton className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800" />
      </div>
    </header>
  );
}
