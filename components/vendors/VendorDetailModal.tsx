"use client";

import type { Vendor } from "@/lib/types/vendors";
import { Modal } from "@/components/ui/Modal";
import { SignedVendorImage } from "@/components/vendors/SignedVendorImage";

type Props = {
  vendor: Vendor | null;
  open: boolean;
  onClose: () => void;
};

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

export function VendorDetailModal({ vendor, open, onClose }: Props) {
  if (!vendor) return null;

  const images = vendor.vendor_images ?? [];

  return (
    <Modal open={open} onClose={onClose} title={vendor.name} size="xl">
      <div className="space-y-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Type of work
          </p>
          <p className="mt-0.5 text-zinc-900">
            {vendor.type?.trim() ? vendor.type : "—"}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Description
          </p>
          <p className="mt-1 whitespace-pre-wrap text-zinc-800">
            {vendor.description?.trim() ? vendor.description : "No description."}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Past work
          </p>
          {images.length === 0 ? (
            <p className="mt-1 text-sm text-zinc-500">No images yet.</p>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {images.map((img) => (
                <SignedVendorImage
                  key={img.id}
                  imageRef={img.image_url}
                  withLink
                  className="aspect-video overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100"
                  imgClassName="h-full w-full object-cover"
                />
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-zinc-500">
          Added {formatDate(vendor.created_at)}
        </p>
      </div>
    </Modal>
  );
}
