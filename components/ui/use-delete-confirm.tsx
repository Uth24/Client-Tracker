"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import {
  readSkipDeleteConfirm,
  writeSkipDeleteConfirm,
} from "@/lib/delete-confirm-preference";

export type DeleteConfirmArgs = {
  title: string;
  body: string;
};

/**
 * Promise-based delete confirmation with optional "don't ask again"
 * (stored in localStorage).
 */
export function useDeleteConfirmDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  /** When true, future deletes will still show this dialog (default). */
  const [alwaysWarn, setAlwaysWarn] = useState(true);
  const resolveRef = useRef<((ok: boolean) => void) | null>(null);

  const confirmDelete = useCallback(async (args: DeleteConfirmArgs) => {
    if (readSkipDeleteConfirm()) return true;
    setTitle(args.title);
    setBody(args.body);
    setAlwaysWarn(true);
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  }, []);

  const finish = useCallback((ok: boolean) => {
    setOpen(false);
    resolveRef.current?.(ok);
    resolveRef.current = null;
  }, []);

  const handleConfirm = useCallback(() => {
    if (!alwaysWarn) writeSkipDeleteConfirm(true);
    finish(true);
  }, [alwaysWarn, finish]);

  const handleCancel = useCallback(() => {
    finish(false);
  }, [finish]);

  const dialog = open ? (
    <Modal open title={title} onClose={handleCancel} size="sm">
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-zinc-700">{body}</p>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 ring-1 ring-zinc-100">
          <input
            type="checkbox"
            checked={alwaysWarn}
            onChange={(e) => setAlwaysWarn(e.target.checked)}
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 text-sky-600 focus:ring-sky-500"
          />
          <span className="text-sm leading-snug text-zinc-800">
            <span className="font-medium">Warn me before future deletes</span>
            <span className="mt-0.5 block text-xs font-normal text-zinc-500">
              Leave this on to see this confirmation every time. Uncheck it if
              you want the next deletes to run immediately without this dialog.
              Turn confirmations back on anytime under{" "}
              <Link
                href="/settings"
                className="font-medium text-sky-700 underline decoration-sky-300 underline-offset-2 hover:text-sky-900"
              >
                Settings
              </Link>
              .
            </span>
          </span>
        </label>
        <div className="flex flex-col-reverse gap-2 border-t border-zinc-200 pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 ring-1 ring-zinc-200 hover:bg-zinc-50"
          >
            No, cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
          >
            Yes, delete
          </button>
        </div>
      </div>
    </Modal>
  ) : null;

  return { confirmDelete, deleteConfirmDialog: dialog };
}
