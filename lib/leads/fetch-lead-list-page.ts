import type { SupabaseClient } from "@supabase/supabase-js";
import { type Lead, sortLeadRow } from "@/lib/types/leads";
import { LEAD_ROW_SELECT } from "@/lib/leads/lead-query-select";
import { TABLE_PAGE_SIZE } from "@/lib/pagination-constants";
import { likePattern, normalizeTableSearchQ } from "@/lib/search-query";
import type { WebsitePresenceFilter } from "@/lib/vendors/website-presence-filter";

export type FetchLeadListParams = {
  q: string;
  page: number;
  pageSize?: number;
  /**
   * When non-empty, only leads linked to at least one of these
   * `lead_service_options` ids (OR).
   */
  serviceOptionIds?: string[];
  websitePresence?: WebsitePresenceFilter;
};

export async function fetchLeadListPage(
  supabase: SupabaseClient,
  params: FetchLeadListParams,
): Promise<{
  leads: Lead[];
  total: number;
  error: { message: string } | null;
}> {
  const pageSize = params.pageSize ?? TABLE_PAGE_SIZE;
  const qNorm = normalizeTableSearchQ(params.q);
  const requested = Math.max(1, params.page);
  const serviceIds = (params.serviceOptionIds ?? []).filter(Boolean);

  let leadIdAllowlist: string[] | null = null;
  if (serviceIds.length > 0) {
    const { data: links, error: linkErr } = await supabase
      .from("lead_services")
      .select("lead_id")
      .in("service_option_id", serviceIds);
    if (linkErr) {
      return {
        leads: [],
        total: 0,
        error: { message: linkErr.message },
      };
    }
    const set = new Set<string>();
    for (const row of links ?? []) {
      const id = (row as { lead_id?: string }).lead_id;
      if (id) set.add(id);
    }
    leadIdAllowlist = [...set];
    if (leadIdAllowlist.length === 0) {
      return { leads: [], total: 0, error: null };
    }
  }

  let listQuery = supabase
    .from("leads")
    .select(LEAD_ROW_SELECT, { count: "exact" })
    .order("created_at", { ascending: false });

  if (leadIdAllowlist) {
    listQuery = listQuery.in("id", leadIdAllowlist);
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
      `name.ilike.${pat},type.ilike.${pat},description.ilike.${pat},website.ilike.${pat}`,
    );
  }

  const from = (requested - 1) * pageSize;
  const to = from + pageSize - 1;

  const { data, error, count } = await listQuery.range(from, to);

  if (error) {
    return { leads: [], total: 0, error: { message: error.message } };
  }

  const leads = (data ?? []).map((row) => sortLeadRow(row as Lead));

  return { leads, total: count ?? 0, error: null };
}
