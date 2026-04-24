import type { SupabaseClient } from "@supabase/supabase-js";
import { VENDOR_IMAGES_BUCKET } from "@/lib/constants";

const BUCKET = VENDOR_IMAGES_BUCKET;

/**
 * `vendor_images.image_url` stores the object key (e.g. `userId/vendorId/uuid.png`).
 * Legacy rows may still have a full Supabase public URL from before the bucket was private.
 */
export function objectPathFromStoredImageRef(
  stored: string,
  bucket: string = BUCKET,
): string {
  const s = stored.trim();
  if (!s) return s;
  if (!/^https?:\/\//i.test(s)) {
    return s.replace(/^\//, "");
  }
  const escaped = bucket.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = s.match(
    new RegExp(`/storage/v1/object/(?:public|sign)/${escaped}/([^?#]+)`),
  );
  if (m?.[1]) {
    try {
      return decodeURIComponent(m[1]!);
    } catch {
      return m[1]!;
    }
  }
  const idx = s.indexOf(`/${bucket}/`);
  if (idx >= 0) {
    const rest = s.slice(idx + bucket.length + 2);
    const path = rest.split(/[?#]/)[0] ?? rest;
    try {
      return decodeURIComponent(path);
    } catch {
      return path;
    }
  }
  return s;
}

export async function getSignedUrlForVendorImage(
  supabase: SupabaseClient,
  objectPath: string,
  expiresInSec: number = 3600,
): Promise<{ url: string | null; error: { message: string } | null }> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(objectPath, expiresInSec);
  if (error) {
    return { url: null, error };
  }
  return { url: data?.signedUrl ?? null, error: null };
}

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
  const paths: string[] = [];
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
