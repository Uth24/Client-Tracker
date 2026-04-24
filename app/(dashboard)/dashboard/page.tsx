export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-zinc-500">Client Track</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Quick overview of your clients, vendors, and projects.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-800 ring-1 ring-zinc-200 hover:bg-zinc-50">
            Last 30 days
          </button>
          <button className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800">
            Export
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Clients" value="—" hint="People hiring vendors" tone="blue" />
        <StatCard label="Vendors" value="—" hint="Service providers" tone="blue" />
        <StatCard label="Active projects" value="—" hint="In process / on hold" tone="blue" />
        <StatCard label="Finished" value="—" hint="Completed jobs" tone="blue" />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <Panel title="Recent activity">
          <div className="space-y-3">
            <ActivityRow title="Create a client" subtitle="Add homeowners and their details." />
            <ActivityRow title="Add a vendor" subtitle="List providers and their specialties." />
            <ActivityRow title="Create a project" subtitle="Connect a client to a vendor." />
          </div>
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
            <button className="mt-2 w-full rounded-xl bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800">
              View projects
            </button>
          </div>
        </Panel>

        <Panel title="Summary">
          <div className="space-y-2 text-sm text-zinc-600">
            <SummaryRow label="Pending" value="—" />
            <SummaryRow label="In process" value="—" />
            <SummaryRow label="On hold" value="—" />
            <SummaryRow label="Finished" value="—" />
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

function ActivityRow({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl bg-zinc-50 px-4 py-3 ring-1 ring-zinc-200">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-zinc-900">{title}</p>
        <p className="mt-0.5 text-sm text-zinc-600">{subtitle}</p>
      </div>
      <span className="shrink-0 rounded-full bg-sky-600/10 px-2.5 py-1 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
        new
      </span>
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
