import { can } from "@shared/permissions";
import type { ListKind } from "@shared/lists";
import { useAuth } from "../../lib/auth";
import { btnGhost } from "../ui";

// CSV of the current filters, sort and visible columns. The server builds it (up to 5000 rows) and records it in the audit log.
export default function ExportLink({ kind, query, columns }: { kind: ListKind; query: string; columns: string[] }) {
  const { user } = useAuth();
  if (!can(user?.role, "list:export")) return null;
  const qs = new URLSearchParams(query);
  qs.set("columns", columns.join(","));
  return (
    <a className={btnGhost} href={`/api/admin/lists/${kind}/export.csv?${qs}`} download>
      Export CSV
    </a>
  );
}
