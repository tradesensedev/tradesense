import type { Killzone } from "./constants";

// Typical killzone windows, written in New York time (the reference zone traders quote them in).
// The spec does not define exact hours, so they live HERE, in one place: edit this table to change them.
// The Matrix shows them converted to the viewer's chosen timezone. Informational only: they never affect access or dates.
export const KILLZONE_REF_TZ = "America/New_York";
export const KILLZONE_WINDOWS: Record<Killzone, { start: string; end: string }> = {
  asia: { start: "20:00", end: "00:00" },
  london: { start: "02:00", end: "05:00" },
  ny_am: { start: "07:00", end: "10:00" },
  ny_pm: { start: "13:30", end: "16:00" },
};
