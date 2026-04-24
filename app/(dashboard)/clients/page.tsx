import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClientList } from "@/components/clients/ClientList";
import type { Client } from "@/lib/types/clients";
import { TABLE_PAGE_SIZE } from "@/lib/pagination-constants";
import { likePattern, normalizeTableSearchQ } from "@/lib/search-query";

type Sp = { page?: string; q?: string };

export default async function ClientsPage({
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
    .from("clients")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (q) {
    const pat = likePattern(q);
    listQuery = listQuery.or(
      `name.ilike.${pat},email.ilike.${pat},phone.ilike.${pat},address_line1.ilike.${pat},address_line2.ilike.${pat},city.ilike.${pat},state.ilike.${pat},zip_code.ilike.${pat},notes.ilike.${pat}`,
    );
  }

  const from = (requested - 1) * TABLE_PAGE_SIZE;
  const to = from + TABLE_PAGE_SIZE - 1;

  const { data, error, count } = await listQuery.range(from, to);

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Clients</h1>
        <p className="mt-2 text-red-600">
          Could not load clients: {error.message}
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
    redirect(`/clients?${p.toString()}`);
  }
  const page = total === 0 ? 1 : Math.min(requested, maxPage);

  const clients = (data ?? []) as Client[];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-zinc-900">Clients</h1>
      <p className="mt-1 text-zinc-600">
        Create and manage the people hiring your vendors.
      </p>
      <div className="mt-8">
        <ClientList
          initialClients={clients}
          page={page}
          totalCount={total}
          searchQ={q}
        />
      </div>
    </div>
  );
}
