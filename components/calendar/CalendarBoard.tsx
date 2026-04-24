"use client";

import { useEffect, useMemo, useState } from "react";
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
import { createClient } from "@/lib/supabase/client";
import type { Job, JobStatus } from "@/lib/types/jobs";
import { CalendarJobModal } from "@/components/calendar/CalendarJobModal";

type Props = {
  initialJobs: Job[];
};

type ViewMode = "month" | "biweek" | "week";

function toISODate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function startOfWeekMonday(d: Date) {
  const x = new Date(d);
  const day = x.getDay(); // 0..6 (sun..sat)
  const delta = (day + 6) % 7; // monday=0
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - delta);
  return x;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function sameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function monthLabel(d: Date) {
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function rangeLabel(start: Date, end: Date) {
  try {
    const sameYear = start.getFullYear() === end.getFullYear();
    const sameMonth = sameYear && start.getMonth() === end.getMonth();
    const left = start.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: sameYear ? undefined : "numeric",
    });
    const right = end.toLocaleDateString(undefined, {
      month: sameMonth ? undefined : "short",
      day: "numeric",
      year: "numeric",
    });
    return `${left} – ${right}`;
  } catch {
    return `${toISODate(start)} – ${toISODate(end)}`;
  }
}

function statusColor(status: JobStatus | null | undefined) {
  switch (status) {
    case "completed":
      return "bg-emerald-600/10 text-emerald-800 ring-emerald-200";
    case "in_progress":
      return "bg-sky-600/10 text-sky-800 ring-sky-200";
    case "on_hold":
      return "bg-rose-600/10 text-rose-800 ring-rose-200";
    default:
      return "bg-zinc-700/5 text-zinc-800 ring-zinc-200";
  }
}

function DayCell({
  day,
  inMonth,
  children,
}: {
  day: string;
  inMonth: boolean;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `day:${day}` });
  return (
    <div
      ref={setNodeRef}
      className={`min-h-[120px] rounded-2xl border bg-white p-2 ring-1 ring-zinc-100 transition ${
        inMonth ? "border-zinc-200" : "border-zinc-100 opacity-70"
      } ${isOver ? "scale-[1.01] ring-2 ring-sky-300/35 shadow-[0_16px_45px_rgba(2,132,199,0.12)]" : ""}`}
    >
      {children}
    </div>
  );
}

function JobPill({
  job,
  onClick,
  overlay,
}: {
  job: Job;
  onClick: () => void;
  overlay?: boolean;
}) {
  const id = `job:${job.id}`;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
  });

  const style: React.CSSProperties | undefined = overlay
    ? { transform: undefined, willChange: "transform", touchAction: "none" }
    : transform
      ? {
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
          willChange: "transform",
          touchAction: "none",
        }
      : { willChange: "transform", touchAction: "none" };

  const frame = overlay
    ? "ring-0 shadow-xl border-zinc-100"
    : "ring-1 border-zinc-200 shadow-sm";

  return (
    <button
      ref={setNodeRef}
      style={style}
      type="button"
      {...(overlay ? {} : attributes)}
      {...(overlay ? {} : listeners)}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={`w-full cursor-grab rounded-xl border px-2 py-1 text-left text-xs font-semibold transition active:cursor-grabbing ${frame} ${statusColor(
        job.status,
      )} ${isDragging && !overlay ? "opacity-0" : ""}`}
      title={job.title ?? undefined}
    >
      <span className="block truncate">
        {job.title?.trim() ? job.title : "Untitled job"}
      </span>
      <span className="block truncate text-[11px] font-medium opacity-80">
        {job.clients?.name ?? "Client"} → {job.vendors?.name ?? "Vendor"}
      </span>
    </button>
  );
}

