import type { AttachmentDto } from "@shared/content";
import type { AttachmentRow } from "../repositories/types";

// Never expose r2Key to the browser. Files are only reachable through the authorized /files/:id route.
export function toAttachmentDto(a: AttachmentRow): AttachmentDto {
  return {
    id: a.id,
    ownerType: a.ownerType,
    ownerId: a.ownerId,
    kind: a.kind,
    mime: a.mime,
    size: a.size,
    sha256: a.sha256,
    caption: a.caption,
    access: a.access,
    uploadedBy: a.uploadedBy,
    uploadedAt: a.uploadedAt,
    locked: a.locked,
    url: `/files/${a.id}`,
  };
}
