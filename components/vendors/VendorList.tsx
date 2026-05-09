"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useDebouncedValue } from "@/lib/hooks/use-debounced-value";
import { TABLE_PAGE_SIZE } from "@/lib/pagination-constants";
import { normalizeTableSearchQ } from "@/lib/search-query";
import { formatClientError } from "@/lib/format-error";
import { fetchVendorListPage } from "@/lib/vendors/fetch-vendor-list-page";
import type { WebsitePresenceFilter } from "@/lib/vendors/website-presence-filter";
import { TablePagination } from "@/components/ui/TablePagination";
import {
  VENDOR_RELATIONSHIP_LABEL,
  type Vendor,
  type VendorRelationshipListTab,
  type VendorRelationshipStatus,
  type VendorServiceOption,
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

function shortServiceLabels(v: Vendor, maxLabels = 4) {
  const labels =
    v.vendor_services
      ?.map((l) => l.vendor_service_options?.label?.trim())
      .filter((x): x is string => Boolean(x)) ?? [];
  if (labels.length === 0) return "—";
  const shown = labels.slice(0, maxLabels);
  const more =
    labels.length > maxLabels ? ` +${labels.length - maxLabels}` : "";
  return `${shown.join(", ")}${more}`;
}

function emptyVendorsBodyCopy(opts: {
  clientTotal: number;
  searchQ: string;
  serviceFilterActive: boolean;
  websiteFilterActive: boolean;
}) {
  if (opts.clientTotal > 0) return "No vendors on this page.";
  if (opts.searchQ) return "No vendors match your search.";
  if (opts.serviceFilterActive || opts.websiteFilterActive) {
    return "No vendors match these filters.";
  }
  return "No vendors yet. Add one to get started.";
}

function mergeOptionIntoCatalog(
  prev: VendorServiceOption[],
  opt: VendorServiceOption,
): VendorServiceOption[] {
  const map = new Map(prev.map((o) => [o.id, o]));
  map.set(opt.id, opt);
  return [...map.values()].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
  );
}

type Props = {
  initialVendors: Vendor[];
  page: number;
  totalCount: number;
  searchQ: string;
  relationship: VendorRelationshipListTab;
  /** Parsed from `services` URL param; vendors match any selected id (OR). */
  serviceFilterIds: string[];
  /** From `has_website=yes|no` URL param. */
  websiteFilter: WebsitePresenceFilter;
};

