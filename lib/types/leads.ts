export type LeadImage = {
  id: string;
  lead_id: string;
  user_id: string;
  /** Object path in the bucket, or a legacy full public URL (parsed on read). */
  image_url: string;
  created_at: string;
};

export type LeadServiceOption = {
  id: string;
  user_id: string;
  label: string;
  created_at: string;
};

export type LeadServiceLink = {
  lead_id?: string;
  service_option_id: string;
  lead_service_options?: LeadServiceOption | null;
};

export type Lead = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  /** Type of work / category (e.g. contractor, designer). */
  type: string | null;
  website?: string | null;
  created_at: string;
  lead_images?: LeadImage[] | null;
  lead_services?: LeadServiceLink[] | null;
};

/** Stable image order (oldest first), matching the leads page list. */
export function sortLeadImages<T extends Lead>(l: T): T {
  const imgs = [...(l.lead_images ?? [])].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );
  return { ...l, lead_images: imgs };
}

/** Sort images + service links for list/detail consistency. */
export function sortLeadRow<T extends Lead>(l: T): T {
  const withImages = sortLeadImages(l);
  const links = withImages.lead_services;
  if (!links?.length) return withImages;
  const sorted = [...links]
    .filter((row) => row.lead_service_options?.label)
    .sort((a, b) =>
      (a.lead_service_options!.label ?? "").localeCompare(
        b.lead_service_options!.label ?? "",
        undefined,
        { sensitivity: "base" },
      ),
    );
  return { ...withImages, lead_services: sorted };
}
