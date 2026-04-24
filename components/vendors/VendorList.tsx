"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { TABLE_PAGE_SIZE } from "@/lib/pagination-constants";
import { TablePagination } from "@/components/ui/TablePagination";
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
  page: number;
  totalCount: number;
  searchQ: string;
};

export function VendorList({
  initialVendors,
  page,
  totalCount,
  searchQ,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [search, setSearch] = useState(searchQ);
  const [detailVendor, setDetailVendor] = useState<Vendor | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const debouncedSearch = useDebouncedValue(search, 400);

  useEffect(() => {
    setVendors(initialVendors);
  }, [initialVendors]);

  useEffect(() => {
    setSearch(searchQ);
  }, [searchQ]);

  useEffect(() => {
    const next = debouncedSearch.trim();
    if (next === (searchQ ?? "")) return;
    const p = new URLSearchParams();
    if (next) p.set("q", next);
    p.set("page", "1");
    router.push(`${pathname}?${p.toString()}`);
  }, [debouncedSearch, searchQ, pathname, router]);

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
            onChange={(e) => {
              setSearch(e.target.value);
            }}
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
        {/* Mobile: card list (actions always visible). */}
        <div className="divide-y divide-zinc-100 sm:hidden">
          {vendors.length === 0 ? (
            <div className="px-4 py-10 text-center text-zinc-500">
              {totalCount === 0
                ? searchQ
                  ? "No vendors match your search."
                  : "No vendors yet. Add one to get started."
                : "No vendors on this page."}
            </div>
          ) : (
            vendors.map((v) => (
              <div
                key={v.id}
                className="cursor-pointer p-4 hover:bg-sky-50/60"
                onClick={() => setDetailVendor(v)}
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold text-zinc-900">
                    {v.name}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    {v.type?.trim() ? (
                      <span className="inline-flex items-center rounded-full bg-sky-600/10 px-2 py-0.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-200">
                        {v.type}
                      </span>
                    ) : (
                      <span className="text-xs text-zinc-500">—</span>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-zinc-600">
                    {shortDescription(v.description, 120)}
                  </div>
                </div>

                <div
                  className="mt-3 flex flex-col gap-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => setEditVendor(v)}
                    className="w-full rounded-lg bg-white px-3 py-2 text-sm font-semibold text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(v)}
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
              {vendors.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-zinc-500"
                  >
                    {totalCount === 0
                      ? searchQ
                        ? "No vendors match your search."
                        : "No vendors yet. Add one to get started."
                      : "No vendors on this page."}
                  </td>
                </tr>
              ) : (
                vendors.map((v) => (
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
        <TablePagination
          page={page}
          pageSize={TABLE_PAGE_SIZE}
          total={totalCount}
          buildPageHref={(p) => {
            const n = new URLSearchParams();
            if (searchParams.get("q")) n.set("q", searchParams.get("q")!);
            n.set("page", String(p));
            return `${pathname}?${n.toString()}`;
          }}
        />
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
