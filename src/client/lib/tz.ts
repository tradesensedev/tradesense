import { useCallback, useState } from "react";
import type { Killzone } from "@shared/constants";
import { KILLZONE_REF_TZ, KILLZONE_WINDOWS } from "@shared/killzones";
import { useAuth } from "./auth";

// Offset (ms) of a timezone from UTC at a given instant. Intl knows daylight-saving rules, so nothing is hard-coded.
function offsetMs(utcMs: number, tz: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(utcMs));
  const g = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"), g("second")) - Math.floor(utcMs / 1000) * 1000;
}

// "2026-10-07" + "08:30" read as wall-clock time in `tz` -> UTC milliseconds.
export function zonedToUtc(date: string, hhmm: string, tz: string): number {
  const [y, m, d] = date.split("-").map(Number) as [number, number, number];
  const [h, mi] = hhmm.split(":").map(Number) as [number, number];
  const guess = Date.UTC(y, m - 1, d, h, mi);
  const first = guess - offsetMs(guess, tz);
  return guess - offsetMs(first, tz); // second pass fixes the hour around a daylight-saving change
}

export function isValidTz(tz: string | null | undefined): tz is string {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

// "02:00-05:00" of a killzone, shown in the viewer's timezone. `refDate` (a UTC day) decides daylight saving.
export function fmtWindow(k: Killzone, refDate: string, tz: string): string {
  const w = KILLZONE_WINDOWS[k];
  const f = (hhmm: string) =>
    new Date(zonedToUtc(refDate, hhmm, KILLZONE_REF_TZ)).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: tz });
  return `${f(w.start)}-${f(w.end)}`;
}

export const COMMON_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Dhaka",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
];

const KEY = "ts_tz";

// Chosen timezone: remembered choice -> account timezone -> browser timezone -> UTC.
export function useTimezone(): [string, (tz: string) => void, string[]] {
  const { user } = useAuth();
  const [tz, setTz] = useState<string>(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(KEY);
    } catch {
      saved = null;
    }
    const browser = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return [saved, user?.timezone, browser].find(isValidTz) ?? "UTC";
  });
  const set = useCallback((next: string) => {
    if (!isValidTz(next)) return;
    setTz(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* private mode: the choice just is not remembered */
    }
  }, []);
  const options = COMMON_TIMEZONES.includes(tz) ? COMMON_TIMEZONES : [tz, ...COMMON_TIMEZONES];
  return [tz, set, options];
}
