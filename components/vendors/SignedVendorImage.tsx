"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { VENDOR_IMAGES_BUCKET } from "@/lib/constants";
import { Skeleton } from "@/components/ui/Skeleton";
import { getSignedUrlForVendorImage, objectPathFromStoredImageRef } from "@/lib/vendors/storage";

const SIGNED_TTL_SEC = 3600;

type Props = {
  imageRef: string;
  className?: string;
  imgClassName?: string;
  alt?: string;
  withLink?: boolean;
};

/**
 * Renders a vendor image from `vendor_images.image_url` (object path, or a legacy
 * public object URL) using a short‑lived signed URL for private buckets.
 */
export function SignedVendorImage({
  imageRef,
  className = "",
  imgClassName = "",
  alt = "",
  withLink = false,
}: Props) {
  const [signed, setSigned] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!imageRef?.trim()) {
      setFailed(true);
      return;
    }

    const path = objectPathFromStoredImageRef(imageRef, VENDOR_IMAGES_BUCKET);
    if (!path) {
      setFailed(true);
      return;
    }

    const supabase = createClient();
    let cancelled = false;
    (async () => {
      setFailed(false);
      setSigned(null);
      const { url, error } = await getSignedUrlForVendorImage(
        supabase,
        path,
        SIGNED_TTL_SEC,
      );
      if (cancelled) return;
      if (error || !url) {
        setFailed(true);
        return;
      }
      setSigned(url);
    })();

    return () => {
      cancelled = true;
    };
  }, [imageRef]);

  if (failed) {
    return (
      <div className={className}>
        <div
          className={`flex items-center justify-center bg-zinc-100 text-[10px] text-zinc-500 ${imgClassName}`}
        >
          Unavailable
        </div>
      </div>
    );
  }

  if (!signed) {
    return (
      <div className={className}>
        <Skeleton className={`h-full w-full min-h-[2.5rem] ${imgClassName}`} />
      </div>
    );
  }

  const imageNode = (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={signed}
      alt={alt}
      onError={() => setFailed(true)}
      className={imgClassName}
    />
  );

  if (withLink) {
    return (
      <a
        href={signed}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {imageNode}
      </a>
    );
  }

  return <div className={className}>{imageNode}</div>;
}
