"use client";

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Option = { value: string; label: string };

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder: string;
  /** Shown on the button when `options` is empty */
  emptyMessage?: string;
  disabled?: boolean;
};

const PANEL_Z = 200;
const GAP = 4;

/**
 * Replaces a native &lt;select&gt; in scrollable / overflow containers (e.g. modals).
 * The list is portaled to `document.body` with `position: fixed` so the browser does
 * not miscalculate or jump the menu when a long list scrolls in the parent.
 */
export function PortalSelect({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
  emptyMessage = "No options",
  disabled: disabledProp,
}: Props) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
  } | null>(null);
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const listboxId = useId();
  const disabled = disabledProp || options.length === 0;

  useEffect(() => {
    setMounted(true);
  }, []);

  const updatePos = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vh = window.innerHeight;
    const maxH = Math.max(100, Math.min(260, vh - r.bottom - GAP * 2));
    setPos({
      top: r.bottom + GAP,
      left: r.left,
      width: r.width,
      maxHeight: maxH,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    updatePos();
  }, [open, updatePos, value, options.length]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => setOpen(false);
    const scrollOpts: AddEventListenerOptions = { capture: true, passive: true };
    // Inner scroll in modals does not always reach `window` — include scrollable parents.
    const withScroll: Element[] = [];
    const walk = (el: HTMLElement | null) => {
      let p: Element | null = el;
      while (p) {
        const s = getComputedStyle(p);
        if (/auto|scroll|overlay/.test(s.overflowY + s.overflowX)) {
          p.addEventListener("scroll", onScroll, scrollOpts);
          withScroll.push(p);
        }
        p = p.parentElement;
      }
    };
    walk(triggerRef.current);
    window.addEventListener("scroll", onScroll, scrollOpts);
    return () => {
      window.removeEventListener("scroll", onScroll, scrollOpts);
      for (const el of withScroll) {
        el.removeEventListener("scroll", onScroll, scrollOpts);
      }
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onRe = () => {
      if (open) updatePos();
    };
    window.addEventListener("resize", onRe);
    return () => window.removeEventListener("resize", onRe);
  }, [open, updatePos]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || listRef.current?.contains(t)) {
        return;
      }
      setOpen(false);
    };
    const t0 = setTimeout(
      () => document.addEventListener("mousedown", onDown),
      0,
    );
    return () => {
      clearTimeout(t0);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  const selected = options.find((o) => o.value === value);
  const showLabel = selected?.label ?? (options.length ? placeholder : emptyMessage);

  return (
    <div className="w-full">
      <label htmlFor={id} className="block text-sm font-medium text-zinc-700">
        {label}
      </label>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        role="combobox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-haspopup="listbox"
        onClick={() => {
          if (disabled) return;
          setOpen((o) => !o);
        }}
        className="mt-1 flex w-full items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-left text-sm text-zinc-900 shadow-sm outline-none ring-1 ring-zinc-100 hover:bg-zinc-50/50 focus:ring-2 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span
          className={
            !selected && options.length
              ? "min-w-0 text-zinc-500"
              : "min-w-0 truncate"
          }
        >
          {options.length ? showLabel : emptyMessage}
        </span>
        <Chevron className="h-4 w-4 shrink-0 text-zinc-500" open={open} />
      </button>
      {mounted && open && pos
        ? createPortal(
            <div
              ref={listRef}
              id={listboxId}
              role="listbox"
              className="overflow-y-auto overscroll-contain rounded-xl border border-zinc-200 bg-white py-1 text-sm shadow-lg ring-1 ring-zinc-200"
              style={{
                position: "fixed",
                top: pos.top,
                left: pos.left,
                width: pos.width,
                maxHeight: pos.maxHeight,
                zIndex: PANEL_Z,
              }}
            >
              {options.map((o) => {
                const isSel = o.value === value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="option"
                    aria-selected={isSel}
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    className={`flex w-full px-3 py-2 text-left text-zinc-900 hover:bg-sky-50 ${
                      isSel ? "bg-sky-50/80 font-semibold" : ""
                    }`}
                  >
                    {o.label}
                  </button>
                );
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

function Chevron({ className, open }: { className?: string; open: boolean }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
      style={{ transform: open ? "rotate(180deg)" : undefined }}
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.48l3.72-3.25a.75.75 0 1 1 1.04 1.08l-4.25 3.7a.75.75 0 0 1-1.02 0l-4.25-3.7a.75.75 0 0 1 .01-1.1Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
