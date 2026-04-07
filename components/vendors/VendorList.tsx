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
          Add vendor
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
                  Type
                </th>
                <th className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                  Description
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
                    {vendors.length === 0
                      ? "No vendors yet. Add one to get started."
                      : "No vendors match your search."}
                  </td>
                </tr>
              ) : (
                filtered.map((v) => (
                  <tr
                    key={v.id}
                    className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                    onClick={() => setDetailVendor(v)}
                  >
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                      {v.name}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {v.type?.trim() ? v.type : "—"}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-zinc-600 dark:text-zinc-400">
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
                          className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(v)}
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
