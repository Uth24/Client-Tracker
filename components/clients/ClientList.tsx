"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Client } from "@/lib/types/clients";
import { ClientDetailModal } from "@/components/clients/ClientDetailModal";
import { ClientFormModal } from "@/components/clients/ClientFormModal";

type Props = {
  initialClients: Client[];
};

function shortText(text: string | null, max = 60) {
  if (!text?.trim()) return "—";
  const t = text.trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

function formatLocation(c: Client) {
  const parts = [c.city, c.state, c.zip_code].filter((x) => x?.trim());
  return parts.length > 0 ? parts.join(", ") : "—";
}

export function ClientList({ initialClients }: Props) {
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [search, setSearch] = useState("");
  const [detailClient, setDetailClient] = useState<Client | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);

  useEffect(() => {
    setClients(initialClients);
  }, [initialClients]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => {
      const name = c.name.toLowerCase();
      const email = (c.email ?? "").toLowerCase();
      const phone = (c.phone ?? "").toLowerCase();
      const address = [
        c.address_line1,
        c.address_line2,
        c.city,
        c.state,
        c.zip_code,
      ]
        .filter((x) => x?.trim())
        .join(" ")
        .toLowerCase();
      const notes = (c.notes ?? "").toLowerCase();
      return [name, email, phone, address, notes].some((t) => t.includes(q));
    });
  }, [clients, search]);

  async function handleDelete(c: Client) {
    if (!confirm(`Delete client "${c.name}"? This cannot be undone.`)) return;
    const supabase = createClient();
    const { error } = await supabase.from("clients").delete().eq("id", c.id);
    if (error) {
      alert(error.message);
      return;
    }
    setClients((prev) => prev.filter((x) => x.id !== c.id));
    if (detailClient?.id === c.id) setDetailClient(null);
    if (editClient?.id === c.id) setEditClient(null);
    router.refresh();
  }

  function refreshFromServer() {
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <label htmlFor="client-search" className="sr-only">
            Search clients
          </label>
          <input
            id="client-search"
            type="search"
            placeholder="Search by name, email, phone, address, or notes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 pl-9 text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
            ⌕
          </span>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Add client
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-800/50">
              <tr>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                  Name
                </th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                  Email / phone
                </th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                  Location
                </th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-zinc-500"
                  >
                    {clients.length === 0
                      ? "No clients yet. Add one to get started."
                      : "No clients match your search."}
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                    onClick={() => setDetailClient(c)}
                  >
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                      {c.name}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      <div className="truncate">
                        {c.email?.trim() ? c.email : "—"}
                      </div>
                      <div className="truncate text-xs text-zinc-500">
                        {c.phone?.trim() ? c.phone : "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {formatLocation(c)}
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className="flex flex-wrap gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => setEditClient(c)}
                          className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c)}
                          className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ClientDetailModal
        client={detailClient}
        open={detailClient !== null}
        onClose={() => setDetailClient(null)}
      />

      <ClientFormModal
        key="client-form-add"
        mode="add"
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={refreshFromServer}
      />

      <ClientFormModal
        key={editClient ? `client-form-edit-${editClient.id}` : "client-form-edit-idle"}
        mode="edit"
        client={editClient}
        open={editClient !== null}
        onClose={() => setEditClient(null)}
        onSaved={refreshFromServer}
      />
    </div>
  );
}

