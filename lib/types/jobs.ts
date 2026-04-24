import type { Client } from "@/lib/types/clients";
import type { Vendor } from "@/lib/types/vendors";

export type JobStatus = "planned" | "in_progress" | "on_hold" | "completed";

export type Job = {
  id: string;
  user_id: string;
  client_id: string;
  vendor_id: string;
  title: string | null;
  description: string | null;
  status: JobStatus | null;
  price: number | null;
  scheduled_date: string | null; // date (YYYY-MM-DD)
  created_at: string;

  clients?: Client | null;
  vendors?: Vendor | null;
};

