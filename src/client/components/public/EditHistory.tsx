import type { PublicEditEntry } from "@shared/editHistory";
import { fmtDateTime } from "../../lib/dates";

// "Edited after publication": when and WHICH parts changed (never the old text, never who). Hidden when there are no edits.
export default function EditHistory({ entries }: { entries: PublicEditEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <section className="space-y-2" aria-label="Edit history">
      <h3 className="text-sm font-semibold text-slate-100">Edited after publication ({entries.length})</h3>
      <ul className="space-y-1 text-sm text-slate-300">
        {entries.map((e, i) => (
          <li key={`${e.editedAt}-${i}`}>
            <span className="text-slate-400">{fmtDateTime(e.editedAt)}:</span> {e.fields.length ? e.fields.join(", ") : "minor changes"}
          </li>
        ))}
      </ul>
    </section>
  );
}
