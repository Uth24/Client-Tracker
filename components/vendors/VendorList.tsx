"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { TABLE_PAGE_SIZE } from "@/lib/pagination-constants";
import { normalizeTableSearchQ } from "@/lib/search-query";
import { fetchVendorListPage } from "@/lib/vendors/fetch-vendor-list-page";
import { TablePagination } from "@/components/ui/TablePagination";
import {
  VENDOR_RELATIONSHIP_LABEL,
  type Vendor,
  type VendorRelationshipStatus,
} from "@/lib/types/vendors";
import { VendorDetailModal } from "@/components/vendors/VendorDetailModal";
import {
  VendorFormModal,
  type VendorFormSavePayload,
} from "@/components/vendors/VendorFormModal";
import { VendorPartnershipSegmented } from "@/components/vendors/VendorPartnershipSegmented";

function relationshipBadgeClass(rel: VendorRelationshipStatus | null) {
  switch (rel ?? "havent_worked_with") {
    case "worked_with":
      return "bg-emerald-600/10 text-emerald-800 ring-emerald-200";
    case "not_working_with":
      return "bg-zinc-500/10 text-zinc-700 ring-zinc-300";
    default:
      return "bg-amber-600/10 text-amber-900 ring-amber-200";
  }
}

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
  relationship: VendorRelationshipStatus;
};

