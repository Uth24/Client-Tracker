import type { SupabaseClient } from "@supabase/supabase-js";

/** Replace all `lead_services` rows for one lead. */
export async function replaceLeadServices(
  supabase: SupabaseClient,
  leadId: string,
  serviceOptionIds: readonly string[],
): Promise<void> {
  const { error: delErr } = await supabase
    .from("lead_services")
    .delete()
    .eq("lead_id", leadId);
  if (delErr) throw delErr;
  if (serviceOptionIds.length === 0) return;
  const { error: insErr } = await supabase.from("lead_services").insert(
    serviceOptionIds.map((service_option_id) => ({
      lead_id: leadId,
      service_option_id,
    })),
  );
  if (insErr) throw insErr;
}
