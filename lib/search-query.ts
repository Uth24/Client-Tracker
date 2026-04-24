/**
 * `ilike` search terms: commas break PostgREST `or()` so we turn them into spaces.
 */
export function normalizeTableSearchQ(raw: string | undefined | null): string {
  return (raw ?? "").trim().replace(/,/g, " ");
}

/**
 * For use inside `.or()`: `name.ilike.${p},email.ilike.${p}`. Values should not
 * include raw commas. `%` in user input is a wildcard in ILIKE—acceptable.
 */
export function likePattern(s: string): string {
  return `%${s}%`;
}
