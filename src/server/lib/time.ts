// All timestamps are ISO-8601 UTC TEXT. Dates are YYYY-MM-DD TEXT.
export function nowIso(): string {
  return new Date().toISOString();
}

export function addDaysIso(iso: string, days: number): string {
  const d = new Date(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

export function addMinutesIso(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

export function todayDate(): string {
  return nowIso().slice(0, 10);
}

// Monday of the ISO week containing the given YYYY-MM-DD date.
export function weekStartOf(date: string): string {
  const d = new Date(`${date}T00:00:00.000Z`);
  const dow = (d.getUTCDay() + 6) % 7; // Mon=0 ... Sun=6
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}
