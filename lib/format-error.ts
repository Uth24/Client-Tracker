/** Supabase / PostgREST errors are often plain objects with `message`, not `Error`. */
export function formatClientError(err: unknown): string {
  if (typeof err === "object" && err !== null) {
    const o = err as Record<string, unknown>;
    if (typeof o.message === "string" && o.message.length > 0) {
      return o.message;
    }
    if (typeof o.error_description === "string") {
      return o.error_description;
    }
  }
  if (err instanceof Error) return err.message;
  return "Something went wrong";
}