export function VendorList({
  initialVendors,
  page,
  totalCount,
  searchQ,
  relationship,
  serviceFilterIds,
  websiteFilter,
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
    useState<VendorRelationshipListTab>(relationship);
  const [listPage, setListPage] = useState(page);
  const [clientTotal, setClientTotal] = useState(totalCount);
  const [listLoading, setListLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const debouncedSearch = useDebouncedValue(search, 400);
  const highlightId = searchParams.get("highlight");
  const partnershipTabFetchSeq = useRef(0);
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);
  /** Latest service filter (sync); avoids stale `activeServiceFilter` when chips are clicked quickly. */
  const serviceFilterIntentRef = useRef<string[]>([...serviceFilterIds]);
  /** One fetch+navigate at a time; rapid chip clicks chain instead of overlapping. */
  const serviceFilterApplyChainRef = useRef<Promise<void>>(Promise.resolve());
  /**
   * Sorted identity string last written by our filter worker (or server on load).
   * Prevents the URL-sync effect from clobbering `serviceFilterIntentRef` while a
   * newer click is already queued ahead of an older `router.replace`.
   */
  const lastPushedServiceFilterIdentityRef = useRef<string>(
    [...serviceFilterIds].sort().join("|"),
  );
  const relationshipRef = useRef<VendorRelationshipListTab>(activeRelationship);
  const searchRef = useRef(search);
  const [activeWebsiteFilter, setActiveWebsiteFilter] =
    useState<WebsitePresenceFilter>(websiteFilter);
  const websitePresenceRef = useRef<WebsitePresenceFilter>(websiteFilter);

  const servicesIdentity = [...serviceFilterIds].sort().join("|");

  const [activeServiceFilter, setActiveServiceFilter] = useState<string[]>(
    () => [...serviceFilterIds],
  );
  const [serviceOptions, setServiceOptions] = useState<VendorServiceOption[]>(
    [],
  );
  const [serviceAddOpen, setServiceAddOpen] = useState(false);
  const [newCatalogServiceLabel, setNewCatalogServiceLabel] = useState("");
  const [addingCatalogService, setAddingCatalogService] = useState(false);
  const [serviceCatalogError, setServiceCatalogError] = useState<string | null>(
    null,
  );
  const newCatalogServiceInputRef = useRef<HTMLInputElement>(null);

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
    relationshipRef.current = activeRelationship;
  }, [activeRelationship]);

  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  useEffect(() => {
    setActiveWebsiteFilter(websiteFilter);
    websitePresenceRef.current = websiteFilter;
  }, [websiteFilter]);

  useEffect(() => {
    setListPage(page);
  }, [initialVendors, page]);

  useEffect(() => {
    setClientTotal(totalCount);
  }, [totalCount]);

  useEffect(() => {
    if (servicesIdentity === lastPushedServiceFilterIdentityRef.current) {
      return;
    }
    const fromUrl = servicesIdentity ? servicesIdentity.split("|") : [];
    lastPushedServiceFilterIdentityRef.current = servicesIdentity;
    setActiveServiceFilter(fromUrl);
    serviceFilterIntentRef.current = fromUrl;
  }, [servicesIdentity]);

  useEffect(() => {
    void (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from("vendor_service_options")
        .select("*")
        .eq("user_id", user.id)
        .order("label");
      if (!error && data) setServiceOptions(data as VendorServiceOption[]);
    })();
  }, []);

  useEffect(() => {
    if (!serviceAddOpen) return;
    const t = window.setTimeout(
      () => newCatalogServiceInputRef.current?.focus(),
      0,
    );
    return () => window.clearTimeout(t);
  }, [serviceAddOpen]);

  useEffect(() => {
    const next = debouncedSearch.trim();
    if (next === (searchQ ?? "")) return;
    const p = new URLSearchParams();
    if (next) p.set("q", next);
    p.set("relationship", activeRelationship);
    if (serviceFilterIntentRef.current.length > 0) {
      p.set("services", serviceFilterIntentRef.current.join(","));
    }
    if (activeWebsiteFilter !== "any") {
      p.set("has_website", activeWebsiteFilter === "yes" ? "yes" : "no");
    }
    p.set("page", "1");
    router.push(`${pathname}?${p.toString()}`);
  }, [
    debouncedSearch,
    searchQ,
    pathname,
    router,
    activeRelationship,
    activeWebsiteFilter,
  ]);

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
        {
          relationship: rel,
          q: search,
          page: 1,
          serviceOptionIds: serviceFilterIntentRef.current,
          websitePresence: websitePresenceRef.current,
        },
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
    if (serviceFilterIntentRef.current.length > 0) {
      p.set("services", serviceFilterIntentRef.current.join(","));
    }
    if (websitePresenceRef.current !== "any") {
      p.set(
        "has_website",
        websitePresenceRef.current === "yes" ? "yes" : "no",
      );
    }
    p.set("page", "1");
    p.set("highlight", vendor.id);
    setToast(toastMessage);
    router.push(`${pathname}?${p.toString()}`);
  }

  async function handlePartnershipTabChange(rel: VendorRelationshipListTab) {
    if (rel === activeRelationship) return;
    const seq = ++partnershipTabFetchSeq.current;
    setActiveRelationship(rel);
    setListPage(1);
    setListLoading(true);

    const supabase = createClient();
    const { vendors: rows, total, error } = await fetchVendorListPage(
      supabase,
      {
        relationship: rel,
        q: search,
        page: 1,
        serviceOptionIds: serviceFilterIntentRef.current,
        websitePresence: websitePresenceRef.current,
      },
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
    if (serviceFilterIntentRef.current.length > 0) {
      p.set("services", serviceFilterIntentRef.current.join(","));
    }
    if (websitePresenceRef.current !== "any") {
      p.set(
        "has_website",
        websitePresenceRef.current === "yes" ? "yes" : "no",
      );
    }
    p.set("page", "1");
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  }

  async function handleWebsitePresenceChange(next: WebsitePresenceFilter) {
    if (next === activeWebsiteFilter) return;
    websitePresenceRef.current = next;
    setActiveWebsiteFilter(next);
    setListPage(1);
    setListLoading(true);
    const supabase = createClient();
    const { vendors: rows, total, error } = await fetchVendorListPage(
      supabase,
      {
        relationship: activeRelationship,
        q: search,
        page: 1,
        serviceOptionIds: serviceFilterIntentRef.current,
        websitePresence: next,
      },
    );
    setListLoading(false);
    if (error) {
      websitePresenceRef.current = websiteFilter;
      setActiveWebsiteFilter(websiteFilter);
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
    p.set("relationship", activeRelationship);
    if (serviceFilterIntentRef.current.length > 0) {
      p.set("services", serviceFilterIntentRef.current.join(","));
    }
    if (next !== "any") {
      p.set("has_website", next === "yes" ? "yes" : "no");
    }
    p.set("page", "1");
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  }

  function queueServiceFilterApply(next: string[]): Promise<void> {
    serviceFilterIntentRef.current = next;
    setActiveServiceFilter(next);
    const scheduled = next;
    const job = () => runServiceFilterFetchOnce(scheduled);
    const tailed = serviceFilterApplyChainRef.current.then(job);
    serviceFilterApplyChainRef.current = tailed.catch(() => {
      /* keep the chain usable if a job ever throws */
    });
    return tailed;
  }

  async function runServiceFilterFetchOnce(next: string[]) {
    setListPage(1);
    setListLoading(true);
    try {
      const supabase = createClient();
      const { vendors: rows, total, error } = await fetchVendorListPage(
        supabase,
        {
          relationship: relationshipRef.current,
          q: searchRef.current,
          page: 1,
          serviceOptionIds: next,
          websitePresence: websitePresenceRef.current,
        },
      );

      if (error) {
        const revert = [...serviceFilterIds];
        const revertIdentity = [...revert].sort().join("|");
        setActiveServiceFilter(revert);
        serviceFilterIntentRef.current = revert;
        lastPushedServiceFilterIdentityRef.current = revertIdentity;
        alert(error.message);
        router.refresh();
        return;
      }

      setVendors(rows);
      setClientTotal(total);
      setSelectedIds(new Set());

      const pushedIdentity = [...next].sort().join("|");
      lastPushedServiceFilterIdentityRef.current = pushedIdentity;

      const p = new URLSearchParams();
      const qNorm = normalizeTableSearchQ(searchRef.current.trim());
      if (qNorm) p.set("q", qNorm);
      p.set("relationship", relationshipRef.current);
      if (next.length > 0) p.set("services", next.join(","));
      if (websitePresenceRef.current !== "any") {
        p.set(
          "has_website",
          websitePresenceRef.current === "yes" ? "yes" : "no",
        );
      }
      p.set("page", "1");
      router.replace(`${pathname}?${p.toString()}`, { scroll: false });
    } finally {
      setListLoading(false);
    }
  }

  function handleServiceFilterToggle(optionId: string) {
    const prev = serviceFilterIntentRef.current;
    const next = prev.includes(optionId)
      ? prev.filter((id) => id !== optionId)
      : [...prev, optionId];
    void queueServiceFilterApply(next);
  }

  function handleServiceFilterClear() {
    if (serviceFilterIntentRef.current.length === 0) return;
    void queueServiceFilterApply([]);
  }

  async function handleAddCatalogService() {
    const label = newCatalogServiceLabel.trim().replace(/\s+/g, " ");
    if (!label || addingCatalogService) return;
    setAddingCatalogService(true);
    setServiceCatalogError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setServiceCatalogError("You must be signed in.");
        return;
      }

      let opt: VendorServiceOption | null = null;
      const { data: created, error } = await supabase
        .from("vendor_service_options")
        .insert({ user_id: user.id, label })
        .select("*")
        .single();

      if (error) {
        const code = (error as { code?: string }).code;
        if (code === "23505") {
          const { data: existing } = await supabase
            .from("vendor_service_options")
            .select("*")
            .eq("user_id", user.id)
            .eq("label", label)
            .maybeSingle();
          if (existing) opt = existing as VendorServiceOption;
          else throw error;
        } else {
          throw error;
        }
      } else if (created) {
        opt = created as VendorServiceOption;
      }

      if (!opt) return;

      setServiceOptions((prev) => mergeOptionIntoCatalog(prev, opt));
      setNewCatalogServiceLabel("");
      setServiceAddOpen(false);

      const nextFilter = [...new Set([...serviceFilterIntentRef.current, opt.id])];
      await queueServiceFilterApply(nextFilter);
    } catch (err: unknown) {
      setServiceCatalogError(formatClientError(err));
    } finally {
      setAddingCatalogService(false);
    }
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

      <div
        className="rounded-2xl border border-zinc-200 bg-zinc-50/50 px-4 py-3 ring-1 ring-zinc-100"
        role="region"
        aria-label="Filter by service"
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Filter by service
            </span>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              Same list as in Add / Edit vendor—new tags show up here and can be
              ticked for any vendor later. After you type a new name below, press{" "}
              <kbd className="rounded bg-zinc-200/90 px-1 py-0.5 font-mono text-[10px] font-semibold text-zinc-800">
                Enter
              </kbd>{" "}
              to add it.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
            {activeServiceFilter.length > 0 ? (
              <button
                type="button"
                disabled={listLoading}
                onClick={() => void handleServiceFilterClear()}
                className="text-xs font-semibold text-sky-700 hover:text-sky-900 disabled:opacity-50"
              >
                Clear services
              </button>
            ) : null}
            <button
              type="button"
              disabled={listLoading || addingCatalogService}
              onClick={() =>
                setServiceAddOpen((v) => {
                  const next = !v;
                  if (v) {
                    setNewCatalogServiceLabel("");
                    setServiceCatalogError(null);
                  }
                  return next;
                })
              }
              className="rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-zinc-800 ring-1 ring-zinc-200 hover:bg-zinc-50 disabled:opacity-50"
            >
              + Add service
            </button>
          </div>
        </div>
        {serviceCatalogError ? (
          <p className="mt-2 text-xs text-red-600" role="alert">
            {serviceCatalogError}
          </p>
        ) : null}
        {serviceAddOpen ? (
          <div className="mt-3 space-y-1.5">
            <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
              <input
                ref={newCatalogServiceInputRef}
                id="vendor-list-new-service"
                type="text"
                value={newCatalogServiceLabel}
                onChange={(e) => setNewCatalogServiceLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    void handleAddCatalogService();
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setNewCatalogServiceLabel("");
                    setServiceCatalogError(null);
                    setServiceAddOpen(false);
                  }
                }}
                placeholder="e.g. Pool service, House cleaning…"
                disabled={addingCatalogService}
                className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm outline-none ring-1 ring-zinc-100 focus:ring-2 focus:ring-sky-200"
                aria-label="New service name — press Enter to add to catalog and filter"
              />
              {addingCatalogService ? (
                <span className="shrink-0 text-xs text-zinc-500">Saving…</span>
              ) : null}
            </div>
            <p className="text-xs text-zinc-500">
              Press{" "}
              <kbd className="rounded bg-zinc-200/90 px-1 py-0.5 font-mono text-[10px] font-semibold text-zinc-800">
                Enter
              </kbd>{" "}
              to save this service.
            </p>
          </div>
        ) : null}
        <div className="mt-2 flex max-h-[7.5rem] flex-wrap gap-2 overflow-y-auto">
          {serviceOptions.length === 0 ? (
            <p className="text-sm text-zinc-500">
              No service tags yet. Use{" "}
              <span className="font-medium text-zinc-700">+ Add service</span>{" "}
              to create one.
            </p>
          ) : (
            serviceOptions.map((opt) => {
              const on = activeServiceFilter.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => handleServiceFilterToggle(opt.id)}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    on
                      ? "bg-sky-600 text-white shadow-sm ring-1 ring-sky-700/25 hover:bg-sky-700"
                      : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-100"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <label htmlFor="vendor-search" className="sr-only">
            Search vendors
          </label>
          <input
            id="vendor-search"
            type="search"
            placeholder="Search by name, type, description, or website…"
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

      <div
        className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3"
        role="group"
        aria-label="Filter by company website"
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Website
        </span>
        <div className="flex flex-wrap gap-1.5 rounded-2xl border border-zinc-200/90 bg-zinc-100/90 p-1.5 shadow-inner shadow-zinc-200/40 ring-1 ring-zinc-200/60">
          {(
            [
              { id: "any" as const, label: "All" },
              { id: "yes" as const, label: "Has website" },
              { id: "no" as const, label: "No website" },
            ] as const
          ).map(({ id, label }) => {
            const active = activeWebsiteFilter === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                disabled={listLoading}
                onClick={() => void handleWebsitePresenceChange(id)}
                className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  active
                    ? "bg-violet-600 text-white shadow-sm ring-1 ring-violet-700/30"
                    : "bg-white text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
                } disabled:opacity-50`}
              >
                {label}
              </button>
            );
          })}
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
              {emptyVendorsBodyCopy({
                clientTotal,
                searchQ,
                serviceFilterActive: activeServiceFilter.length > 0,
                websiteFilterActive: activeWebsiteFilter !== "any",
              })}
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
                  <div className="mt-1 text-xs text-zinc-600">
                    <span className="font-medium text-zinc-500">Services: </span>
                    {shortServiceLabels(v, 6)}
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
          <table className="w-full min-w-[720px] text-left text-sm">
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
                  Services
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
                    colSpan={8}
                    className="px-4 py-10 text-center text-zinc-500"
                  >
                    {emptyVendorsBodyCopy({
                      clientTotal,
                      searchQ,
                      serviceFilterActive: activeServiceFilter.length > 0,
                      websiteFilterActive: activeWebsiteFilter !== "any",
                    })}
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
                    <td className="max-w-[10rem] px-4 py-3 text-xs text-zinc-600">
                      {shortServiceLabels(v, 5)}
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
            if (serviceFilterIntentRef.current.length > 0) {
              n.set("services", serviceFilterIntentRef.current.join(","));
            }
            if (activeWebsiteFilter !== "any") {
              n.set(
                "has_website",
                activeWebsiteFilter === "yes" ? "yes" : "no",
              );
            }
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
