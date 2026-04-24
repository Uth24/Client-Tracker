"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/dashboard/SignOutButton";

const nav = [
  { href: "/dashboard", label: "Dashboard", placeholder: false, icon: DashboardIcon },
  { href: "/vendors", label: "Vendors", placeholder: false, icon: UsersIcon },
  { href: "/clients", label: "Clients", placeholder: false, icon: PeopleIcon },
  { href: "/projects", label: "Projects", placeholder: false, icon: FolderIcon },
  { href: "/calendar", label: "Calendar", placeholder: true, icon: CalendarIcon },
  { href: "/settings", label: "Settings", placeholder: true, icon: SettingsIcon },
] as const;

export function DashboardSidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname();

  return (
    <aside className="relative flex w-full shrink-0 flex-col border-b border-zinc-900 bg-zinc-950 md:w-64 md:border-r md:border-b-0">
      <div className="pointer-events-none absolute inset-0 opacity-70">
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-sky-600/20 blur-3xl" />
        <div className="absolute -right-16 top-52 h-72 w-72 rounded-full bg-blue-700/10 blur-3xl" />
      </div>

      <div className="relative border-b border-white/10 px-5 py-5">
        <div className="flex items-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-white/5 ring-1 ring-white/10">
            <BrandMark />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-wide text-white">
              Client Track
            </p>
            <p className="truncate text-xs text-white/60">{userEmail || "—"}</p>
          </div>
        </div>
      </div>

      <nav className="relative flex flex-1 flex-col gap-1 p-3">
        {nav.map((item) => {
          const active =
            !item.placeholder &&
            (pathname === item.href || pathname.startsWith(item.href + "/"));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                item.placeholder
                  ? "rounded-xl px-3 py-2 text-sm text-white/40"
                  : active
                    ? "rounded-xl bg-white/10 px-3 py-2 text-sm font-medium text-white ring-1 ring-white/10"
                    : "rounded-xl px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white"
              }
            >
              <div className="flex items-center gap-2.5">
                <item.icon
                  className={
                    item.placeholder
                      ? "h-4 w-4 text-white/35"
                      : active
                        ? "h-4 w-4 text-white"
                        : "h-4 w-4 text-white/65"
                  }
                />
                <span className="truncate">{item.label}</span>
                {item.placeholder ? (
                  <span className="ml-auto rounded-full bg-white/5 px-2 py-0.5 text-[11px] font-medium text-white/50 ring-1 ring-white/10">
                    soon
                  </span>
                ) : null}
              </div>
            </Link>
          );
        })}
      </nav>
      <div className="relative border-t border-white/10 p-3">
        <SignOutButton className="w-full rounded-xl bg-white/5 px-3 py-2 text-left text-sm font-medium text-white/70 ring-1 ring-white/10 hover:bg-white/10 hover:text-white" />
      </div>
    </aside>
  );
}

function BrandMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="h-5 w-5 text-white"
    >
      <path
        d="M12 2.75c-3.52 0-6.75 2.2-6.75 6.04 0 2.64 1.51 4.08 3.18 4.95 1.47.77 2.22 1.04 2.22 2.31v1.2c0 1.06.86 1.92 1.92 1.92h.86c1.06 0 1.92-.86 1.92-1.92v-1.2c0-1.27.75-1.54 2.22-2.31 1.67-.87 3.18-2.31 3.18-4.95C18.75 4.95 15.52 2.75 12 2.75Z"
        className="fill-white/90"
      />
      <path
        d="M9.5 21.25h5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function DashboardIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M4.5 4.5h7.5v7.5H4.5V4.5Zm0 9h7.5V21H4.5v-7.5ZM13.5 4.5H21V21h-7.5V4.5Z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2.5 20.25c.6-3.64 3.6-6.25 6.5-6.25s5.9 2.61 6.5 6.25a.75.75 0 0 1-.74.88H3.24a.75.75 0 0 1-.74-.88Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M16.5 11.25a3.25 3.25 0 1 0 0-6.5 3.25 3.25 0 0 0 0 6.5Z"
        fill="currentColor"
        opacity="0.55"
      />
      <path
        d="M16.5 13.75c2.6 0 4.9 1.7 5.4 4.53a.75.75 0 0 1-.74.88h-3.06a8.77 8.77 0 0 0-2.12-4.83c.17-.38.33-.58.52-.58Z"
        fill="currentColor"
        opacity="0.55"
      />
    </svg>
  );
}

function PeopleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 11.25a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M4.25 20.25c.75-4 4.05-6.5 7.75-6.5s7 2.5 7.75 6.5a.75.75 0 0 1-.74.88H4.99a.75.75 0 0 1-.74-.88Z"
        fill="currentColor"
        opacity="0.55"
      />
    </svg>
  );
}

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M3.75 6.75A2.25 2.25 0 0 1 6 4.5h4.03c.6 0 1.18.24 1.6.67l1.2 1.2c.14.14.33.22.53.22H18A2.25 2.25 0 0 1 20.25 8.84v8.41A2.25 2.25 0 0 1 18 19.5H6A2.25 2.25 0 0 1 3.75 17.25V6.75Z"
        fill="currentColor"
        opacity="0.9"
      />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M7 2.75a.75.75 0 0 1 .75.75v1h8.5v-1a.75.75 0 0 1 1.5 0v1H19A2.25 2.25 0 0 1 21.25 6.5v12A2.25 2.25 0 0 1 19 20.75H5A2.25 2.25 0 0 1 2.75 18.5v-12A2.25 2.25 0 0 1 5 4.5h1.25v-1A.75.75 0 0 1 7 2.75Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M4.5 9.25h15"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.55"
      />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M12 8.25A3.75 3.75 0 1 0 12 15.75 3.75 3.75 0 0 0 12 8.25Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M19.4 12a7.43 7.43 0 0 0-.06-.94l1.73-1.34a.75.75 0 0 0 .17-.96l-1.64-2.83a.75.75 0 0 0-.92-.33l-2.04.82a7.7 7.7 0 0 0-1.63-.94l-.3-2.16a.75.75 0 0 0-.75-.64h-3.28a.75.75 0 0 0-.75.64l-.3 2.16c-.57.23-1.12.54-1.63.94l-2.04-.82a.75.75 0 0 0-.92.33L2.76 8.76a.75.75 0 0 0 .17.96l1.73 1.34a7.43 7.43 0 0 0 0 1.88l-1.73 1.34a.75.75 0 0 0-.17.96l1.64 2.83c.2.35.62.49.99.33l1.97-.8c.5.39 1.05.7 1.63.93l.3 2.16c.05.38.37.64.75.64h3.28c.38 0 .7-.26.75-.64l.3-2.16c.58-.23 1.13-.54 1.63-.93l1.97.8c.37.16.79.02.99-.33l1.64-2.83a.75.75 0 0 0-.17-.96l-1.73-1.34c.04-.31.06-.62.06-.94Z"
        fill="currentColor"
        opacity="0.55"
      />
    </svg>
  );
}
