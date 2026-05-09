import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VendorList } from "@/components/vendors/VendorList";
import {
  type VendorRelationshipListTab,
  isVendorRelationshipListTab,
} from "@/lib/types/vendors";
import { TABLE_PAGE_SIZE } from "@/lib/pagination-constants";
import { normalizeTableSearchQ } from "@/lib/search-query";
import { fetchVendorListPage } from "@/lib/vendors/fetch-vendor-list-page";
import { parseServiceFilterParam } from "@/lib/vendors/parse-service-filter-param";
import { parseWebsitePresenceParam } from "@/lib/vendors/website-presence-filter";

type Sp = {
  page?: string;
  q?: string;
  relationship?: string;
  services?: string;
  has_website?: string;
};

const DEFAULT_RELATIONSHIP_TAB: VendorRelationshipListTab = "all";

function parseRelationshipListTab(
  raw: string | undefined,
): VendorRelationshipListTab {
  if (raw && isVendorRelationshipListTab(raw)) return raw;
  return DEFAULT_RELATIONSHIP_TAB;
}

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<Sp> | Sp;
}) {
  const sp = await Promise.resolve(searchParams);
  const supabase = await createClient();
  const q = normalizeTableSearchQ(typeof sp.q === "string" ? sp.q : undefined);
  const requested = Math.max(1, parseInt(String(sp.page ?? "1"), 10) || 1);
  const relationshipRaw =
    typeof sp.relationship === "string" ? sp.relationship : undefined;
  const relationship = parseRelationshipListTab(relationshipRaw);

  const serviceOptionIds = parseServiceFilterParam(
    typeof sp.services === "string" ? sp.services : undefined,
  );
  const websitePresence = parseWebsitePresenceParam(
    typeof sp.has_website === "string" ? sp.has_website : undefined,
  );

  const { vendors, total, error } = await fetchVendorListPage(supabase, {
    relationship,
    q,
    page: requested,
    serviceOptionIds,
    websitePresence,
  });

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Vendors</h1>
        <p className="mt-2 text-red-600">
          Could not load vendors: {error.message}
        </p>
      </div>
    );
  }
  const maxPage = Math.max(1, Math.ceil(total / TABLE_PAGE_SIZE) || 1);
  if (total > 0 && requested > maxPage) {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    p.set("relationship", relationship);
    if (serviceOptionIds.length > 0) p.set("services", serviceOptionIds.join(","));
    if (websitePresence !== "any") {
      p.set("has_website", websitePresence === "yes" ? "yes" : "no");
    }
    p.set("page", String(maxPage));
    redirect(`/vendors?${p.toString()}`);
  }
  const page = total === 0 ? 1 : Math.min(requested, maxPage);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900">Vendors</h1>
      <p className="mt-1 text-zinc-600">
        Use <span className="font-medium text-zinc-800">All</span> or a
        partnership tab to narrow the list, pick services, search by name,
        type, website, email, phone, address, or notes, filter by site presence,
        and click a row for details.
      </p>
      <div className="mt-8">
        <VendorList
          initialVendors={vendors}
          page={page}
          totalCount={total}
          searchQ={q}
          relationship={relationship}
          serviceFilterIds={serviceOptionIds}
          websiteFilter={websitePresence}
        />
      </div>
    </div>
  );
}
