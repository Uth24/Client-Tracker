import { createClient } from "@/lib/supabase/server";
import { VendorList } from "@/components/vendors/VendorList";
import type { Vendor } from "@/lib/types/vendors";

export default async function VendorsPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("vendors")
    .select("*, vendor_images(*)")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Vendors
        </h1>
        <p className="mt-2 text-red-600 dark:text-red-400">
          Could not load vendors: {error.message}
        </p>
      </div>
    );
  }

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
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        Vendors
      </h1>
      <p className="mt-1 text-zinc-600 dark:text-zinc-400">
        Search by name, job type, or description. Click a row to view details.
      </p>
      <div className="mt-8">
        <VendorList initialVendors={vendors} />
      </div>
    </div>
  );
}
