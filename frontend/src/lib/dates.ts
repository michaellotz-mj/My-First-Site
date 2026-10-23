// Local-time day boundaries for the Today morning clear-out. Uses the device's own time zone.

/** Midnight at the start of the given moment's local day. */
export function startOfLocalDay(now: Date = new Date()): Date {
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/** "2026-10-22" for the given moment's local day; changes at local midnight. */
export function localDayKey(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}
