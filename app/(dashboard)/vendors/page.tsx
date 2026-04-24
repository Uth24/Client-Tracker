import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VendorList } from "@/components/vendors/VendorList";
import type { Vendor } from "@/lib/types/vendors";
import { TABLE_PAGE_SIZE } from "@/lib/pagination-constants";
import { likePattern, normalizeTableSearchQ } from "@/lib/search-query";

type Sp = { page?: string; q?: string };

export default async function VendorsPage({
  searchParams,
}: {
  searchParams: Promise<Sp> | Sp;
}) {
  const sp = await Promise.resolve(searchParams);
  const supabase = await createClient();
  const q = normalizeTableSearchQ(
    typeof sp.q === "string" ? sp.q : undefined,
  );
  const requested = Math.max(1, parseInt(String(sp.page ?? "1"), 10) || 1);

  let listQuery = supabase
    .from("vendors")
    .select("*, vendor_images(*)", { count: "exact" })
    .order("created_at", { ascending: false });

  if (q) {
    const pat = likePattern(q);
    listQuery = listQuery.or(
      `name.ilike.${pat},type.ilike.${pat},description.ilike.${pat}`,
    );
  }

  const from = (requested - 1) * TABLE_PAGE_SIZE;
  const to = from + TABLE_PAGE_SIZE - 1;

  const { data, error, count } = await listQuery.range(from, to);

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

  const total = count ?? 0;
  const maxPage = Math.max(1, Math.ceil(total / TABLE_PAGE_SIZE) || 1);
  if (total > 0 && requested > maxPage) {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    p.set("page", String(maxPage));
    redirect(`/vendors?${p.toString()}`);
  }
  const page = total === 0 ? 1 : Math.min(requested, maxPage);

  const vendors = (data ?? []).map((row) => {
    const v = row as Vendor;
    const imgs = [...(v.vendor_images ?? [])].sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    );
    return { ...v, vendor_images: imgs };
  });

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900">Vendors</h1>
      <p className="mt-1 text-zinc-600">
        Search by name, job type, or description. Click a row to view details.
      </p>
      <div className="mt-8">
        <VendorList
          initialVendors={vendors}
          page={page}
          totalCount={total}
          searchQ={q}
        />
      </div>
    </div>
  );
}
