"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { createClient as createBrowserSupabase } from "@/lib/supabase/client";
import type { Client } from "@/lib/types/clients";
import type { Vendor } from "@/lib/types/vendors";
import type { Job, JobStatus } from "@/lib/types/jobs";
import { JobFormModal } from "@/components/jobs/JobFormModal";

type Props = {
  initialJobs: Job[];
  clients: Client[];
  vendors: Vendor[];
};

const statusMeta: Record<
  JobStatus,
  {
    label: string;
    sortOrder: number;
    headerClass: string;
    borderClass: string;
    glowClass: string;
  }
> = {
  planned: {
    label: "Pending",
    sortOrder: 1,
    headerClass: "bg-sky-600",
    borderClass: "border-sky-200 dark:border-sky-900/60",
    glowClass: "ring-sky-400/30 shadow-[0_0_0_1px_rgba(56,189,248,0.10),0_16px_50px_rgba(2,132,199,0.18)]",
  },
  in_progress: {
    label: "In process",
    sortOrder: 2,
    headerClass: "bg-emerald-600",
    borderClass: "border-emerald-200 dark:border-emerald-900/60",
    glowClass:
      "ring-emerald-400/30 shadow-[0_0_0_1px_rgba(52,211,153,0.10),0_16px_50px_rgba(5,150,105,0.18)]",
  },
  on_hold: {
    label: "On hold",
    sortOrder: 3,
    headerClass: "bg-rose-600",
    borderClass: "border-rose-200 dark:border-rose-900/60",
    glowClass: "ring-rose-400/30 shadow-[0_0_0_1px_rgba(251,113,133,0.10),0_16px_50px_rgba(225,29,72,0.18)]",
  },
  completed: {
    label: "Finished",
    sortOrder: 4,
    headerClass: "bg-orange-600",
    borderClass: "border-orange-200 dark:border-orange-900/60",
    glowClass:
      "ring-orange-400/30 shadow-[0_0_0_1px_rgba(251,146,60,0.10),0_16px_50px_rgba(234,88,12,0.18)]",
  },
};

const STATUS_ORDER: JobStatus[] = ["planned", "in_progress", "on_hold", "completed"];

function jobSortKey(job: Job) {
  const primary = job.scheduled_date ? `${job.scheduled_date}T00:00:00Z` : null;
  return primary ?? job.created_at;
}

function formatDateLabel(job: Job) {
  const raw = job.scheduled_date ?? job.created_at;
  try {
    const d = new Date(raw);
    return d.toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return raw;
  }
}

