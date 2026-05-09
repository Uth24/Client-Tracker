export type WebsitePresenceFilter = "any" | "yes" | "no";

/** URL query `has_website=yes|no` (omit for all vendors). */
export function parseWebsitePresenceParam(
  raw: string | null | undefined,
): WebsitePresenceFilter {
  const s = String(raw ?? "").toLowerCase().trim();
  if (s === "yes" || s === "1" || s === "true") return "yes";
  if (s === "no" || s === "0" || s === "false") return "no";
  return "any";
}

export function serializeWebsitePresenceParam(
  v: WebsitePresenceFilter,
): string | null {
  if (v === "any") return null;
  return v === "yes" ? "yes" : "no";
}
