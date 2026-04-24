import { createClient } from "@/lib/supabase/server";
import { JobList } from "@/components/jobs/JobList";
import type { Client } from "@/lib/types/clients";
import type { Job } from "@/lib/types/jobs";
import type { Vendor } from "@/lib/types/vendors";

export default async function ProjectsPage() {
  const supabase = await createClient();

  // Avoid embedded relationship selects here (e.g. `clients(*)`) because Supabase/PostgREST
  // can temporarily fail to resolve newly-added FKs in its schema cache. We can still
  // ship an end-to-end experience by fetching each table and joining in code.
  const [
    { data: jobsData, error: jobsError },
    { data: clientsData, error: clientsError },
    { data: vendorsData, error: vendorsError },
  ] = await Promise.all([
    supabase
      .from("jobs")
      .select("*")
      .order("scheduled_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase.from("clients").select("*").order("created_at", { ascending: false }),
    supabase.from("vendors").select("*").order("created_at", { ascending: false }),
  ]);

  const loadError = jobsError ?? clientsError ?? vendorsError;
  if (loadError) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Projects
        </h1>
        <p className="mt-2 text-red-600 dark:text-red-400">
          Could not load projects: {loadError.message}
        </p>
      </div>
    );
  }

  const clients = (clientsData ?? []) as Client[];
  const vendors = (vendorsData ?? []) as Vendor[];
  const clientsById = new Map(clients.map((c) => [c.id, c]));
  const vendorsById = new Map(vendors.map((v) => [v.id, v]));
  const jobs = ((jobsData ?? []) as Job[]).map((j) => ({
    ...j,
    clients: clientsById.get(j.client_id) ?? null,
    vendors: vendorsById.get(j.vendor_id) ?? null,
  }));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Projects
      </h1>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">
        Track work vendors are doing for clients. Create a job to connect a client
        to a vendor.
      </p>
      <div className="mt-8">
        <JobList initialJobs={jobs} clients={clients} vendors={vendors} />
      </div>
    </div>
  );
}
