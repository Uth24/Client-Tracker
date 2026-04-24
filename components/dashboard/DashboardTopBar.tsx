import Link from "next/link";
import { SignOutButton } from "@/components/dashboard/SignOutButton";
import { GlobalSearch } from "@/components/dashboard/GlobalSearch";

export function DashboardTopBar({ userEmail }: { userEmail: string }) {
  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between border-b border-zinc-200/80 bg-white/70 px-4 backdrop-blur xl:px-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="text-base font-semibold tracking-wide text-zinc-900"
        >
          Dashboard
        </Link>
      </div>
      <div className="flex items-center gap-3">
        <GlobalSearch />

        <div className="hidden items-center gap-2 rounded-xl bg-white px-3 py-2 ring-1 ring-zinc-200 sm:flex">
          <span className="max-w-[220px] truncate text-sm text-zinc-700">
            {userEmail}
          </span>
          <span className="h-7 w-7 rounded-full bg-gradient-to-br from-sky-600 to-blue-700 ring-1 ring-zinc-200" />
        </div>

        <SignOutButton className="rounded-xl bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800" />
      </div>
    </header>
  );
}
