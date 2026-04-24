import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Job } from "@/lib/types/jobs";
import type { Client } from "@/lib/types/clients";
import type { Vendor } from "@/lib/types/vendors";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName =
    (user?.user_metadata &&
    typeof (user.user_metadata as Record<string, unknown>).full_name === "string"
      ? String((user.user_metadata as Record<string, unknown>).full_name)
      : "") ||
    (user?.email ? user.email.split("@")[0] : "there");

  const [
    clientsCountRes,
    vendorsCountRes,
    jobsPendingRes,
    jobsInProcessRes,
    jobsOnHoldRes,
    jobsFinishedRes,
    recentJobsRes,
  ] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase.from("vendors").select("id", { count: "exact", head: true }),
    supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("status", "planned"),
    supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("status", "in_progress"),
    supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("status", "on_hold"),
    supabase
      .from("jobs")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed"),
    supabase
      .from("jobs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  const anyErr =
    clientsCountRes.error ??
    vendorsCountRes.error ??
    jobsPendingRes.error ??
    jobsInProcessRes.error ??
    jobsOnHoldRes.error ??
    jobsFinishedRes.error ??
    recentJobsRes.error;

  // If RLS isn't configured for SELECT, show a helpful message instead of a broken dashboard.
  if (anyErr) {
    return (
      <div className="mx-auto max-w-6xl">
        <p className="text-sm text-zinc-500">Client Track</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
          Dashboard
        </h1>
        <div className="mt-6 rounded-3xl bg-white p-5 ring-1 ring-zinc-200 sm:p-6">
          <p className="text-sm font-semibold text-zinc-900">
            Could not load dashboard data
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            {anyErr.message}
          </p>
          <p className="mt-3 text-sm text-zinc-600">
            If this is a Row Level Security issue, ensure you have SELECT policies
            on <span className="font-semibold text-zinc-800">clients</span>,{" "}
            <span className="font-semibold text-zinc-800">vendors</span>, and{" "}
            <span className="font-semibold text-zinc-800">jobs</span> for
            authenticated users.
          </p>
        </div>
      </div>
    );
  }

  const clientsCount = clientsCountRes.count ?? 0;
  const vendorsCount = vendorsCountRes.count ?? 0;
  const pendingCount = jobsPendingRes.count ?? 0;
  const inProcessCount = jobsInProcessRes.count ?? 0;
  const onHoldCount = jobsOnHoldRes.count ?? 0;
  const finishedCount = jobsFinishedRes.count ?? 0;
  const activeProjects = inProcessCount + onHoldCount;

  const recentJobs = (recentJobsRes.data ?? []) as Job[];
  const clientIds = Array.from(new Set(recentJobs.map((j) => j.client_id)));
  const vendorIds = Array.from(new Set(recentJobs.map((j) => j.vendor_id)));

  const [{ data: recentClients }, { data: recentVendors }] = await Promise.all([
    clientIds.length
      ? supabase.from("clients").select("*").in("id", clientIds)
      : Promise.resolve({ data: [] as unknown[] }),
    vendorIds.length
      ? supabase.from("vendors").select("*").in("id", vendorIds)
      : Promise.resolve({ data: [] as unknown[] }),
  ]);

  const clientsById = new Map(((recentClients ?? []) as Client[]).map((c) => [c.id, c]));
  const vendorsById = new Map(((recentVendors ?? []) as Vendor[]).map((v) => [v.id, v]));
  const recentActivity = recentJobs.map((j) => ({
    ...j,
    clients: clientsById.get(j.client_id) ?? null,
    vendors: vendorsById.get(j.vendor_id) ?? null,
  }));

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-zinc-500">Client Track</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-700">
            Welcome back, <span className="font-semibold">{displayName}</span>.
          </p>
          <p className="mt-1 text-sm text-zinc-600">
            Quick overview of your clients, vendors, and projects.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-800 ring-1 ring-zinc-200 hover:bg-zinc-50">
            Last 30 days
          </button>
          <Link
            href="/projects"
            className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700"
          >
            View projects
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Clients"
          value={String(clientsCount)}
          hint="People hiring vendors"
          tone="blue"
        />
        <StatCard
          label="Vendors"
          value={String(vendorsCount)}
          hint="Service providers"
          tone="blue"
        />
        <StatCard
          label="Active projects"
          value={String(activeProjects)}
          hint="In process / on hold"
          tone="blue"
        />
        <StatCard
          label="Finished"
          value={String(finishedCount)}
          hint="Completed jobs"
          tone="blue"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel title="Recent activity">
          {recentActivity.length === 0 ? (
            <p className="text-sm text-zinc-600">
              No activity yet. Create a client, add a vendor, and make your first
              project.
            </p>
          ) : (
            <div className="space-y-3">
              {recentActivity.map((j) => (
                <ActivityRow
                  key={j.id}
                  title={j.title?.trim() ? j.title : "New project"}
                  subtitle={`${j.clients?.name ?? "Client"} → ${j.vendors?.name ?? "Vendor"} • ${formatDate(j.created_at)}`}
                  pill={j.status ?? "planned"}
                />
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Tips">
          <div className="space-y-3 text-sm text-zinc-600">
            <p>
              Use the <span className="font-semibold text-zinc-800">Projects</span>{" "}
              board to move jobs through your workflow.
            </p>
            <p>
              Keep client contact + address fields filled so vendors can work faster.
            </p>
            <Link
              href="/clients"
              className="mt-2 block w-full rounded-xl bg-white px-4 py-2 text-center text-sm font-semibold text-zinc-800 ring-1 ring-zinc-200 hover:bg-zinc-50"
            >
              Add a client
            </Link>
          </div>
        </Panel>

        <Panel title="Summary">
          <div className="space-y-2 text-sm text-zinc-600">
            <SummaryRow label="Pending" value={String(pendingCount)} />
            <SummaryRow label="In process" value={String(inProcessCount)} />
            <SummaryRow label="On hold" value={String(onHoldCount)} />
            <SummaryRow label="Finished" value={String(finishedCount)} />
          </div>
        </Panel>
      </div>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl bg-white p-5 ring-1 ring-zinc-200 sm:p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-zinc-900">{title}</p>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function StatCard({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "blue";
}) {
  const accent =
    tone === "blue" ? "bg-sky-600/10 text-sky-700 ring-sky-200" : "bg-zinc-100";
  return (
    <div className="rounded-3xl bg-white p-5 ring-1 ring-zinc-200">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.18em] text-zinc-500">
            {label.toUpperCase()}
          </p>
          <p className="mt-2 text-3xl font-semibold tracking-tight text-zinc-900">
            {value}
          </p>
          <p className="mt-1 text-sm text-zinc-600">{hint}</p>
        </div>
        <span className={`rounded-2xl px-3 py-2 text-xs font-semibold ring-1 ${accent}`}>
          {label}
        </span>
      </div>
    </div>
  );
}

function ActivityRow({
  title,
  subtitle,
  pill,
}: {
  title: string;
  subtitle: string;
  pill?: string;
}) {
  const chip =
    pill === "completed"
      ? "bg-emerald-600/10 text-emerald-700 ring-emerald-200"
      : pill === "in_progress"
        ? "bg-sky-600/10 text-sky-700 ring-sky-200"
        : pill === "on_hold"
          ? "bg-rose-600/10 text-rose-700 ring-rose-200"
          : "bg-zinc-700/5 text-zinc-700 ring-zinc-200";
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl bg-zinc-50 px-4 py-3 ring-1 ring-zinc-200">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-zinc-900">{title}</p>
        <p className="mt-0.5 text-sm text-zinc-600">{subtitle}</p>
      </div>
      {pill ? (
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${chip}`}>
          {pill}
        </span>
      ) : null}
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-zinc-50 px-4 py-3 ring-1 ring-zinc-200">
      <span className="text-sm font-medium text-zinc-800">{label}</span>
      <span className="text-sm font-semibold text-zinc-900">{value}</span>
    </div>
  );
}
