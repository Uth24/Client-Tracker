const STORAGE_KEY = "client-track:skip-delete-confirm";

/** When true, destructive actions run without opening the confirmation modal. */
export function readSkipDeleteConfirm(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeSkipDeleteConfirm(skip: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (skip) window.localStorage.setItem(STORAGE_KEY, "1");
    else window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* private mode / quota */
  }
}

/** Clears the preference so confirmations show again (e.g. from Settings later). */
export function clearSkipDeleteConfirm(): void {
  writeSkipDeleteConfirm(false);
}
