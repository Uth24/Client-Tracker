"use client";

import { SignOutButton } from "@/components/dashboard/SignOutButton";

export function SettingsSessionCard() {
  return (
    <section className="rounded-3xl bg-white p-6 ring-1 ring-zinc-200">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
        Session
      </h2>
      <p className="mt-2 text-sm text-zinc-600">
        Sign out on this device when you are finished.
      </p>
      <SignOutButton className="mt-4 w-full rounded-xl bg-zinc-900 px-4 py-3 text-center text-sm font-semibold text-white shadow-sm hover:bg-zinc-800 sm:w-auto" />
    </section>
  );
}
