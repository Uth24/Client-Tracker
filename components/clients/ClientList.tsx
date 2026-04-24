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
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 pl-9 text-zinc-900 shadow-sm outline-none ring-1 ring-zinc-100 focus:ring-2 focus:ring-sky-200"
          />
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
            ⌕
          </span>
        </div>
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="shrink-0 rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-200"
        >
          Add client
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm ring-1 ring-zinc-100">
        {/* Mobile: card list (no horizontal swipe needed). */}
        <div className="divide-y divide-zinc-100 sm:hidden">
          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center text-zinc-500">
              {clients.length === 0
                ? "No clients yet. Add one to get started."
                : "No clients match your search."}
            </div>
          ) : (
            filtered.map((c) => (
              <div
                key={c.id}
                className="cursor-pointer p-4 hover:bg-sky-50/60"
                onClick={() => setDetailClient(c)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-zinc-900">
                      {c.name}
                    </div>
                    <div className="mt-1 space-y-0.5 text-xs text-zinc-600">
                      <div className="truncate">
                        {c.email?.trim() ? c.email : "—"}
                      </div>
                      <div className="truncate text-zinc-500">
                        {c.phone?.trim() ? c.phone : "—"}
                      </div>
                      <div className="truncate text-zinc-500">
                        {formatLocation(c)}
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className="mt-3 flex flex-col gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => setEditClient(c)}
                    className="w-full rounded-lg bg-white px-3 py-2 text-sm font-semibold text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(c)}
                    className="w-full rounded-lg bg-white px-3 py-2 text-sm font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop/tablet: table view. */}
        <div className="hidden overflow-x-auto sm:block">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Name
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Email / phone
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Location
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
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
                    className="cursor-pointer hover:bg-sky-50/60"
                    onClick={() => setDetailClient(c)}
                  >
                    <td className="px-4 py-3 font-semibold text-zinc-900">
                      {c.name}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-zinc-600">
                      <div className="truncate">
                        {c.email?.trim() ? c.email : "—"}
                      </div>
                      <div className="truncate text-xs text-zinc-500">
                        {c.phone?.trim() ? c.phone : "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
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
                          className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c)}
                          className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-50"
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

