import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LeadList } from "@/components/leads/LeadList";
import { TABLE_PAGE_SIZE } from "@/lib/pagination-constants";
import { normalizeTableSearchQ } from "@/lib/search-query";
import { fetchLeadListPage } from "@/lib/leads/fetch-lead-list-page";
import { parseServiceFilterParam } from "@/lib/vendors/parse-service-filter-param";
import { parseWebsitePresenceParam } from "@/lib/vendors/website-presence-filter";

type Sp = {
  page?: string;
  q?: string;
  services?: string;
  has_website?: string;
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Sp> | Sp;
}) {
  const sp = await Promise.resolve(searchParams);
  const supabase = await createClient();
  const q = normalizeTableSearchQ(typeof sp.q === "string" ? sp.q : undefined);
  const requested = Math.max(1, parseInt(String(sp.page ?? "1"), 10) || 1);

  const serviceOptionIds = parseServiceFilterParam(
    typeof sp.services === "string" ? sp.services : undefined,
  );
  const websitePresence = parseWebsitePresenceParam(
    typeof sp.has_website === "string" ? sp.has_website : undefined,
  );

  const { leads, total, error } = await fetchLeadListPage(supabase, {
    q,
    page: requested,
    serviceOptionIds,
    websitePresence,
  });

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Leads</h1>
        <p className="mt-2 text-red-600">
          Could not load leads: {error.message}
        </p>
      </div>
    );
  }
  const maxPage = Math.max(1, Math.ceil(total / TABLE_PAGE_SIZE) || 1);
  if (total > 0 && requested > maxPage) {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (serviceOptionIds.length > 0) p.set("services", serviceOptionIds.join(","));
    if (websitePresence !== "any") {
      p.set("has_website", websitePresence === "yes" ? "yes" : "no");
    }
    p.set("page", String(maxPage));
    redirect(`/leads?${p.toString()}`);
  }
  const page = total === 0 ? 1 : Math.min(requested, maxPage);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900">Leads</h1>
      <p className="mt-1 text-zinc-600">
        Track people you are prospecting. Filter by services and website, search
        by name, type of work, description, or site, and open a row for full
        details.
      </p>
      <div className="mt-8">
        <LeadList
          initialLeads={leads}
          page={page}
          totalCount={total}
          searchQ={q}
          serviceFilterIds={serviceOptionIds}
          websiteFilter={websitePresence}
        />
      </div>
    </div>
  );
}
