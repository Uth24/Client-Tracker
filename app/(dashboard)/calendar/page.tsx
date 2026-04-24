import { createClient } from "@/lib/supabase/server";
import type { Client } from "@/lib/types/clients";
import type { Job } from "@/lib/types/jobs";
import type { Vendor } from "@/lib/types/vendors";
import { CalendarBoard } from "@/components/calendar/CalendarBoard";

export default async function CalendarPage() {
  const supabase = await createClient();

  const [
    { data: jobsData, error: jobsError },
    { data: clientsData, error: clientsError },
    { data: vendorsData, error: vendorsError },
  ] = await Promise.all([
    supabase.from("jobs").select("*").order("created_at", { ascending: false }),
    supabase.from("clients").select("*").order("created_at", { ascending: false }),
    supabase.from("vendors").select("*").order("created_at", { ascending: false }),
  ]);

  const loadError = jobsError ?? clientsError ?? vendorsError;
  if (loadError) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Calendar</h1>
        <p className="mt-2 text-red-600">Could not load calendar: {loadError.message}</p>
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
      <h1 className="text-2xl font-semibold text-zinc-900">Calendar</h1>
      <p className="mt-1 text-zinc-600">
        A time-based view of your projects, using scheduled dates.
      </p>
      <div className="mt-8">
        <CalendarBoard initialJobs={jobs} />
      </div>
    </div>
  );
}
