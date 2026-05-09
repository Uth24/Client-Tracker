/** Supabase `.select()` fragment for vendor rows with images + service links. */
export const VENDOR_ROW_SELECT =
  "*, vendor_images(*), vendor_services(service_option_id, vendor_service_options(id, label, user_id))";
