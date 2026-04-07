/** Supabase Storage bucket for vendor images (create as public + RLS policies). */
export const VENDOR_IMAGES_BUCKET =
  process.env.NEXT_PUBLIC_VENDOR_IMAGES_BUCKET ?? "vendor-images";