export function VendorList({
  initialVendors,
  page,
  totalCount,
  searchQ,
  relationship,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [vendors, setVendors] = useState<Vendor[]>(initialVendors);
  const [search, setSearch] = useState(searchQ);
  const [detailVendor, setDetailVendor] = useState<Vendor | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [activeRelationship, setActiveRelationship] =
    useState<VendorRelationshipStatus>(relationship);
  const [listPage, setListPage] = useState(page);
  const [clientTotal, setClientTotal] = useState(totalCount);
  const [listLoading, setListLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const debouncedSearch = useDebouncedValue(search, 400);
  const highlightId = searchParams.get("highlight");
  const partnershipTabFetchSeq = useRef(0);
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setVendors(initialVendors);
  }, [initialVendors]);

  useEffect(() => {
    setSelectedIds(new Set());
  }, [initialVendors]);

  useEffect(() => {
    setSearch(searchQ);
  }, [searchQ]);

  useEffect(() => {
    setActiveRelationship(relationship);
  }, [relationship]);

  useEffect(() => {
    setListPage(page);
  }, [initialVendors, page]);

  useEffect(() => {
    setClientTotal(totalCount);
  }, [totalCount]);

  useEffect(() => {
    const next = debouncedSearch.trim();
    if (next === (searchQ ?? "")) return;
    const p = new URLSearchParams();
    if (next) p.set("q", next);
    p.set("relationship", activeRelationship);
    p.set("page", "1");
    router.push(`${pathname}?${p.toString()}`);
  }, [debouncedSearch, searchQ, pathname, router, activeRelationship]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 5200);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!highlightId) return;
    const raf = requestAnimationFrame(() => {
      const el = document.querySelector(
        `[data-vendor-highlight="${CSS.escape(highlightId)}"]`,
      );
      el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    });
    return () => cancelAnimationFrame(raf);
  }, [highlightId, vendors]);

  useEffect(() => {
    if (!highlightId) return;
    const t = setTimeout(() => {
      const p = new URLSearchParams(window.location.search);
      p.delete("highlight");
      const qs = p.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 3400);
    return () => clearTimeout(t);
  }, [highlightId, pathname, router]);

  const selectedOnPageCount = vendors.filter((v) => selectedIds.has(v.id))
    .length;
  const allOnPageSelected =
    vendors.length > 0 && selectedOnPageCount === vendors.length;
  const someOnPageSelected =
    selectedOnPageCount > 0 && !allOnPageSelected;

  useEffect(() => {
    const el = selectAllCheckboxRef.current;
    if (el) el.indeterminate = someOnPageSelected;
  }, [someOnPageSelected, vendors.length]);

  function toggleVendorSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllOnPage() {
    if (vendors.length === 0) return;
    if (allOnPageSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(vendors.map((v) => v.id)));
  }

  async function handleBulkDelete() {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    if (
      !confirm(
        `Delete ${ids.length} vendor${ids.length === 1 ? "" : "s"}? This cannot be undone (images rows cascade).`,
      )
    ) {
      return;
    }
    const supabase = createClient();
    const { error } = await supabase.from("vendors").delete().in("id", ids);
    if (error) {
      alert(error.message);
      return;
    }
    setVendors((prev) => prev.filter((x) => !ids.includes(x.id)));
    setClientTotal((c) => Math.max(0, c - ids.length));
    setSelectedIds(new Set());
    if (detailVendor && ids.includes(detailVendor.id)) setDetailVendor(null);
    if (editVendor && ids.includes(editVendor.id)) setEditVendor(null);
    router.refresh();
  }

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
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(v.id);
      return next;
    });
    if (detailVendor?.id === v.id) setDetailVendor(null);
    if (editVendor?.id === v.id) setEditVendor(null);
    router.refresh();
  }

  function navigateToVendorPartnershipTab(
    vendor: Vendor,
    toastMessage: string,
  ) {
    const rel = vendor.relationship_status ?? "havent_worked_with";
    setActiveRelationship(rel);
    setListPage(1);
    setListLoading(true);
    void (async () => {
      const supabase = createClient();
      const { vendors: rows, total, error } = await fetchVendorListPage(
        supabase,
        { relationship: rel, q: search, page: 1 },
      );
      setListLoading(false);
      if (!error) {
        setVendors(rows);
        setClientTotal(total);
        setSelectedIds(new Set());
      }
    })();

    const p = new URLSearchParams();
    const qNorm = normalizeTableSearchQ(search.trim());
    if (qNorm) p.set("q", qNorm);
    p.set("relationship", rel);
    p.set("page", "1");
    p.set("highlight", vendor.id);
    setToast(toastMessage);
    router.push(`${pathname}?${p.toString()}`);
  }

  async function handlePartnershipTabChange(rel: VendorRelationshipStatus) {
    if (rel === activeRelationship) return;
    const seq = ++partnershipTabFetchSeq.current;
    setActiveRelationship(rel);
    setListPage(1);
    setListLoading(true);

    const supabase = createClient();
    const { vendors: rows, total, error } = await fetchVendorListPage(
      supabase,
      { relationship: rel, q: search, page: 1 },
    );

    if (seq !== partnershipTabFetchSeq.current) return;

    setListLoading(false);
    if (error) {
      setActiveRelationship(relationship);
      alert(error.message);
      router.refresh();
      return;
    }

    setVendors(rows);
    setClientTotal(total);
    setSelectedIds(new Set());

    const p = new URLSearchParams();
    const qNorm = normalizeTableSearchQ(search.trim());
    if (qNorm) p.set("q", qNorm);
    p.set("relationship", rel);
    p.set("page", "1");
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  }

  function handleVendorSaved(payload: VendorFormSavePayload) {
    if (payload.mode === "edit") {
      if (payload.partnershipStatusChanged) {
        const rel =
          payload.vendor.relationship_status ?? "havent_worked_with";
        navigateToVendorPartnershipTab(
          payload.vendor,
          `Partnership Status updated — now under "${VENDOR_RELATIONSHIP_LABEL[rel]}".`,
        );
      } else {
        router.refresh();
      }
      return;
    }
    const { vendor } = payload;
    const rel = vendor.relationship_status ?? "havent_worked_with";
    navigateToVendorPartnershipTab(
      vendor,
      `Vendor added to "${VENDOR_RELATIONSHIP_LABEL[rel]}".`,
    );
  }

  return (
    <div className="space-y-6">
      {toast ? (
        <div
          className="fixed left-1/2 top-6 z-[60] w-[min(calc(100vw-1.5rem),28rem)] -translate-x-1/2 rounded-2xl border border-emerald-300/70 bg-emerald-50 px-6 py-4 text-center text-base font-semibold leading-snug text-emerald-950 shadow-xl shadow-emerald-900/15 ring-1 ring-emerald-200/90 sm:top-10 sm:px-10 sm:py-5 sm:text-lg"
          role="status"
          aria-live="polite"
        >
          {toast}
        </div>
      ) : null}

      <VendorPartnershipSegmented
        hideLegend
        value={activeRelationship}
        onChange={handlePartnershipTabChange}
        ariaLabel="Partnership Status filters"
        disabled={listLoading}
      />

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
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-200"
          >
            Add vendor
          </button>
        </div>
      </div>

      {selectedIds.size > 0 ? (
        <div
          className="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50/90 px-4 py-3 ring-1 ring-red-100 sm:flex-row sm:items-center sm:justify-between"
          role="region"
          aria-label="Bulk actions"
        >
          <p className="text-sm font-semibold text-red-950">
            {selectedIds.size} vendor{selectedIds.size === 1 ? "" : "s"} selected
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="rounded-lg bg-white px-3 py-2 text-sm font-semibold text-zinc-800 ring-1 ring-zinc-200 hover:bg-zinc-50"
            >
              Clear selection
            </button>
            <button
              type="button"
              onClick={() => void handleBulkDelete()}
              className="rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
            >
              Delete selected
            </button>
          </div>
        </div>
      ) : null}

      <div
        className={`relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm ring-1 ring-zinc-100 transition-opacity ${listLoading ? "opacity-60" : "opacity-100"}`}
      >
        {/* Mobile: card list (actions always visible). */}
        <div className="divide-y divide-zinc-100 sm:hidden">
          {vendors.length > 0 ? (
            <div className="flex items-center gap-3 border-b border-zinc-100 bg-zinc-50/80 px-4 py-2.5">
              <input
                type="checkbox"
                checked={allOnPageSelected}
                onChange={toggleSelectAllOnPage}
                aria-label="Select all vendors on this page"
                className="h-4 w-4 shrink-0 rounded border-zinc-300 text-sky-600 focus:ring-sky-500"
                ref={(el) => {
                  if (el) el.indeterminate = someOnPageSelected;
                }}
              />
              <span className="text-xs font-semibold text-zinc-600">
                Select all on this page
              </span>
            </div>
          ) : null}
          {vendors.length === 0 ? (
            <div className="px-4 py-10 text-center text-zinc-500">
              {clientTotal === 0
                ? searchQ
                  ? "No vendors match your search."
                  : "No vendors yet. Add one to get started."
                : "No vendors on this page."}
            </div>
          ) : (
            vendors.map((v) => (
              <div
                key={v.id}
                data-vendor-highlight={v.id}
                className={`hover:bg-sky-50/60 ${
                  highlightId === v.id ? "vendor-added-highlight" : ""
                }`}
              >
                <div className="flex gap-3 p-4">
                  <div
                    className="flex shrink-0 items-start pt-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(v.id)}
                      onChange={() => toggleVendorSelected(v.id)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Select ${v.name}`}
                      className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500"
                    />
                  </div>
                  <div
                    className="min-w-0 flex-1 cursor-pointer"
                    onClick={() => setDetailVendor(v)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setDetailVendor(v);
                      }
                    }}
                  >
                  <div className="truncate text-sm font-semibold text-zinc-900">
                    {v.name}
                  </div>
                  <div className="mt-1">
                    <span
                      className={`inline-flex max-w-full items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${relationshipBadgeClass(
                        v.relationship_status ?? null,
                      )}`}
                    >
                      {
                        VENDOR_RELATIONSHIP_LABEL[
                          v.relationship_status ?? "havent_worked_with"
                        ]
                      }
                    </span>
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
                </div>

                <div
                  className="flex flex-col gap-2 border-t border-zinc-100 px-4 pb-4 pt-3"
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
                <th className="w-12 px-3 py-3">
                  <span className="sr-only">Select all on this page</span>
                  <input
                    ref={selectAllCheckboxRef}
                    type="checkbox"
                    checked={allOnPageSelected}
                    onChange={toggleSelectAllOnPage}
                    disabled={vendors.length === 0}
                    aria-label="Select all vendors on this page"
                    className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500 disabled:opacity-40"
                  />
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Name
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-600">
                  Partnership Status
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
                    colSpan={6}
                    className="px-4 py-10 text-center text-zinc-500"
                  >
                    {clientTotal === 0
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
                    data-vendor-highlight={v.id}
                    className={`cursor-pointer hover:bg-sky-50/60 ${
                      highlightId === v.id ? "vendor-added-highlight" : ""
                    }`}
                    onClick={() => setDetailVendor(v)}
                  >
                    <td
                      className="w-12 px-3 py-3"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(v.id)}
                        onChange={() => toggleVendorSelected(v.id)}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Select ${v.name}`}
                        className="h-4 w-4 rounded border-zinc-300 text-sky-600 focus:ring-sky-500"
                      />
                    </td>
                    <td className="px-4 py-3 font-semibold text-zinc-900">
                      {v.name}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ring-1 ${relationshipBadgeClass(
                          v.relationship_status ?? null,
                        )}`}
                      >
                        {
                          VENDOR_RELATIONSHIP_LABEL[
                            v.relationship_status ?? "havent_worked_with"
                          ]
                        }
                      </span>
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
          page={listPage}
          pageSize={TABLE_PAGE_SIZE}
          total={clientTotal}
          buildPageHref={(p) => {
            const n = new URLSearchParams();
            const qNorm = normalizeTableSearchQ(search.trim());
            if (qNorm) n.set("q", qNorm);
            n.set("relationship", activeRelationship);
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
        onSaved={handleVendorSaved}
      />

      <VendorFormModal
        key={
          editVendor
            ? `vendor-form-edit-${editVendor.id}`
            : "vendor-form-edit-idle"
        }
        mode="edit"
        vendor={editVendor}
        open={editVendor !== null}
        onClose={() => setEditVendor(null)}
        onSaved={handleVendorSaved}
      />
    </div>
  );
}
