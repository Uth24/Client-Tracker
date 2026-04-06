export type VendorImage = {
  id: string;
  vendor_id: string;
  user_id: string;
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
