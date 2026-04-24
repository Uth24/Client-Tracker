"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Job, JobStatus } from "@/lib/types/jobs";
import { Modal } from "@/components/ui/Modal";
import { formatClientError } from "@/lib/format-error";

type Props = {
  job: Job | null;
  open: boolean;
  onClose: () => void;
  onUpdated: (jobId: string, next: Partial<Job>) => void;
};

function statusLabel(status: JobStatus | null | undefined) {
  switch (status) {
    case "planned":
      return "Pending";
    case "in_progress":
      return "In process";
    case "on_hold":
      return "On hold";
    case "completed":
      return "Finished";
    default:
      return "Pending";
  }
}

function statusChip(status: JobStatus | null | undefined) {
  switch (status) {
    case "completed":
      return "bg-emerald-600/10 text-emerald-700 ring-emerald-200";
    case "in_progress":
      return "bg-sky-600/10 text-sky-700 ring-sky-200";
    case "on_hold":
      return "bg-rose-600/10 text-rose-700 ring-rose-200";
    default:
      return "bg-zinc-700/5 text-zinc-700 ring-zinc-200";
  }
}

export function CalendarJobModal({ job, open, onClose, onUpdated }: Props) {
  const [date, setDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setDate(job?.scheduled_date ?? "");
  }, [open, job?.id]);

  if (!job) return null;
  const jobId = job.id;

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const supabase = createClient();
      const nextDate = date.trim() || null;
      const { error: upErr } = await supabase
        .from("jobs")
        .update({ scheduled_date: nextDate })
        .eq("id", jobId);
      if (upErr) throw upErr;
      onUpdated(jobId, { scheduled_date: nextDate });
      onClose();
    } catch (e: unknown) {
      setError(formatClientError(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Project details" size="lg">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-zinc-900">
              {job.title?.trim() ? job.title : "Untitled job"}
            </p>
            <p className="mt-1 truncate text-sm text-zinc-600">
              {job.clients?.name ?? "Client"} → {job.vendors?.name ?? "Vendor"}
            </p>
          </div>
          <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusChip(
              job.status,
            )}`}
          >
            {statusLabel(job.status)}
          </span>
        </div>

        {job.description?.trim() ? (
          <div className="rounded-2xl bg-zinc-50 p-4 ring-1 ring-zinc-200">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Description
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-700">
              {job.description}
            </p>
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Scheduled date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-900 shadow-sm outline-none ring-1 ring-zinc-100 focus:ring-2 focus:ring-sky-200"
            />
            <p className="mt-1 text-xs text-zinc-500">
              Clear the date to make it “Unscheduled”.
            </p>
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600">
            Tip: you can also drag this job to another day on the calendar to
            reschedule.
          </div>
        </div>

        {error ? (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 border-t border-zinc-200 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

