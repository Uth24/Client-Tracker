/** Supabase Storage bucket for vendor images (private bucket; use signed URLs in the app). */
export const VENDOR_IMAGES_BUCKET =
  process.env.NEXT_PUBLIC_VENDOR_IMAGES_BUCKET ?? "vendor-images";
