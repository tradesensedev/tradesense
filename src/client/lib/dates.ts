// Posts are dated by UTC calendar day (same rule as the server).
export const utcToday = (): string => new Date().toISOString().slice(0, 10);

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

// Monday of the week containing the date (same rule as the server).
export function weekStartOf(date: string): string {
  const d = new Date(`${date}T00:00:00.000Z`);
  return addDays(date, -((d.getUTCDay() + 6) % 7));
}

export function fmtDateTime(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
