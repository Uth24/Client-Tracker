import type { SupabaseClient } from "@supabase/supabase-js";
import { VENDOR_IMAGES_BUCKET } from "@/lib/constants";

function guessImageContentType(file: File): string {
  if (file.type && file.type.startsWith("image/")) return file.type;
  const lower = file.name.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
}

export async function uploadVendorImageFiles(
  supabase: SupabaseClient,
  userId: string,
  vendorId: string,
  files: File[],
): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    const safeName = file.name.replace(/[^\w.-]/g, "_") || "image";
    const path = `${userId}/${vendorId}/${crypto.randomUUID()}-${safeName}`;
    const { error } = await supabase.storage.from(VENDOR_IMAGES_BUCKET).upload(
      path,
      file,
      {
        cacheControl: "3600",
        upsert: false,
        contentType: guessImageContentType(file),
      },
    );
    if (error) {
      const hint =
        /bucket|not found|row-level security|policy/i.test(error.message)
          ? ` Check bucket "${VENDOR_IMAGES_BUCKET}" exists (public) and run supabase/storage-setup.sql.`
          : "";
      throw new Error(error.message + hint);
    }
    const { data } = supabase.storage
      .from(VENDOR_IMAGES_BUCKET)
      .getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
}
