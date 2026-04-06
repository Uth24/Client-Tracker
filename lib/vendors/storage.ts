import type { SupabaseClient } from "@supabase/supabase-js";
import { VENDOR_IMAGES_BUCKET } from "@/lib/constants";

export async function uploadVendorImageFiles(
  supabase: SupabaseClient,
  userId: string,
  vendorId: string,
  files: File[],
): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const safeName = file.name.replace(/[^\w.-]/g, "_");
    const path = `${userId}/${vendorId}/${crypto.randomUUID()}-${safeName}`;
    const { error } = await supabase.storage
      .from(VENDOR_IMAGES_BUCKET)
      .upload(path, file, { cacheControl: "3600", upsert: false });
    if (error) throw error;
    const { data } = supabase.storage
      .from(VENDOR_IMAGES_BUCKET)
      .getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
}
