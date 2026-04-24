"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Vendor } from "@/lib/types/vendors";
import { VendorDetailModal } from "@/components/vendors/VendorDetailModal";
import { VendorFormModal } from "@/components/vendors/VendorFormModal";

function shortDescription(text: string | null, max = 80) {
  if (!text?.trim()) return "—";
  const t = text.trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

type Props = {
  initialVendors: Vendor[];
};

export function VendorList({ initialVendors }: Props) {
  const router = useRouter();
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [search, setSearch] = useState("");
  const [detailVendor, setDetailVendor] = useState<Vendor | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);

  useEffect(() => {
    setVendors(initialVendors);
  }, [initialVendors]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return vendors;
    return vendors.filter((v) => {
      const name = v.name.toLowerCase();
      const type = (v.type ?? "").toLowerCase();
      const description = (v.description ?? "").toLowerCase();
      return (
        name.includes(q) ||
        type.includes(q) ||
        description.includes(q)
      );
    });
  }, [vendors, search]);

  async function handleDelete(v: Vendor) {
    if (
      !confirm(
        `Delete vendor "${v.name}"? This cannot be undone (images rows cascade).`,
      )
    ) {
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.from("vendors").delete().eq("id", v.id);
    if (error) {
      alert(error.message);
      return;
    }
    setVendors((prev) => prev.filter((x) => x.id !== v.id));
    if (detailVendor?.id === v.id) setDetailVendor(null);
    if (editVendor?.id === v.id) setEditVendor(null);
    router.refresh();
  }

  function refreshFromServer() {
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <label htmlFor="vendor-search" className="sr-only">
            Search vendors
          </label>
          <input
            id="vendor-search"
            type="search"
            placeholder="Search by name, type, or description…"
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
          Add vendor
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm ring-1 ring-zinc-100">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Name
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Type
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Description
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
                    {vendors.length === 0
                      ? "No vendors yet. Add one to get started."
                      : "No vendors match your search."}
                  </td>
                </tr>
              ) : (
                filtered.map((v) => (
                  <tr
                    key={v.id}
                    className="cursor-pointer hover:bg-sky-50/60"
                    onClick={() => setDetailVendor(v)}
                  >
                    <td className="px-4 py-3 font-semibold text-zinc-900">
                      {v.name}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      {v.type?.trim() ? (
                        <span className="inline-flex items-center rounded-full bg-sky-600/10 px-2 py-0.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
                          {v.type}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-zinc-600">
                      {shortDescription(v.description)}
                    </td>
                    <td className="px-4 py-3">
                      <div
                        className="flex flex-wrap gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => setEditVendor(v)}
                          className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(v)}
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

      <VendorDetailModal
        vendor={detailVendor}
        open={detailVendor !== null}
        onClose={() => setDetailVendor(null)}
      />

      <VendorFormModal
        key="vendor-form-add"
        mode="add"
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={refreshFromServer}
      />

      <VendorFormModal
        key={editVendor ? `vendor-form-edit-${editVendor.id}` : "vendor-form-edit-idle"}
        mode="edit"
        vendor={editVendor}
        open={editVendor !== null}
        onClose={() => setEditVendor(null)}
        onSaved={refreshFromServer}
      />
    </div>
  );
}
