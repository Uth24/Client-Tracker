/** How you relate to this vendor for scheduling and outreach. */
export type VendorRelationshipStatus =
  | "worked_with"
  | "havent_worked_with"
  | "not_working_with";

export const VENDOR_RELATIONSHIP_STATUSES: VendorRelationshipStatus[] = [
  "worked_with",
  "havent_worked_with",
  "not_working_with",
];

export const VENDOR_RELATIONSHIP_LABEL: Record<
  VendorRelationshipStatus,
  string
> = {
  worked_with: "Worked with",
  havent_worked_with: "Haven't worked with",
  not_working_with: "Not working with",
};

export function isVendorRelationshipStatus(
  v: string,
): v is VendorRelationshipStatus {
  return (VENDOR_RELATIONSHIP_STATUSES as string[]).includes(v);
}

export type VendorImage = {
  id: string;
  vendor_id: string;
  user_id: string;
  /** Object path in the bucket, or a legacy full public URL (parsed on read). */
  image_url: string;
  created_at: string;
};

export type Vendor = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  type: string | null;
  /** Present after migration; treat missing/null as havent_worked_with in UI. */
  relationship_status?: VendorRelationshipStatus | null;
  created_at: string;
  vendor_images?: VendorImage[] | null;
};

/** Stable image order (oldest first), matching the vendors page list. */
export function sortVendorImages<T extends Vendor>(v: T): T {
  const imgs = [...(v.vendor_images ?? [])].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
  return { ...v, vendor_images: imgs };
}
