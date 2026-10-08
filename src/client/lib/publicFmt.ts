// Display helpers for the public site. All calendar days are UTC days (same rule as the server).
export function fmtDay(date: string): string {
  const d = new Date(`${date}T00:00:00.000Z`);
  return Number.isNaN(d.getTime())
    ? date
    : d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

// "2026-10-14T00:00:00.000Z" -> local date (and time when it is not midnight UTC)
export function fmtUnlock(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return iso.endsWith("T00:00:00.000Z")
    ? d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
    : d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export const TYPE_LABEL: Record<string, string> = { daily: "Daily", weekly: "Weekly", note: "Killzone note" };
export const CONFIDENCE_LABEL: Record<string, string> = { high: "High", medium: "Medium", low: "Low" };
export const SENTIMENT_LABEL: Record<string, string> = { risk_on: "Risk-on", risk_off: "Risk-off", mixed: "Mixed" };
export const DEFAULT_DISCLAIMER =
  "Research and education only. Not financial advice. Past performance is not indicative of future results.";
