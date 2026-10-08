// Public edit history (Phase 4): what was changed on a published post or note, and when.
// Only field LABELS and times are public. Old text and the editor's identity never leave the server.
export interface PublicEditEntry {
  editedAt: string;
  fields: string[]; // human labels, e.g. ["Summary", "Tags"]
}

// Fields that can change after publish (see EDITABLE_AFTER_PUBLISH in the post and note services).
const LABELS: Record<string, string> = {
  title: "Title",
  summary: "Summary",
  bodyMd: "Body",
  keyDriversMd: "Key drivers",
  riskEventsMd: "Risk events",
  invalidationMd: "Invalidation",
  noteMd: "Note text",
  sentiment: "Sentiment",
  confidence: "Confidence",
  access: "Access level",
  analystId: "Analyst",
  tagIds: "Tags",
};

// Unknown keys (a future field) fall back to a readable form of the key itself, e.g. "validUntil" -> "Valid until".
export function editFieldLabel(key: string): string {
  const known = LABELS[key];
  if (known) return known;
  const words = key.replace(/Md$/, "").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  return words.charAt(0).toUpperCase() + words.slice(1);
}
