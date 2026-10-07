import { useRef, useState } from "react";
import type { UploadResponse } from "@shared/attachments";
import { ATTACHMENT_ACCESS } from "@shared/constants";
import type { AttachmentDto } from "@shared/content";
import { api, apiForm, errorMessage } from "../../lib/api";
import { fmtDateTime } from "../../lib/dates";
import { Badge, Notice, btnDanger, btnGhost, btnPrimary, inputCls } from "../ui";

type Msg = { kind: "error" | "success"; text: string } | null;
type OwnerType = "post" | "note" | "result";

function Item({ a, canManage, readOnly, onChanged, setMsg }: { a: AttachmentDto; canManage: boolean; readOnly: boolean; onChanged: () => void; setMsg: (m: Msg) => void }) {
  const [caption, setCaption] = useState(a.caption);
  const put = async (body: object, ok: string) => {
    try {
      await api(`/api/admin/attachments/${a.id}`, { method: "PUT", body });
      setMsg({ kind: "success", text: ok });
      onChanged();
    } catch (e) {
      setMsg({ kind: "error", text: errorMessage(e) });
    }
  };
  const remove = async () => {
    if (!window.confirm("Delete this screenshot?")) return;
    try {
      await api(`/api/admin/attachments/${a.id}`, { method: "DELETE" });
      setMsg({ kind: "success", text: "Screenshot deleted." });
      onChanged();
    } catch (e) {
      setMsg({ kind: "error", text: errorMessage(e) });
    }
  };
  return (
    <li className="space-y-2 rounded-md border border-slate-800 p-3 text-sm">
      <a href={a.url} target="_blank" rel="noopener noreferrer"><img src={a.url} alt={a.caption || "Screenshot"} className="max-h-40 rounded border border-slate-700" /></a>
      <div className="flex flex-wrap gap-2">
        {a.locked ? <Badge tone="amber">Locked</Badge> : <Badge>Editable</Badge>}
        <Badge tone="blue">{a.kind.replace("_", " ")}</Badge>
        <span className="text-xs text-slate-400">{Math.round(a.size / 1024)} KB, uploaded {fmtDateTime(a.uploadedAt)}</span>
      </div>
      <p className="break-all font-mono text-[11px] text-slate-400">SHA-256 {a.sha256}</p>
      <div className="flex gap-2">
        <input className={inputCls} placeholder="Caption" value={caption} disabled={readOnly} onChange={(e) => setCaption(e.target.value)} />
        {caption !== a.caption && <button className={btnPrimary} onClick={() => void put({ caption }, "Caption saved.")}>Save</button>}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {canManage ? (
          <select className={`${inputCls} max-w-[11rem]`} value={a.access} onChange={(e) => void put({ access: e.target.value }, "Access updated.")}>
            {ATTACHMENT_ACCESS.map((x) => <option key={x} value={x}>{x === "inherit" ? "Access: same as post" : `Access: ${x}`}</option>)}
          </select>
        ) : (
          <Badge>Access: {a.access}</Badge>
        )}
        {!readOnly && <button className={btnDanger} disabled={a.locked} title={a.locked ? "Locked: this screenshot is final" : "Delete"} onClick={() => void remove()}>Delete</button>}
      </div>
    </li>
  );
}

export default function AttachmentsPanel(props: {
  ownerType: OwnerType;
  ownerId: string;
  items: AttachmentDto[];
  canUpload: boolean;
  canManage: boolean;
  readOnly: boolean;
  onChanged: () => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [captions, setCaptions] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const input = useRef<HTMLInputElement>(null);

  async function upload() {
    setBusy(true);
    setMsg(null);
    try {
      const fd = new FormData();
      fd.append("ownerType", props.ownerType);
      fd.append("ownerId", props.ownerId);
      files.forEach((f, i) => {
        fd.append("files", f);
        fd.append("captions", captions[i] ?? "");
      });
      const r = await apiForm<UploadResponse>("/api/admin/attachments", fd);
      const skipped = r.skipped.length ? ` Skipped: ${r.skipped.map((s) => `${s.name} (${s.reason})`).join(", ")}.` : "";
      setMsg({ kind: "success", text: `Uploaded ${r.items.length} file${r.items.length === 1 ? "" : "s"}.${skipped}` });
      setFiles([]);
      setCaptions([]);
      if (input.current) input.current.value = "";
      props.onChanged();
    } catch (e) {
      setMsg({ kind: "error", text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="space-y-3 rounded-md border border-slate-800 p-4">
      <h2 className="font-medium">{props.ownerType === "result" ? "Result screenshots" : "Screenshots"}</h2>
      <p className="text-xs text-slate-400">
        PNG, JPEG, WebP or GIF, up to 10 MB each. The server records a SHA-256 fingerprint and the upload time.{" "}
        {props.ownerType === "result" ? "Result screenshots are locked as soon as they are uploaded." : "Screenshots lock when the post or note is published."}
      </p>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      {props.canUpload && !props.readOnly && (
        <div className="space-y-2">
          <input ref={input} type="file" multiple accept="image/png,image/jpeg,image/webp,image/gif" className="text-sm"
            onChange={(e) => { const fl = [...(e.target.files ?? [])]; setFiles(fl); setCaptions(fl.map(() => "")); }} />
          {files.map((f, i) => (
            <div key={`${f.name}-${i}`} className="flex items-center gap-2 text-sm">
              <span className="w-40 shrink-0 truncate" title={f.name}>{f.name}</span>
              <input className={inputCls} placeholder="Caption (optional)" value={captions[i] ?? ""} onChange={(e) => setCaptions((c) => c.map((x, k) => (k === i ? e.target.value : x)))} />
            </div>
          ))}
          {files.length > 0 && (
            <div className="space-x-2">
              <button className={btnPrimary} disabled={busy} onClick={() => void upload()}>{busy ? "Uploading..." : `Upload ${files.length} file${files.length === 1 ? "" : "s"}`}</button>
              <button className={btnGhost} disabled={busy} onClick={() => { setFiles([]); setCaptions([]); if (input.current) input.current.value = ""; }}>Clear</button>
            </div>
          )}
        </div>
      )}
      <ul className="grid gap-3 sm:grid-cols-2">
        {props.items.map((a) => <Item key={a.id} a={a} canManage={props.canManage} readOnly={props.readOnly} onChanged={props.onChanged} setMsg={setMsg} />)}
      </ul>
      {props.items.length === 0 && <p className="text-sm text-slate-400">No screenshots yet.</p>}
    </section>
  );
}