function shortText(text: string | null, max = 70) {
  if (!text?.trim()) return "—";
  const t = text.trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

function statusFromUnknown(value: Job["status"]): JobStatus {
  if (value === "planned" || value === "in_progress" || value === "on_hold" || value === "completed") {
    return value;
  }
  return "planned";
}

function nextStatus(status: JobStatus): JobStatus | null {
  const idx = STATUS_ORDER.indexOf(status);
  if (idx < 0 || idx === STATUS_ORDER.length - 1) return null;
  return STATUS_ORDER[idx + 1] ?? null;
}

function prevStatus(status: JobStatus): JobStatus | null {
  const idx = STATUS_ORDER.indexOf(status);
  if (idx <= 0) return null;
  return STATUS_ORDER[idx - 1] ?? null;
}

function ColumnDropZone({
  id,
  status,
  children,
}: {
  id: string;
  status: JobStatus;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={
        isOver
          ? `scale-[1.01] ring-2 ${statusMeta[status].glowClass} transition-transform duration-150`
          : "transition-transform duration-150"
      }
    >
      {children}
    </div>
  );
}

function JobCard({
  job,
  onEdit,
  onDelete,
  onMoveTo,
  dragging,
  overlay,
}: {
  job: Job;
  onEdit: () => void;
  onDelete: () => void;
  onMoveTo: (status: JobStatus) => void;
  dragging: boolean;
  overlay?: boolean;
}) {
  const id = `job:${job.id}`;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
  });

  const style: React.CSSProperties | undefined = overlay
    ? {
        transform: undefined,
        willChange: "transform",
        touchAction: "none",
      }
    : transform
      ? {
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
          willChange: "transform",
          touchAction: "none",
        }
      : { willChange: "transform", touchAction: "none" };

  const status = statusFromUnknown(job.status);
  const prev = prevStatus(status);
  const next = nextStatus(status);

  const cardFrame = overlay
    ? "border-zinc-100 ring-0 shadow-xl"
    : "border-zinc-200 ring-1 ring-zinc-100 shadow-sm";

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(overlay ? {} : attributes)}
      {...(overlay ? {} : listeners)}
      className={`rounded-2xl border bg-white p-3 transition ${cardFrame} ${
        isDragging && !overlay ? "opacity-0 shadow-none" : ""
      } cursor-grab active:cursor-grabbing`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-zinc-900">
            {job.title?.trim() ? job.title : "Untitled job"}
          </div>
          <div className="mt-0.5 truncate text-xs text-zinc-600">
            <span className="text-zinc-900">
              {job.clients?.name ?? "—"}
            </span>
            <span className="text-zinc-500"> → </span>
            <span className="text-zinc-700">
              {job.vendors?.name ?? "—"}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-2 text-xs text-zinc-500">
        {formatDateLabel(job)}
        {job.description?.trim() ? (
          <span className="text-zinc-400"> • {shortText(job.description, 80)}</span>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onEdit}
          onPointerDownCapture={(e) => e.stopPropagation()}
          disabled={dragging}
          className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50 disabled:opacity-50"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          onPointerDownCapture={(e) => e.stopPropagation()}
          disabled={dragging}
          className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-50"
        >
          Delete
        </button>

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            disabled={!prev || dragging}
            onClick={() => prev && onMoveTo(prev)}
            onPointerDownCapture={(e) => e.stopPropagation()}
            className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50 disabled:opacity-40"
          >
            ←
          </button>
          <button
            type="button"
            disabled={!next || dragging}
            onClick={() => next && onMoveTo(next)}
            onPointerDownCapture={(e) => e.stopPropagation()}
            className="rounded-lg bg-white px-2.5 py-1.5 text-xs font-semibold text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50 disabled:opacity-40"
          >
            →
          </button>
        </div>
      </div>
    </div>
  );
}

