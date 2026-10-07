import { btnGhost } from "../ui";

export default function Pagination({
  offset,
  limit,
  total,
  onChange,
}: {
  offset: number;
  limit: number;
  total: number;
  onChange: (offset: number) => void;
}) {
  return (
    <div className="mt-3 flex items-center gap-3 text-sm text-slate-400">
      <button className={btnGhost} disabled={offset === 0} onClick={() => onChange(Math.max(0, offset - limit))}>
        Previous
      </button>
      <span>
        {total === 0 ? "0" : `${offset + 1}-${Math.min(offset + limit, total)}`} of {total}
      </span>
      <button className={btnGhost} disabled={offset + limit >= total} onClick={() => onChange(offset + limit)}>
        Next
      </button>
    </div>
  );
}

// Header cell that sorts when clicked. The arrow is a text symbol, so it works without colour.
export function SortTh({
  label,
  sortKey,
  sort,
  dir,
  onSort,
}: {
  label: string;
  sortKey?: string;
  sort: string;
  dir: "asc" | "desc";
  onSort: (key: string) => void;
}) {
  if (!sortKey) return <th className="pb-2 pr-3 font-normal">{label}</th>;
  const active = sort === sortKey;
  return (
    <th className="pb-2 pr-3 font-normal" aria-sort={active ? (dir === "asc" ? "ascending" : "descending") : "none"}>
      <button type="button" className="hover:text-slate-100" onClick={() => onSort(sortKey)}>
        {label} {active ? (dir === "asc" ? "▲" : "▼") : ""}
      </button>
    </th>
  );
}
