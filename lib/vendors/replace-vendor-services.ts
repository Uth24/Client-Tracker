import type { SupabaseClient } from "@supabase/supabase-js";

/** Replace all `vendor_services` rows for one vendor. */
export async function replaceVendorServices(
  supabase: SupabaseClient,
  vendorId: string,
  serviceOptionIds: readonly string[],
): Promise<void> {
  const { error: delErr } = await supabase
    .from("vendor_services")
    .delete()
    .eq("vendor_id", vendorId);
  if (delErr) throw delErr;
  if (serviceOptionIds.length === 0) return;
  const { error: insErr } = await supabase.from("vendor_services").insert(
    serviceOptionIds.map((service_option_id) => ({
      vendor_id: vendorId,
      service_option_id,
    })),
  );
  if (insErr) throw insErr;
}