export function JobList({ initialJobs, clients, vendors }: Props) {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editJob, setEditJob] = useState<Job | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  useEffect(() => {
    setJobs(initialJobs);
  }, [initialJobs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter((j) => {
      const client = j.clients?.name ?? "";
      const vendor = j.vendors?.name ?? "";
      const title = j.title ?? "";
      const desc = j.description ?? "";
      return [client, vendor, title, desc].some((t) =>
        t.toLowerCase().includes(q),
      );
    });
  }, [jobs, search]);

  const grouped = useMemo(() => {
    const map: Record<JobStatus, Job[]> = {
      planned: [],
      in_progress: [],
      on_hold: [],
      completed: [],
    };

    for (const j of filtered) {
      const s = statusFromUnknown(j.status);
      (map[s] ?? map.planned).push(j);
    }

    for (const key of Object.keys(map) as JobStatus[]) {
      map[key].sort((a, b) => {
        const da = new Date(jobSortKey(a)).getTime();
        const db = new Date(jobSortKey(b)).getTime();
        return db - da;
      });
    }

    return map;
  }, [filtered]);

  async function handleDelete(job: Job) {
    const who = `${job.clients?.name ?? "Client"} → ${job.vendors?.name ?? "Vendor"}`;
    if (!confirm(`Delete job "${job.title ?? who}"? This cannot be undone.`)) return;
    const supabase = createBrowserSupabase();
    const { error } = await supabase.from("jobs").delete().eq("id", job.id);
    if (error) {
      alert(error.message);
      return;
    }
    setJobs((prev) => prev.filter((x) => x.id !== job.id));
    if (editJob?.id === job.id) setEditJob(null);
    router.refresh();
  }

  function refreshFromServer() {
    router.refresh();
  }

  async function setJobStatus(jobId: string, status: JobStatus) {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, status } : j)),
    );
    const supabase = createBrowserSupabase();
    const { error } = await supabase
      .from("jobs")
      .update({ status })
      .eq("id", jobId);
    if (error) {
      alert(error.message);
      router.refresh();
    }
  }

  function onDragStart(e: DragStartEvent) {
    const id = String(e.active.id);
    setDraggingId(id);
    if (id.startsWith("job:")) setActiveJobId(id.slice("job:".length));
  }

  async function onDragEnd(e: DragEndEvent) {
    setDraggingId(null);
    setActiveJobId(null);
    const activeId = String(e.active.id);
    const overId = e.over?.id ? String(e.over.id) : null;
    if (!overId) return;
    if (!activeId.startsWith("job:")) return;

    const jobId = activeId.slice("job:".length);
    if (!jobId) return;

    if (!overId.startsWith("col:")) return;
    const next = overId.slice("col:".length) as JobStatus;
    if (!statusMeta[next]) return;

    const current = statusFromUnknown(jobs.find((j) => j.id === jobId)?.status ?? "planned");
    if (current === next) return;
    await setJobStatus(jobId, next);
  }

  const columns: { status: JobStatus; jobs: Job[] }[] = STATUS_ORDER.map((s) => ({
    status: s,
    jobs: grouped[s] ?? [],
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <label htmlFor="job-search" className="sr-only">
            Search jobs
          </label>
          <input
            id="job-search"
            type="search"
            placeholder="Search by client, vendor, title, or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 pl-9 text-zinc-900 outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">
            ⌕
          </span>
        </div>

        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          New job
        </button>
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="grid gap-6 lg:grid-cols-4">
          {columns.map(({ status, jobs: colJobs }) => (
            <ColumnDropZone key={status} id={`col:${status}`} status={status}>
              <div
                className={`overflow-hidden rounded-3xl border bg-white shadow-sm ring-1 ring-zinc-100 ${statusMeta[status].borderClass}`}
              >
                <div className={`${statusMeta[status].headerClass} px-4 py-3`}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-white">
                      {statusMeta[status].label}
                    </p>
                    <span className="rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold text-white">
                      {colJobs.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 p-3">
                  {colJobs.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center text-sm text-zinc-500">
                      Drop a job here.
                    </div>
                  ) : (
                    colJobs.map((j) => (
                      <JobCard
                        key={j.id}
                        job={j}
                        dragging={draggingId !== null}
                        onEdit={() => setEditJob(j)}
                        onDelete={() => handleDelete(j)}
                        onMoveTo={(next) => setJobStatus(j.id, next)}
                      />
                    ))
                  )}
                </div>
              </div>
            </ColumnDropZone>
          ))}
        </div>

        <DragOverlay>
          {activeJobId ? (
            <div className="w-[340px]">
              <JobCard
                job={jobs.find((j) => j.id === activeJobId) as Job}
                dragging={true}
                overlay
                onEdit={() => {}}
                onDelete={() => {}}
                onMoveTo={() => {}}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <JobFormModal
        key="job-form-add"
        mode="add"
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={refreshFromServer}
        clients={clients}
        vendors={vendors}
      />

      <JobFormModal
        key={editJob ? `job-form-edit-${editJob.id}` : "job-form-edit-idle"}
        mode="edit"
        job={editJob}
        open={editJob !== null}
        onClose={() => setEditJob(null)}
        onSaved={refreshFromServer}
        clients={clients}
        vendors={vendors}
      />
    </div>
  );
}

