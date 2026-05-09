import type { SupabaseClient } from "@supabase/supabase-js";
import {
  type Vendor,
  type VendorRelationshipStatus,
} from "@/lib/types/vendors";
import { TABLE_PAGE_SIZE } from "@/lib/pagination-constants";
import { likePattern, normalizeTableSearchQ } from "@/lib/search-query";

export type FetchVendorListParams = {
  relationship: VendorRelationshipStatus;
  /** Raw search string (normalized inside). */
  q: string;
  page: number;
  pageSize?: number;
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

  let listQuery = supabase
    .from("vendors")
    .select("*, vendor_images(*)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (params.relationship === "havent_worked_with") {
    listQuery = listQuery.or(
      "relationship_status.eq.havent_worked_with,relationship_status.is.null",
    );
  } else {
    listQuery = listQuery.eq("relationship_status", params.relationship);
  }

  if (qNorm) {
    const pat = likePattern(qNorm);
    listQuery = listQuery.or(
      `name.ilike.${pat},type.ilike.${pat},description.ilike.${pat}`,
    );
  }

  const from = (requested - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await listQuery.range(from, to);

  if (error) {
    return { vendors: [], total: 0, error: { message: error.message } };
  }

  const vendors = (data ?? []).map((row) => {
    const v = row as Vendor;
    const imgs = [...(v.vendor_images ?? [])].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    return { ...v, vendor_images: imgs };
  });

  return { vendors, total: count ?? 0, error: null };
}
