"use client";

import { useEffect } from "react";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: "md" | "lg" | "xl";
};

const sizeClass = {
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
} as const;

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        className={`relative z-10 flex max-h-[min(90vh,900px)] w-full flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900 ${sizeClass[size]}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title ? (
          <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
            <h2
              id="modal-title"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        ) : null}
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
