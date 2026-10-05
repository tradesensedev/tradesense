import { Hono } from "hono";
import type { AppEnv } from "../env";
import { AttachmentService } from "../services/attachments";

// The ONLY way to read a screenshot. R2 is never public; every request is authorized here.
const files = new Hono<AppEnv>();

files.get("/:id", async (c) => {
  const { att, object } = await new AttachmentService(c.var.repos, c.env.BUCKET).openFile(c.req.param("id"), c.var.user);
  const etag = `"${att.sha256}"`;
  const headers = new Headers({
    "Content-Type": att.mime,
    ETag: etag,
    "Cache-Control": "private, max-age=0, must-revalidate",
    "X-Content-Type-Options": "nosniff",
    "Content-Security-Policy": "default-src 'none'; sandbox",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  });
  if (c.req.header("if-none-match") === etag) return new Response(null, { status: 304, headers });
  headers.set("Content-Length", String(att.size));
  return new Response(object.body, { status: 200, headers });
});

export default files;
