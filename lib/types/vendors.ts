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

/** Vendors list tab: every vendor, or one partnership bucket. */
export type VendorRelationshipListTab = "all" | VendorRelationshipStatus;

export function isVendorRelationshipListTab(
  v: string,
): v is VendorRelationshipListTab {
  return v === "all" || isVendorRelationshipStatus(v);
}

export type VendorImage = {
  id: string;
  vendor_id: string;
  user_id: string;
  /** Object path in the bucket, or a legacy full public URL (parsed on read). */
  image_url: string;
  created_at: string;
};

/** Reusable service label for the signed-in user (checkbox catalog). */
export type VendorServiceOption = {
  id: string;
  user_id: string;
  label: string;
  created_at: string;
};

/** Junction row from Supabase with embedded option. */
export type VendorServiceLink = {
  vendor_id?: string;
  service_option_id: string;
  vendor_service_options?: VendorServiceOption | null;
};

export type Vendor = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  type: string | null;
  /** Company site; optional. Present after `20260509210000_vendor_website` migration. */
  website?: string | null;
  /** Present after migration; treat missing/null as havent_worked_with in UI. */
  relationship_status?: VendorRelationshipStatus | null;
  created_at: string;
  vendor_images?: VendorImage[] | null;
  vendor_services?: VendorServiceLink[] | null;
};

/** Stable image order (oldest first), matching the vendors page list. */
export function sortVendorImages<T extends Vendor>(v: T): T {
  const imgs = [...(v.vendor_images ?? [])].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
  return { ...v, vendor_images: imgs };
}

/** Sort images + service links for list/detail consistency. */
export function sortVendorRow<T extends Vendor>(v: T): T {
  const withImages = sortVendorImages(v);
  const links = withImages.vendor_services;
  if (!links?.length) return withImages;
  const sorted = [...links]
    .filter((row) => row.vendor_service_options?.label)
    .sort((a, b) =>
      (a.vendor_service_options!.label ?? "").localeCompare(
        b.vendor_service_options!.label ?? "",
        undefined,
        { sensitivity: "base" },
      ),
    );
  return { ...withImages, vendor_services: sorted };
}
