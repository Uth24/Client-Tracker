import type { HTMLAttributes } from "react";

/**
 * Inert block placeholder. Pair with `skeleton-shimmer` in globals for the moving sheen,
 * or use `animate-pulse` for a simple pulse.
 */
export function Skeleton({
  className = "",
  ...rest
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`skeleton-shimmer min-h-0 ${className}`}
      aria-hidden
      {...rest}
    />
  );
}

export function InlineSpinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <span
      className={`inline-block shrink-0 ${className} animate-spin rounded-full border-2 border-zinc-200 border-t-sky-600`}
      role="status"
      aria-label="Loading"
    />
  );
}

/** Shown while a dashboard route segment loads (search, calendar, list pages, etc.). */
export function DashboardPageSkeleton() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <Skeleton className="h-3.5 w-20 rounded-md" />
          <Skeleton className="h-8 w-40 rounded-lg sm:w-48" />
          <Skeleton className="h-4 w-full max-w-md rounded-md" />
          <Skeleton className="h-4 w-full max-w-sm rounded-md" />
        </div>
        <div className="mt-2 flex gap-2 sm:mt-0">
          <Skeleton className="h-10 w-32 rounded-xl" />
          <Skeleton className="h-10 w-32 rounded-xl" />
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div
            key={i}
            className="rounded-3xl border border-zinc-200/80 bg-white/80 p-4 ring-1 ring-zinc-100"
          >
            <Skeleton className="h-3.5 w-20 rounded" />
            <Skeleton className="mt-3 h-9 w-12 rounded-lg" />
            <Skeleton className="mt-2 h-3 w-28 rounded" />
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="min-h-[220px] rounded-3xl border border-zinc-200/80 bg-white/80 p-4 ring-1 ring-zinc-100">
          <Skeleton className="h-4 w-36 rounded-md" />
          <div className="mt-4 space-y-3">
            {Array.from({ length: 5 }, (_, j) => (
              <div key={j} className="flex gap-3">
                <Skeleton className="h-12 flex-1 rounded-2xl" />
              </div>
            ))}
          </div>
        </div>
        <div className="min-h-[220px] rounded-3xl border border-zinc-200/80 bg-white/80 p-4 ring-1 ring-zinc-100">
          <Skeleton className="h-4 w-28 rounded-md" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 4 }, (_, j) => (
              <Skeleton key={j} className="h-4 w-full rounded-md" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function SearchHitsSkeleton() {
  return (
    <div className="space-y-2 px-1" aria-busy="true" aria-label="Loading results">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl px-2 py-2.5">
          <Skeleton className="h-10 flex-1 rounded-2xl" />
        </div>
      ))}
    </div>
  );
}
