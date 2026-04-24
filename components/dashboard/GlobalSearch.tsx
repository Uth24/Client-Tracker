"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Client } from "@/lib/types/clients";
import type { Vendor } from "@/lib/types/vendors";
import type { Job } from "@/lib/types/jobs";
import { SearchHitsSkeleton, InlineSpinner } from "@/components/ui/Skeleton";

type Result =
  | { kind: "client"; id: string; title: string; subtitle?: string; href: string }
  | { kind: "vendor"; id: string; title: string; subtitle?: string; href: string }
  | { kind: "job"; id: string; title: string; subtitle?: string; href: string };

function isErrorWithMessage(e: unknown): e is { message: string } {
  return (
    typeof e === "object" &&
    e !== null &&
    "message" in e &&
    typeof (e as { message?: unknown }).message === "string"
  );
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delayMs);
    return () => window.clearTimeout(t);
  }, [value, delayMs]);
  return debounced;
}

export function GlobalSearch() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const debouncedQ = useDebouncedValue(q, 180);

  useEffect(() => {
    // Close on route change.
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isK = e.key.toLowerCase() === "k";
      const isCmdK = (e.metaKey || e.ctrlKey) && isK;
      if (isCmdK) {
        e.preventDefault();
        setOpen(true);
        requestAnimationFrame(() => inputRef.current?.focus());
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    async function run() {
      const query = debouncedQ.trim();
      if (!open) return;
      if (query.length < 2) {
        setResults([]);
        setError(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const supabase = createClient();
        const pattern = `%${query}%`;

        const [clientsRes, vendorsRes, jobsRes] = await Promise.all([
          supabase
            .from("clients")
            .select("id, name, email, phone")
            .or(`name.ilike.${pattern},email.ilike.${pattern},phone.ilike.${pattern}`)
            .limit(5),
          supabase
            .from("vendors")
            .select("id, name, type")
            .or(`name.ilike.${pattern},type.ilike.${pattern},description.ilike.${pattern}`)
            .limit(5),
          supabase
            .from("jobs")
            .select("id, title, description, status")
            .or(`title.ilike.${pattern},description.ilike.${pattern}`)
            .limit(5),
        ]);

        const anyErr = clientsRes.error ?? vendorsRes.error ?? jobsRes.error;
        if (anyErr) throw anyErr;

        const next: Result[] = [];

        for (const c of (clientsRes.data ?? []) as Pick<
          Client,
          "id" | "name" | "email" | "phone"
        >[]) {
          next.push({
            kind: "client",
            id: c.id,
            title: c.name,
            subtitle: c.email ?? c.phone ?? undefined,
            href: "/clients",
          });
        }

        for (const v of (vendorsRes.data ?? []) as Pick<Vendor, "id" | "name" | "type">[]) {
          next.push({
            kind: "vendor",
            id: v.id,
            title: v.name,
            subtitle: v.type ?? undefined,
            href: "/vendors",
          });
        }

        for (const j of (jobsRes.data ?? []) as Pick<Job, "id" | "title" | "description" | "status">[]) {
          next.push({
            kind: "job",
            id: j.id,
            title: j.title?.trim() ? j.title : "Untitled job",
            subtitle: j.status ?? undefined,
            href: "/projects",
          });
        }

        setResults(next);
      } catch (e: unknown) {
        const msg = isErrorWithMessage(e) ? e.message : "Search failed";
        setError(msg);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }
    void run();
  }, [debouncedQ, open]);

  const grouped = useMemo(() => {
    const clients = results.filter((r) => r.kind === "client");
    const vendors = results.filter((r) => r.kind === "vendor");
    const jobs = results.filter((r) => r.kind === "job");
    return { clients, vendors, jobs };
  }, [results]);

  return (
    <div className="relative hidden md:block">
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
        className="flex items-center gap-2 rounded-xl bg-zinc-100 px-3 py-2 ring-1 ring-zinc-200 hover:bg-zinc-50"
      >
        <SearchIcon className="h-4 w-4 text-zinc-500" />
        <span className="text-sm text-zinc-500">Search</span>
        <span className="ml-8 rounded-md bg-white px-1.5 py-0.5 text-[11px] font-medium text-zinc-500 ring-1 ring-zinc-200">
          ⌘K
        </span>
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+10px)] z-50 w-[520px] overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-[0_20px_80px_rgba(0,0,0,0.18)] ring-1 ring-zinc-100">
          <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3">
            <div className="flex items-center gap-2">
              <SearchIcon className="h-4 w-4 text-zinc-500" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search clients, vendors, and jobs…"
                className="w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-500"
              />
              {loading && debouncedQ.trim().length >= 2 ? (
                <span className="shrink-0" title="Loading">
                  <InlineSpinner className="h-4 w-4" />
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg bg-white px-2 py-1 text-xs font-semibold text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50"
              >
                Esc
              </button>
            </div>
          </div>

          <div className="max-h-[420px] overflow-y-auto p-2">
            {error ? (
              <div className="rounded-2xl px-3 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {loading && debouncedQ.trim().length >= 2 ? <SearchHitsSkeleton /> : null}

            {!loading && !error && debouncedQ.trim().length >= 2 && results.length === 0 ? (
              <div className="rounded-2xl px-3 py-3 text-sm text-zinc-600">
                No results.
              </div>
            ) : null}

            {!loading ? (
              <>
                <ResultSection title="Clients" items={grouped.clients} onPick={() => setOpen(false)} />
                <ResultSection title="Vendors" items={grouped.vendors} onPick={() => setOpen(false)} />
                <ResultSection title="Jobs" items={grouped.jobs} onPick={() => setOpen(false)} />
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ResultSection({
  title,
  items,
  onPick,
}: {
  title: string;
  items: Result[];
  onPick: () => void;
}) {
  if (items.length === 0) return null;
  return (
    <div className="mb-2">
      <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
        {title}
      </p>
      <div className="space-y-1">
        {items.map((r) => (
          <Link
            key={`${r.kind}-${r.id}`}
            href={r.href}
            onClick={onPick}
            className="block rounded-2xl px-3 py-2 hover:bg-sky-50/70"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-900">
                  {r.title}
                </p>
                {r.subtitle ? (
                  <p className="truncate text-xs text-zinc-600">{r.subtitle}</p>
                ) : null}
              </div>
              <span className="shrink-0 rounded-full bg-zinc-900 px-2 py-0.5 text-[11px] font-semibold text-white">
                {r.kind}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M10.5 18.5a8 8 0 1 1 0-16 8 8 0 0 1 0 16Z"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.9"
      />
      <path
        d="M16.5 16.5 21 21"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  );
}