export function CalendarBoard({ initialJobs }: Props) {
  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [view, setView] = useState<ViewMode>("month");
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  useEffect(() => {
    setJobs(initialJobs);
  }, [initialJobs]);

  const { days, dayToJobs, unscheduled } = useMemo(() => {
    const days: { date: Date; key: string; inMonth: boolean }[] = [];

    if (view === "month") {
      const first = startOfMonth(anchorDate);
      const startWeekday = (first.getDay() + 6) % 7; // monday=0
      const gridStart = addDays(first, -startWeekday);
      for (let i = 0; i < 42; i++) {
        const d = addDays(gridStart, i);
        days.push({ date: d, key: toISODate(d), inMonth: sameMonth(d, anchorDate) });
      }
    } else if (view === "biweek") {
      const start = startOfWeekMonday(anchorDate);
      for (let i = 0; i < 14; i++) {
        const d = addDays(start, i);
        days.push({ date: d, key: toISODate(d), inMonth: true });
      }
    } else {
      const start = startOfWeekMonday(anchorDate);
      for (let i = 0; i < 7; i++) {
        const d = addDays(start, i);
        days.push({ date: d, key: toISODate(d), inMonth: true });
      }
    }

    const map = new Map<string, Job[]>();
    const unscheduled: Job[] = [];

    for (const j of jobs) {
      if (!j.scheduled_date) {
        unscheduled.push(j);
        continue;
      }
      const list = map.get(j.scheduled_date) ?? [];
      list.push(j);
      map.set(j.scheduled_date, list);
    }

    for (const [k, list] of map) {
      list.sort((a, b) => {
        const ta = new Date(a.created_at).getTime();
        const tb = new Date(b.created_at).getTime();
        return tb - ta;
      });
      map.set(k, list);
    }
    unscheduled.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return { days, dayToJobs: map, unscheduled };
  }, [jobs, anchorDate, view]);

  const headerText = useMemo(() => {
    if (view === "month") return monthLabel(anchorDate);
    const start = startOfWeekMonday(anchorDate);
    const span = view === "biweek" ? 13 : 6;
    const end = addDays(start, span);
    return rangeLabel(start, end);
  }, [anchorDate, view]);

  const selectedJob = useMemo(
    () => jobs.find((j) => j.id === selectedJobId) ?? null,
    [jobs, selectedJobId],
  );

  async function setScheduledDate(jobId: string, date: string | null) {
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, scheduled_date: date } : j)),
    );
    const supabase = createClient();
    const { error } = await supabase
      .from("jobs")
      .update({ scheduled_date: date })
      .eq("id", jobId);
    if (error) {
      alert(error.message);
    }
  }

  function onDragStart(e: DragStartEvent) {
    const id = String(e.active.id);
    if (id.startsWith("job:")) setActiveJobId(id.slice("job:".length));
  }

  async function onDragEnd(e: DragEndEvent) {
    setActiveJobId(null);
    const activeId = String(e.active.id);
    const overId = e.over?.id ? String(e.over.id) : null;
    if (!overId) return;
    if (!activeId.startsWith("job:")) return;
    if (!overId.startsWith("day:")) return;

    const jobId = activeId.slice("job:".length);
    const day = overId.slice("day:".length);
    await setScheduledDate(jobId, day);
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-zinc-900">{headerText}</p>
          <p className="text-sm text-zinc-600">
            Drag projects to reschedule. Click one to view details.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-xl bg-white ring-1 ring-zinc-200">
            <button
              type="button"
              onClick={() => setView("week")}
              className={`px-3 py-2 text-sm font-semibold ${
                view === "week"
                  ? "bg-sky-600 text-white"
                  : "text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              Week
            </button>
            <button
              type="button"
              onClick={() => setView("biweek")}
              className={`px-3 py-2 text-sm font-semibold ${
                view === "biweek"
                  ? "bg-sky-600 text-white"
                  : "text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              2 weeks
            </button>
            <button
              type="button"
              onClick={() => setView("month")}
              className={`px-3 py-2 text-sm font-semibold ${
                view === "month"
                  ? "bg-sky-600 text-white"
                  : "text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              Month
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setAnchorDate((d) => {
                if (view === "month") return new Date(d.getFullYear(), d.getMonth() - 1, 1);
                if (view === "biweek") return addDays(d, -14);
                return addDays(d, -7);
              });
            }}
            className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
          >
            ←
          </button>
          <button
            type="button"
            onClick={() => setAnchorDate(new Date())}
            className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => {
              setAnchorDate((d) => {
                if (view === "month") return new Date(d.getFullYear(), d.getMonth() + 1, 1);
                if (view === "biweek") return addDays(d, 14);
                return addDays(d, 7);
              });
            }}
            className="rounded-xl bg-white px-3 py-2 text-sm font-semibold text-zinc-700 ring-1 ring-zinc-200 hover:bg-zinc-50"
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <div key={d} className="px-2 text-xs font-semibold text-zinc-500">
            {d}
          </div>
        ))}
      </div>

      <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-7">
          {days.map(({ date, key, inMonth }) => {
            const list = dayToJobs.get(key) ?? [];
            const display = list.slice(0, 3);
            const more = list.length - display.length;
            const isToday = key === toISODate(new Date());
            return (
              <DayCell key={key} day={key} inMonth={inMonth}>
                <div className="mb-2 flex items-center justify-between">
                  <span
                    className={`text-xs font-semibold ${
                      isToday ? "text-sky-700" : "text-zinc-700"
                    }`}
                  >
                    {date.getDate()}
                  </span>
                  {isToday ? (
                    <span className="rounded-full bg-sky-600/10 px-2 py-0.5 text-[11px] font-semibold text-sky-700 ring-1 ring-sky-200">
                      today
                    </span>
                  ) : null}
                </div>

                <div className="space-y-1">
                  {display.map((j) => (
                    <JobPill
                      key={j.id}
                      job={j}
                      onClick={() => setSelectedJobId(j.id)}
                    />
                  ))}
                  {more > 0 ? (
                    <div className="rounded-xl bg-zinc-50 px-2 py-1 text-[11px] font-semibold text-zinc-600 ring-1 ring-zinc-200">
                      +{more} more
                    </div>
                  ) : null}
                </div>
              </DayCell>
            );
          })}
        </div>

        <div className="mt-6 rounded-3xl bg-white p-5 ring-1 ring-zinc-200">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-zinc-900">Unscheduled</p>
            <span className="rounded-full bg-zinc-50 px-2 py-0.5 text-xs font-semibold text-zinc-600 ring-1 ring-zinc-200">
              {unscheduled.length}
            </span>
          </div>
          <p className="mt-1 text-sm text-zinc-600">
            Drag a job onto a day to schedule it.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {unscheduled.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-center text-sm text-zinc-600">
                No unscheduled jobs.
              </div>
            ) : (
              unscheduled.map((j) => (
                <JobPill
                  key={j.id}
                  job={j}
                  onClick={() => setSelectedJobId(j.id)}
                />
              ))
            )}
          </div>
        </div>

        <DragOverlay>
          {activeJobId ? (
            <div className="w-[320px]">
              <JobPill
                job={jobs.find((j) => j.id === activeJobId) as Job}
                onClick={() => {}}
                overlay
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <CalendarJobModal
        job={selectedJob}
        open={selectedJobId !== null}
        onClose={() => setSelectedJobId(null)}
        onUpdated={(jobId, next) =>
          setJobs((prev) => prev.map((j) => (j.id === jobId ? { ...j, ...next } : j)))
        }
      />
    </div>
  );
}

