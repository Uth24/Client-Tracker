import Link from "next/link";
import { SignOutButton } from "@/components/dashboard/SignOutButton";

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
        <div className="hidden items-center gap-2 rounded-xl bg-zinc-100 px-3 py-2 ring-1 ring-zinc-200 md:flex">
          <SearchIcon className="h-4 w-4 text-zinc-500" />
          <span className="text-sm text-zinc-500">Search</span>
          <span className="ml-8 rounded-md bg-white px-1.5 py-0.5 text-[11px] font-medium text-zinc-500 ring-1 ring-zinc-200">
            ⌘K
          </span>
        </div>

        <button
          type="button"
          className="relative grid h-10 w-10 place-items-center rounded-xl bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
          aria-label="Notifications"
        >
          <BellIcon className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-sky-600 px-1.5 text-[11px] font-semibold text-white ring-2 ring-white">
            15
          </span>
        </button>

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

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M10.5 18.5a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.9"
      />
      <path
        d="M16.5 16.5 21 21"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  );
}

function BellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 22a2.5 2.5 0 0 0 2.35-1.65"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M18 16.5H6c.9-1.1 1.5-2.2 1.5-4.5v-2a4.5 4.5 0 0 1 9 0v2c0 2.3.6 3.4 1.5 4.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        opacity="0.9"
      />
    </svg>
  );
}
