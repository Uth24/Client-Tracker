/** Supabase `.select()` fragment for lead rows with images + service links. */
export const LEAD_ROW_SELECT =
  "*, lead_images(*), lead_services(service_option_id, lead_service_options(id, label, user_id))";
