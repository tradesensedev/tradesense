import { Badge } from "../ui";

// Bias is always shown with an icon AND a word (never colour alone).
export function BiasBadge({ bias }: { bias: string }) {
  if (bias === "bullish") return <Badge tone="green">▲ Bullish</Badge>;
  if (bias === "bearish") return <Badge tone="red">▼ Bearish</Badge>;
  return <Badge>● Neutral</Badge>;
}

export function StatusBadge({ status }: { status: string }) {
  if (status === "published") return <Badge tone="green">Published</Badge>;
  if (status === "scheduled") return <Badge tone="amber">Scheduled</Badge>;
  return <Badge>Draft</Badge>;
}

export function AccessBadge({ access }: { access: string }) {
  return access === "paid" ? <Badge tone="amber">Paid</Badge> : <Badge tone="blue">Free</Badge>;
}

// Note status: icon + word, never colour alone.
export function NoteStatusBadge({ status }: { status: string }) {
  if (status === "followed") return <Badge tone="green">✓ Followed</Badge>;
  if (status === "non_followed") return <Badge tone="amber">✗ Not followed</Badge>;
  if (status === "invalidation") return <Badge tone="red">⚠ Invalidation</Badge>;
  return <Badge>● Neutral</Badge>;
}
