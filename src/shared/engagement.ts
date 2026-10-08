import { z } from "zod";

// Admin engagement numbers (Phase 4): how often published posts/notes are viewed and bookmarked.
// Counting rules: only OPEN views of published items; staff previews are not logged; a repeat view by the
// same viewer within 10 minutes counts once. "viewers" = distinct signed-in users (visitors count in `views` only).
const idString = z.string().min(1).max(40);

export const engagementQuery = z.object({
  type: z.enum(["post", "note"]),
  ids: z
    .string()
    .transform((s) => s.split(",").map((x) => x.trim()).filter(Boolean))
    .pipe(z.array(idString).min(1).max(90)),
});

export const viewersQuery = z.object({
  type: z.enum(["post", "note"]),
  id: idString,
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export interface EngagementDto {
  views: number;
  viewers: number;
  bookmarks: number;
}

export interface ViewerDto {
  userId: string;
  name: string;
  email: string;
  views: number;
  lastViewedAt: string;
}
