/**
 * Extracts a numeric value from strings like "0.3%", "175K", "4.75%", "-45000".
 * Handles %, K, M, B suffixes. Returns null if no number is found.
 */
function parseNumeric(raw: string | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  const trimmed = raw.trim();
  const match = trimmed.match(/-?\d+(\.\d+)?/);
  if (!match) return null;

  let value = parseFloat(match[0]);
  if (/K$/i.test(trimmed)) value *= 1_000;
  if (/M$/i.test(trimmed)) value *= 1_000_000;
  if (/B$/i.test(trimmed)) value *= 1_000_000_000;
  return value;
}

export type SurpriseTag = "beat expectations" | "missed expectations" | "met expectations";

/**
 * Compares an actual reading to its forecast.
 * Used for calendar_events (actual vs forecast) and indicators.
 */
export function tagEconomicSurprise(
  actual: string | null | undefined,
  forecast: string | null | undefined
): SurpriseTag | null {
  const actualNum = parseNumeric(actual);
  const forecastNum = parseNumeric(forecast);
  if (actualNum === null || forecastNum === null) return null;

  if (actualNum > forecastNum) return "beat expectations";
  if (actualNum < forecastNum) return "missed expectations";
  return "met expectations";
}

export type PositioningTag = "extreme positioning" | null;

/**
 * Flags a COT net position as "extreme" when it sits beyond the 80th
 * percentile (top or bottom 20%) of its own recent history for that pair.
 *
 * @param currentNet - this week's net position (e.g. noncommercialNet)
 * @param historicalNets - past net positions for the same pair/field
 */
export function tagCOTPositioning(
  currentNet: number,
  historicalNets: number[]
): PositioningTag {
  if (historicalNets.length < 5) return null; // not enough history yet

  const sorted = [...historicalNets].sort((a, b) => a - b);
  const idx = (p: number) => Math.floor((p / 100) * (sorted.length - 1));
  const p80 = sorted[idx(80)];
  const p20 = sorted[idx(20)];

  if (currentNet >= p80 || currentNet <= p20) return "extreme positioning";
  return null;
}
