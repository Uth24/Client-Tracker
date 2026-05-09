"use client";

import {
  VENDOR_RELATIONSHIP_LABEL,
  VENDOR_RELATIONSHIP_STATUSES,
  type VendorRelationshipStatus,
} from "@/lib/types/vendors";

type Props = {
  value: VendorRelationshipStatus;
  onChange: (next: VendorRelationshipStatus) => void;
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
  "flex flex-wrap gap-1 rounded-xl border border-zinc-200 bg-zinc-50 p-1 shadow-sm ring-1 ring-zinc-100";

const tabButtonClass = (active: boolean, disabled?: boolean) =>
  `min-h-[40px] flex-1 rounded-lg px-3 py-2 text-center text-sm font-semibold transition-colors sm:flex-none sm:px-4 ${
    active
      ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200"
      : "text-zinc-600 hover:bg-white/60 hover:text-zinc-900"
  } ${disabled ? "pointer-events-none opacity-50" : ""}`;

export function VendorPartnershipSegmented({
  value,
  onChange,
  ariaLabel,
  disabled,
  hint,
  hideLegend,
}: Props) {
  if (hideLegend) {
    return (
      <div className={tabShellClass} role="tablist" aria-label={ariaLabel}>
        {VENDOR_RELATIONSHIP_STATUSES.map((rel) => {
          const active = value === rel;
          return (
            <button
              key={rel}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={disabled}
              onClick={() => onChange(rel)}
              className={tabButtonClass(active, disabled)}
            >
              {VENDOR_RELATIONSHIP_LABEL[rel]}
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
              className={tabButtonClass(active, disabled)}
            >
              {VENDOR_RELATIONSHIP_LABEL[rel]}
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
