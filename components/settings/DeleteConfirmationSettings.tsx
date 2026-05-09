"use client";

import { useEffect, useState } from "react";
import {
  readSkipDeleteConfirm,
  writeSkipDeleteConfirm,
} from "@/lib/delete-confirm-preference";

export function DeleteConfirmationSettings() {
  const [mounted, setMounted] = useState(false);
  /** When true, the delete confirmation modal is shown (default). */
  const [alwaysAskBeforeDelete, setAlwaysAskBeforeDelete] = useState(true);

  useEffect(() => {
    setMounted(true);
    setAlwaysAskBeforeDelete(!readSkipDeleteConfirm());
  }, []);

  function updateAlwaysAsk(next: boolean) {
    setAlwaysAskBeforeDelete(next);
    writeSkipDeleteConfirm(!next);
  }

  return (
    <section
      className="rounded-3xl bg-white p-6 ring-1 ring-zinc-200"
      aria-labelledby="settings-delete-heading"
    >
      <h2
        id="settings-delete-heading"
        className="text-sm font-semibold uppercase tracking-wide text-zinc-500"
      >
        Safety
      </h2>
      <p className="mt-2 text-sm text-zinc-600">
        Control whether you see a confirmation dialog before removing clients,
        vendors, leads, projects, or catalog services.
      </p>

      {!mounted ? (
        <div
          className="mt-6 h-14 animate-pulse rounded-2xl bg-zinc-100"
          aria-hidden
        />
      ) : (
        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-900">
              Ask before deleting
            </p>
            <p className="mt-0.5 text-xs text-zinc-500">
              When off, deletes run immediately after you click delete (same as
              unchecking the box in the confirmation dialog).
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={alwaysAskBeforeDelete}
            onClick={() => updateAlwaysAsk(!alwaysAskBeforeDelete)}
            className={`flex h-9 w-16 shrink-0 cursor-pointer items-center rounded-full p-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 focus-visible:ring-offset-2 ${
              alwaysAskBeforeDelete
                ? "justify-end bg-sky-600"
                : "justify-start bg-zinc-300"
            }`}
          >
            <span className="pointer-events-none block h-7 w-7 rounded-full bg-white shadow ring-1 ring-black/5" />
            <span className="sr-only">
              {alwaysAskBeforeDelete ? "On" : "Off"}
            </span>
          </button>
        </div>
      )}
    </section>
  );
}
