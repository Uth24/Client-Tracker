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
  created_at: string;
  vendor_images?: VendorImage[] | null;
};
