import { Badge } from "../ui";

// Outcome is always an icon AND a word (never colour alone). null = no result yet.
export function OutcomeBadge({ outcome, corrected }: { outcome: string | null; corrected?: boolean }) {
  const badge =
    outcome === "correct" ? <Badge tone="green">✓ Correct</Badge>
    : outcome === "wrong" ? <Badge tone="red">✗ Wrong</Badge>
    : outcome === "partial" ? <Badge tone="amber">◐ Partial</Badge>
    : <Badge>○ Pending</Badge>;
  return corrected ? <span className="inline-flex items-center gap-1">{badge}<span className="text-xs text-slate-400">corrected</span></span> : badge;
}
