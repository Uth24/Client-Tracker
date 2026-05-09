import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VendorList } from "@/components/vendors/VendorList";
import {
  isVendorRelationshipStatus,
  type VendorRelationshipStatus,
} from "@/lib/types/vendors";
import { TABLE_PAGE_SIZE } from "@/lib/pagination-constants";
import { normalizeTableSearchQ } from "@/lib/search-query";
import { fetchVendorListPage } from "@/lib/vendors/fetch-vendor-list-page";

type Sp = { page?: string; q?: string; relationship?: string };

const DEFAULT_RELATIONSHIP: VendorRelationshipStatus = "havent_worked_with";

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
  const relationship: VendorRelationshipStatus =
    relationshipRaw && isVendorRelationshipStatus(relationshipRaw)
      ? relationshipRaw
      : DEFAULT_RELATIONSHIP;

  const { vendors, total, error } = await fetchVendorListPage(supabase, {
    relationship,
    q,
    page: requested,
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
    p.set("page", String(maxPage));
    redirect(`/vendors?${p.toString()}`);
  }
  const page = total === 0 ? 1 : Math.min(requested, maxPage);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900">Vendors</h1>
      <p className="mt-1 text-zinc-600">
        Use the tabs to filter by relationship, search by name or type, and
        click a row for details. Set each vendor&apos;s relationship when adding
        or editing.
      </p>
      <div className="mt-8">
        <VendorList
          initialVendors={vendors}
          page={page}
          totalCount={total}
          searchQ={q}
          relationship={relationship}
        />
      </div>
    </div>
  );
}
