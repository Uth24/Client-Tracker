import type { SupabaseClient } from "@supabase/supabase-js";
import { VENDOR_IMAGES_BUCKET } from "@/lib/constants";

/**
 * `lead_images.image_url` stores the object key (e.g. `userId/leads/leadId/uuid.png`)
 * in the same private bucket as vendor images.
 */
export async function uploadLeadImageFiles(
  supabase: SupabaseClient,
  userId: string,
  leadId: string,
  files: File[],
): Promise<string[]> {
  const paths: string[] = [];
  for (const file of files) {
    const safeName = file.name.replace(/[^\w.-]/g, "_") || "image";
    const path = `${userId}/leads/${leadId}/${crypto.randomUUID()}-${safeName}`;
    const contentType =
      file.type && file.type.startsWith("image/")
        ? file.type
        : file.name.toLowerCase().endsWith(".png")
          ? "image/png"
          : file.name.toLowerCase().match(/\.(jpe?g)$/)
            ? "image/jpeg"
            : file.name.toLowerCase().endsWith(".webp")
              ? "image/webp"
              : file.name.toLowerCase().endsWith(".gif")
                ? "image/gif"
                : "application/octet-stream";
    const { error } = await supabase.storage.from(VENDOR_IMAGES_BUCKET).upload(
      path,
      file,
      {
        cacheControl: "3600",
        upsert: false,
        contentType,
      },
    );
    if (error) {
      const hint = /bucket|not found|row-level security|policy/i.test(
        error.message,
      )
        ? ` Check bucket "${VENDOR_IMAGES_BUCKET}" exists and storage RLS allows your user to insert/select.`
        : "";
      throw new Error(error.message + hint);
    }
    paths.push(path);
  }
  return paths;
}
