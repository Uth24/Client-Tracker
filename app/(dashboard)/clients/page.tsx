import { createClient } from "@/lib/supabase/server";
import { ClientList } from "@/components/clients/ClientList";
import type { Client } from "@/lib/types/clients";

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Clients</h1>
        <p className="mt-2 text-red-600">
          Could not load clients: {error.message}
        </p>
      </div>
    );
  }

  const clients = (data ?? []) as Client[];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900">Clients</h1>
      <p className="mt-1 text-zinc-600">
        Create and manage the people hiring your vendors.
      </p>
      <div className="mt-8">
        <ClientList initialClients={clients} />
      </div>
    </div>
  );
}

