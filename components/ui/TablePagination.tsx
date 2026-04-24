import Link from "next/link";
import { TABLE_PAGE_SIZE } from "@/lib/pagination-constants";

type Props = {
  page: number;
  pageSize?: number;
  total: number;
  buildPageHref: (page: number) => string;
};

/**
 * “Showing a–b of c” with prev/next. Hidden when `total` is 0.
 */
export function TablePagination({
  page,
  pageSize = TABLE_PAGE_SIZE,
  total,
  buildPageHref,
}: Props) {
  if (total === 0) return null;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className="flex flex-col items-stretch justify-between gap-3 border-t border-zinc-200 bg-zinc-50/80 px-4 py-3 sm:flex-row sm:items-center sm:px-3">
      <p className="text-sm text-zinc-600">
        Showing{" "}
        <span className="font-medium text-zinc-900">
          {from}–{end}
        </span>{" "}
        of <span className="font-medium text-zinc-900">{total}</span>
      </p>
      <div className="flex items-center justify-end gap-2">
        {page > 1 ? (
          <Link
            href={buildPageHref(page - 1)}
            className="inline-flex min-w-[4.5rem] justify-center rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-sm font-semibold text-zinc-800 ring-1 ring-zinc-100 transition hover:bg-zinc-50"
            scroll={false}
          >
            Previous
          </Link>
        ) : (
          <span className="inline-flex min-w-[4.5rem] cursor-not-allowed justify-center rounded-xl border border-zinc-100 bg-zinc-100/80 px-3 py-1.5 text-sm font-medium text-zinc-400">
            Previous
          </span>
        )}
        <span className="px-1 text-sm tabular-nums text-zinc-500">
          {page} / {totalPages}
        </span>
        {page < totalPages ? (
          <Link
            href={buildPageHref(page + 1)}
            className="inline-flex min-w-[4.5rem] justify-center rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-sm font-semibold text-zinc-800 ring-1 ring-zinc-100 transition hover:bg-zinc-50"
            scroll={false}
          >
            Next
          </Link>
        ) : (
          <span className="inline-flex min-w-[4.5rem] cursor-not-allowed justify-center rounded-xl border border-zinc-100 bg-zinc-100/80 px-3 py-1.5 text-sm font-medium text-zinc-400">
            Next
          </span>
        )}
      </div>
    </div>
  );
}
