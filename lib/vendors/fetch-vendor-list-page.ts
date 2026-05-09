import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type Vendor,
  type VendorRelationshipListTab,
  sortVendorRow,
} from "@/lib/types/vendors";
import { VENDOR_ROW_SELECT } from "@/lib/vendors/vendor-query-select";
import { TABLE_PAGE_SIZE } from "@/lib/pagination-constants";
import { likePattern, normalizeTableSearchQ } from "@/lib/search-query";
import type { WebsitePresenceFilter } from "@/lib/vendors/website-presence-filter";

export type FetchVendorListParams = {
  relationship: VendorRelationshipListTab;
  /** Raw search string (normalized inside). */
  q: string;
  page: number;
  pageSize?: number;
  /**
   * When non-empty, only vendors linked to at least one of these
   * `vendor_service_options` ids (OR).
   */
  serviceOptionIds?: string[];
  /** Filter by whether `website` is set (requires `website` column). */
  websitePresence?: WebsitePresenceFilter;
};

/**
 * Same filters and row shape as `app/(dashboard)/vendors/page.tsx` so the client
 * can refetch when tabs change without waiting for a server navigation.
 */
export async function fetchVendorListPage(
  supabase: SupabaseClient,
  params: FetchVendorListParams,
): Promise<{
  vendors: Vendor[];
  total: number;
  error: { message: string } | null;
}> {
  const pageSize = params.pageSize ?? TABLE_PAGE_SIZE;
  const qNorm = normalizeTableSearchQ(params.q);
  const requested = Math.max(1, params.page);
  const serviceIds = (params.serviceOptionIds ?? []).filter(Boolean);

  let vendorIdAllowlist: string[] | null = null;
  if (serviceIds.length > 0) {
    const { data: links, error: linkErr } = await supabase
      .from("vendor_services")
      .select("vendor_id")
      .in("service_option_id", serviceIds);
    if (linkErr) {
      return {
        vendors: [],
        total: 0,
        error: { message: linkErr.message },
      };
    }
    const set = new Set<string>();
    for (const row of links ?? []) {
      const id = (row as { vendor_id?: string }).vendor_id;
      if (id) set.add(id);
    }
    vendorIdAllowlist = [...set];
    if (vendorIdAllowlist.length === 0) {
      return { vendors: [], total: 0, error: null };
    }
  }

  let listQuery = supabase
    .from("vendors")
    .select(VENDOR_ROW_SELECT, { count: "exact" })
    .order("created_at", { ascending: false });

  if (vendorIdAllowlist) {
    listQuery = listQuery.in("id", vendorIdAllowlist);
  }

  if (params.relationship !== "all") {
    if (params.relationship === "havent_worked_with") {
      listQuery = listQuery.or(
        "relationship_status.eq.havent_worked_with,relationship_status.is.null",
      );
    } else {
      listQuery = listQuery.eq("relationship_status", params.relationship);
    }
  }

  const presence = params.websitePresence ?? "any";
  if (presence === "yes") {
    listQuery = listQuery.not("website", "is", null).neq("website", "");
  } else if (presence === "no") {
    listQuery = listQuery.is("website", null);
  }

  if (qNorm) {
    const pat = likePattern(qNorm);
    listQuery = listQuery.or(
      [
        `name.ilike.${pat}`,
        `type.ilike.${pat}`,
        `description.ilike.${pat}`,
        `website.ilike.${pat}`,
        `email.ilike.${pat}`,
        `phone.ilike.${pat}`,
        `address_line1.ilike.${pat}`,
        `address_line2.ilike.${pat}`,
        `city.ilike.${pat}`,
        `state.ilike.${pat}`,
        `zip_code.ilike.${pat}`,
        `notes.ilike.${pat}`,
      ].join(","),
    );
  }

  const from = (requested - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await listQuery.range(from, to);

  if (error) {
    return { vendors: [], total: 0, error: { message: error.message } };
  }

  const vendors = (data ?? []).map((row) => sortVendorRow(row as Vendor));

  return { vendors, total: count ?? 0, error: null };
}
