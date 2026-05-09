const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(s: string): boolean {
  return UUID_RE.test(s);
}

/** Parses `services` URL param: comma- or space-separated vendor_service_options ids. */
export function parseServiceFilterParam(raw: string | null | undefined): string[] {
  if (raw == null || !String(raw).trim()) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of String(raw).split(/[,\s]+/)) {
    const id = part.trim();
    if (!id || !isUuid(id) || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}
