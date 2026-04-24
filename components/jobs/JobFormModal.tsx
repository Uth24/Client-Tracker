"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import type { Client } from "@/lib/types/clients";
import type { Vendor } from "@/lib/types/vendors";
import type { Job, JobStatus } from "@/lib/types/jobs";
import { formatClientError } from "@/lib/format-error";
import { Modal } from "@/components/ui/Modal";

type Props = {
  mode: "add" | "edit";
  job?: Job | null;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  clients: Client[];
  vendors: Vendor[];
};

const statusOptions: { value: JobStatus; label: string }[] = [
  { value: "planned", label: "Pending" },
  { value: "in_progress", label: "In process" },
  { value: "on_hold", label: "On hold" },
  { value: "completed", label: "Finished" },
];

function toDateInputValue(value: string | null | undefined) {
  if (!value) return "";
  // scheduled_date is already a YYYY-MM-DD string when fetched from Supabase
  return value;
}

export function JobFormModal({
  mode,
  job,
  open,
  onClose,
  onSaved,
  clients,
  vendors,
}: Props) {
  const [clientId, setClientId] = useState("");
  const [vendorId, setVendorId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<JobStatus>("planned");
  const [price, setPrice] = useState<string>("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canSubmit = useMemo(() => {
    return clientId.trim().length > 0 && vendorId.trim().length > 0;
  }, [clientId, vendorId]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (mode === "edit" && job) {
      setClientId(job.client_id);
      setVendorId(job.vendor_id);
      setTitle(job.title ?? "");
      setDescription(job.description ?? "");
      setStatus((job.status ?? "planned") as JobStatus);
      setPrice(job.price === null || job.price === undefined ? "" : String(job.price));
      setScheduledDate(toDateInputValue(job.scheduled_date));
    } else {
      setClientId(clients[0]?.id ?? "");
      setVendorId(vendors[0]?.id ?? "");
      setTitle("");
      setDescription("");
      setStatus("planned");
      setPrice("");
      setScheduledDate("");
    }
  }, [open, mode, job?.id, clients, vendors]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!canSubmit) {
      setError("Please select a client and a vendor.");
      return;
    }

    const supabase = createBrowserSupabase();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be signed in.");
      return;
    }

    const parsedPrice =
      price.trim() === "" ? null : Number.isFinite(Number(price)) ? Number(price) : NaN;
    if (parsedPrice !== null && Number.isNaN(parsedPrice)) {
      setError("Price must be a valid number.");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        client_id: clientId,
        vendor_id: vendorId,
        title: title.trim() || null,
        description: description.trim() || null,
        status,
        price: parsedPrice,
        scheduled_date: scheduledDate.trim() || null,
      };

      if (mode === "add") {
        const { error: insErr } = await supabase.from("jobs").insert(payload);
        if (insErr) throw insErr;
      } else if (job) {
        const { error: upErr } = await supabase
          .from("jobs")
          .update({
            client_id: payload.client_id,
            vendor_id: payload.vendor_id,
            title: payload.title,
            description: payload.description,
            status: payload.status,
            price: payload.price,
            scheduled_date: payload.scheduled_date,
          })
          .eq("id", job.id);
        if (upErr) throw upErr;
      }

      onSaved();
      onClose();
    } catch (err: unknown) {
      setError(formatClientError(err));
    } finally {
      setSaving(false);
    }
  }

  const titleLabel = mode === "add" ? "New job" : "Edit job";
  const saveLabel = mode === "add" ? "Create job" : "Save";

  return (
    <Modal open={open} onClose={onClose} title={titleLabel} size="xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="job-client"
              className="block text-sm font-medium text-zinc-700"
            >
              Client
            </label>
            <select
              id="job-client"
              required
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none ring-1 ring-zinc-100 focus:ring-2 focus:ring-sky-200"
            >
              {clients.length === 0 ? (
                <option value="" disabled>
                  No clients yet
                </option>
              ) : (
                clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="job-vendor"
              className="block text-sm font-medium text-zinc-700"
            >
              Vendor
            </label>
            <select
              id="job-vendor"
              required
              value={vendorId}
              onChange={(e) => setVendorId(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none ring-1 ring-zinc-100 focus:ring-2 focus:ring-sky-200"
            >
              {vendors.length === 0 ? (
                <option value="" disabled>
                  No vendors yet
                </option>
              ) : (
                vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="job-title"
              className="block text-sm font-medium text-zinc-700"
            >
              Title (optional)
            </label>
            <input
              id="job-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Pool cleaning"
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none ring-1 ring-zinc-100 focus:ring-2 focus:ring-sky-200"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="job-status"
                className="block text-sm font-medium text-zinc-700"
              >
                Status
              </label>
              <select
                id="job-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as JobStatus)}
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none ring-1 ring-zinc-100 focus:ring-2 focus:ring-sky-200"
              >
                {statusOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="job-price"
                className="block text-sm font-medium text-zinc-700"
              >
                Price (optional)
              </label>
              <input
                id="job-price"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g. 250"
                className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none ring-1 ring-zinc-100 focus:ring-2 focus:ring-sky-200"
              />
            </div>
          </div>
        </div>

        <div>
          <label
            htmlFor="job-desc"
            className="block text-sm font-medium text-zinc-700"
          >
            Description (optional)
          </label>
          <textarea
            id="job-desc"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What work is being done?"
            className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none ring-1 ring-zinc-100 focus:ring-2 focus:ring-sky-200"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label
              htmlFor="job-scheduled-date"
              className="block text-sm font-medium text-zinc-700"
            >
              Scheduled date (optional)
            </label>
            <input
              id="job-scheduled-date"
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none ring-1 ring-zinc-100 focus:ring-2 focus:ring-sky-200"
            />
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-600">
            This job connects a <span className="font-medium">client</span> to a{" "}
            <span className="font-medium">vendor</span> and tracks status over time.
          </div>
        </div>

        {clients.length === 0 || vendors.length === 0 ? (
          <p className="text-sm text-amber-700 dark:text-amber-400" role="status">
            You need at least 1 client and 1 vendor before you can create a job.
          </p>
        ) : null}

        {error ? (
          <p className="text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-700">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !canSubmit || clients.length === 0 || vendors.length === 0}
            className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : saveLabel}
          </button>
        </div>
      </form>
    </Modal>
  );
}

