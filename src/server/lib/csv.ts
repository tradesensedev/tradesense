export interface CsvColumn<T> {
  id: string;
  label: string;
  value: (row: T) => string | number | null | undefined;
}

// Spreadsheet programs run cells that start with = + - @ (or tab/CR) as formulas. Prefix text cells with an apostrophe.
function cell(v: string | number | null | undefined): string {
  if (v === null || v === undefined) return "";
  let s = typeof v === "number" ? String(v) : v;
  if (typeof v === "string" && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// UTF-8 with a BOM so Excel opens non-ASCII text correctly; CRLF line endings.
export function toCsv<T>(columns: CsvColumn<T>[], rows: T[]): string {
  const lines = [columns.map((c) => cell(c.label)).join(",")];
  for (const row of rows) lines.push(columns.map((c) => cell(c.value(row))).join(","));
  return "\uFEFF" + lines.join("\r\n") + "\r\n";
}
