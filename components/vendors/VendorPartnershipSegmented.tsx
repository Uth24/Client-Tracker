"use client";

import {
  VENDOR_RELATIONSHIP_LABEL,
  VENDOR_RELATIONSHIP_STATUSES,
  type VendorRelationshipListTab,
} from "@/lib/types/vendors";

type Props = {
  value: VendorRelationshipListTab;
  onChange: (next: VendorRelationshipListTab) => void;
  /** e.g. "Partnership Status" — legend text when `hideLegend` is false; also used for aria-label on the control */
  ariaLabel: string;
  disabled?: boolean;
  /** Optional hint under the control (form mode only) */
  hint?: string;
  /**
   * List filters: use a tablist (`div` + `role="tab"`) so SSR markup matches the
   * prior structure and avoids hydration mismatches. Modal: `fieldset` + radiogroup.
   */
  hideLegend?: boolean;
};

const tabShellClass =
  "flex flex-wrap gap-1.5 rounded-2xl border border-zinc-200/90 bg-zinc-100/90 p-1.5 shadow-inner shadow-zinc-200/40 ring-1 ring-zinc-200/60";

const tabButtonBase =
  "min-h-[42px] flex-1 rounded-xl px-3 py-2 text-center text-sm font-semibold transition-all duration-150 sm:flex-none sm:px-4";

function activeTabSurfaceClass(rel: VendorRelationshipListTab): string {
  switch (rel) {
    case "all":
      return "bg-indigo-600 text-white shadow-md shadow-indigo-900/25 ring-2 ring-indigo-500/90 ring-offset-2 ring-offset-zinc-100";
    case "worked_with":
      return "bg-emerald-600 text-white shadow-md shadow-emerald-900/25 ring-2 ring-emerald-500/90 ring-offset-2 ring-offset-zinc-100";
    case "not_working_with":
      return "bg-rose-600 text-white shadow-md shadow-rose-900/25 ring-2 ring-rose-500/90 ring-offset-2 ring-offset-zinc-100";
    default:
      return "bg-amber-500 text-amber-950 shadow-md shadow-amber-900/20 ring-2 ring-amber-400/90 ring-offset-2 ring-offset-zinc-100";
  }
}

function listTabLabel(rel: VendorRelationshipListTab): string {
  if (rel === "all") return "All";
  return VENDOR_RELATIONSHIP_LABEL[rel];
}

function tabButtonClass(
  rel: VendorRelationshipListTab,
  active: boolean,
  disabled?: boolean,
) {
  const inactive =
    "text-zinc-600 hover:bg-white hover:text-zinc-900 hover:shadow-sm ring-1 ring-transparent hover:ring-zinc-200/90";
  const activeCls = activeTabSurfaceClass(rel);
  return `${tabButtonBase} ${
    active ? activeCls : inactive
  } ${disabled ? "pointer-events-none opacity-50" : ""}`;
}

export function VendorPartnershipSegmented({
  value,
  onChange,
  ariaLabel,
  disabled,
  hint,
  hideLegend,
}: Props) {
  if (hideLegend) {
    const tabs: VendorRelationshipListTab[] = [
      "all",
      ...VENDOR_RELATIONSHIP_STATUSES,
    ];
    return (
      <div className={tabShellClass} role="tablist" aria-label={ariaLabel}>
        {tabs.map((rel) => {
          const active = value === rel;
          return (
            <button
              key={rel}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={disabled}
              onClick={() => onChange(rel)}
              className={tabButtonClass(rel, active, disabled)}
            >
              {listTabLabel(rel)}
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <fieldset className="min-w-0 border-0 p-0">
      <legend className="block text-sm font-medium text-zinc-700">
        {ariaLabel}
      </legend>
      <div
        className={`mt-2 ${tabShellClass}`}
        role="radiogroup"
        aria-label={ariaLabel}
      >
        {VENDOR_RELATIONSHIP_STATUSES.map((rel) => {
          const active = value === rel;
          return (
            <button
              key={rel}
              type="button"
              role="radio"
              aria-checked={active}
              disabled={disabled}
              onClick={() => onChange(rel)}
              className={tabButtonClass(rel, active, disabled)}
            >
              {listTabLabel(rel)}
            </button>
          );
        })}
      </div>
      {hint ? (
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">{hint}</p>
      ) : null}
    </fieldset>
  );
}
