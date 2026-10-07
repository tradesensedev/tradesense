import { z } from "zod";
import { ATTACHMENT_ACCESS, ATTACHMENT_KINDS } from "./constants";
import type { AttachmentDto } from "./content";

// Multipart text fields that accompany the uploaded files. "result" screenshots are always locked on upload (DB trigger).
export const uploadFieldsSchema = z.object({
  ownerType: z.enum(["post", "note", "result"]),
  ownerId: z.string().min(1).max(40),
  kind: z.enum(ATTACHMENT_KINDS).optional(),
  access: z.enum(ATTACHMENT_ACCESS).optional(),
  caption: z.string().trim().max(300).optional(),
});
export type UploadFields = z.infer<typeof uploadFieldsSchema>;

export const attachmentListQuery = z.object({
  ownerType: z.enum(["post", "note", "result"]),
  ownerId: z.string().min(1).max(40),
});

export const updateAttachmentSchema = z
  .object({
    caption: z.string().trim().max(300),
    access: z.enum(ATTACHMENT_ACCESS),
  })
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, "Nothing to update");
export type UpdateAttachmentInput = z.infer<typeof updateAttachmentSchema>;

export interface UploadResponse {
  items: AttachmentDto[];
  skipped: { name: string; reason: string }[];
}
