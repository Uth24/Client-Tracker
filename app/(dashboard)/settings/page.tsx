import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DeleteConfirmationSettings } from "@/components/settings/DeleteConfirmationSettings";
import { SettingsSessionCard } from "@/components/settings/SettingsSessionCard";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const email = user.email ?? "";

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Settings
        </h1>
        <p className="mt-1 text-sm text-zinc-600">
          Account details and preferences for this workspace.
        </p>
      </div>

      <section className="rounded-3xl bg-white p-6 ring-1 ring-zinc-200">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Account
        </h2>
        <p className="mt-3 text-xs font-medium uppercase tracking-wide text-zinc-400">
          Email
        </p>
        <p className="mt-1 text-sm font-medium text-zinc-900">{email || "—"}</p>
      </section>

      <DeleteConfirmationSettings />

      <SettingsSessionCard />
    </div>
  );
}
