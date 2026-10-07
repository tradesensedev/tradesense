import { Fragment, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { ROLES, type Role } from "@shared/constants";
import type { UserAdminDto } from "@shared/admin";
import Pagination from "../../components/list/Pagination";
import SavedViewsMenu from "../../components/list/SavedViewsMenu";
import SearchBox from "../../components/list/SearchBox";
import { Badge, Field, Notice, PageHeader, btnDanger, btnGhost, btnPrimary, inputCls } from "../../components/ui";
import { api, errorMessage } from "../../lib/api";
import { useAuth } from "../../lib/auth";
import { fmtDateTime } from "../../lib/dates";
import { useListState } from "../../lib/useListState";

const LIMIT = 25;
const SYSTEM_EMAIL = "system@tradesense.local";
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
type Msg = { kind: "error" | "success"; text: string } | null;

function NewUser({ onCreated }: { onCreated: () => void }) {
  const [f, setF] = useState({ email: "", name: "", role: "member" as Role, password: "", timezone: "UTC" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);
  const staff = f.role !== "member";

  async function create() {
    setBusy(true);
    setMsg(null);
    try {
      await api("/api/admin/users", { method: "POST", body: { ...f, password: f.password || undefined } });
      setF({ email: "", name: "", role: "member", password: "", timezone: "UTC" });
      onCreated();
    } catch (e) {
      setMsg({ kind: "error", text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mb-4 space-y-3 rounded-md border border-slate-800 p-4">
      <h2 className="font-medium">New user</h2>
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Email"><input type="email" className={inputCls} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Name"><input className={inputCls} maxLength={100} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Role">
          <select className={inputCls} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value as Role })}>{ROLES.map((r) => <option key={r} value={r}>{cap(r)}</option>)}</select>
        </Field>
        <Field label="Timezone"><input className={inputCls} value={f.timezone} onChange={(e) => setF({ ...f, timezone: e.target.value })} /></Field>
        <Field label={staff ? "Password (required for staff)" : "Password (optional, members sign in by email link)"} hint="At least 10 characters.">
          <input type="password" autoComplete="new-password" className={inputCls} value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        </Field>
      </div>
      <button className={btnPrimary} disabled={busy || !f.email || !f.name || (staff && f.password.length < 10)} onClick={() => void create()}>
        {busy ? "Creating..." : "Create user"}
      </button>
    </section>
  );
}

// Everything an admin can do to one user. Each action is its own audited call on the server.
function UserPanel({ u, isSelf, onChanged }: { u: UserAdminDto; isSelf: boolean; onChanged: () => void }) {
  const [name, setName] = useState(u.name);
  const [timezone, setTimezone] = useState(u.timezone);
  const [role, setRole] = useState<Role>(u.role);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<Msg>(null);

  async function run(ok: string, call: () => Promise<unknown>) {
    setBusy(true);
    setMsg(null);
    try {
      await call();
      setMsg({ kind: "success", text: ok });
      onChanged();
    } catch (e) {
      setMsg({ kind: "error", text: errorMessage(e) });
    } finally {
      setBusy(false);
    }
  }
  const post = (path: string, body: object) => api(`/api/admin/users/${u.id}${path}`, { method: "POST", body });

  return (
    <div className="space-y-4 rounded-md border border-slate-700 bg-slate-900/50 p-3">
      {msg && <Notice kind={msg.kind}>{msg.text}</Notice>}
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Name"><input className={inputCls} value={name} maxLength={100} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Timezone"><input className={inputCls} value={timezone} onChange={(e) => setTimezone(e.target.value)} /></Field>
        <div className="flex items-end">
          <button className={btnPrimary} disabled={busy || !name.trim() || (name === u.name && timezone === u.timezone)}
            onClick={() => void run("Profile saved.", () => api(`/api/admin/users/${u.id}`, { method: "PATCH", body: { name, timezone } }))}>Save profile</button>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <Field label="Role" hint={isSelf ? "You cannot change your own role." : "Changing the role signs the user out."}>
          <select className={inputCls} value={role} disabled={isSelf} onChange={(e) => setRole(e.target.value as Role)}>{ROLES.map((r) => <option key={r} value={r}>{cap(r)}</option>)}</select>
        </Field>
        <button className={btnGhost} disabled={busy || isSelf || role === u.role}
          onClick={() => window.confirm(`Change ${u.name} to ${role}? They will be signed out.`) && void run("Role changed.", () => post("/role", { role }))}>Change role</button>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <Field label="Reset password" hint="At least 10 characters. Signs the user out everywhere.">
          <input type="password" autoComplete="new-password" className={inputCls} value={password} onChange={(e) => setPassword(e.target.value)} />
        </Field>
        <button className={btnGhost} disabled={busy || password.length < 10}
          onClick={() => window.confirm(`Reset the password for ${u.name}?`) && void run("Password reset.", async () => { await post("/password", { password }); setPassword(""); })}>Reset password</button>
      </div>

      {u.totpEnabled && (
        <div>
          <button className={btnDanger} disabled={busy}
            onClick={() => window.confirm(`Turn off two-step sign-in for ${u.name}? They set it up again at next sign-in.`) && void run("Two-step sign-in turned off.", () => post("/totp/disable", { confirm: true }))}>
            Turn off two-step sign-in
          </button>
        </div>
      )}
    </div>
  );
}

export default function UsersPage() {
  const { user: me } = useAuth();
  const qc = useQueryClient();
  const ls = useListState(LIMIT);
  const [showNew, setShowNew] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  const list = useQuery({
    queryKey: ["users", ls.apiQuery],
    queryFn: () => api<{ items: UserAdminDto[]; total: number }>(`/api/admin/users?${ls.apiQuery}`),
    placeholderData: keepPreviousData,
  });
  const items = list.data?.items ?? [];
  const total = list.data?.total ?? 0;
  const refresh = () => void qc.invalidateQueries({ queryKey: ["users"] });
  const f = ls.filters;

  return (
    <>
      <PageHeader title="Users">
        <button className={btnPrimary} onClick={() => setShowNew((v) => !v)}>{showNew ? "Close" : "New user"}</button>
      </PageHeader>
      {showNew && <NewUser onCreated={() => { setShowNew(false); refresh(); }} />}

      <div className="mb-3 flex flex-wrap items-center gap-2">
        <select className={`${inputCls} w-auto`} value={f.role ?? ""} onChange={(e) => ls.set({ role: e.target.value })} aria-label="Role">
          <option value="">All roles</option>{ROLES.map((r) => <option key={r} value={r}>{cap(r)}</option>)}
        </select>
        <div className="w-64"><SearchBox value={f.q ?? ""} onChange={(v) => ls.set({ q: v })} placeholder="Search name or email" /></div>
        {ls.hasFilters && <button className={btnGhost} onClick={ls.clear}>Clear filters</button>}
        <span className="mr-auto" />
        <SavedViewsMenu scope="users" filters={ls.filters} columns={[]} onApply={(v) => ls.replaceFilters(v.filters)} />
      </div>

      {list.isError && <Notice kind="error">{errorMessage(list.error)}</Notice>}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-slate-400">
            <tr><th className="pb-2 pr-3 font-normal">Name</th><th className="pr-3 font-normal">Email</th><th className="pr-3 font-normal">Role</th><th className="pr-3 font-normal">Password</th><th className="pr-3 font-normal">Two-step</th><th className="pr-3 font-normal">Created</th><th /></tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <Fragment key={u.id}>
                <tr className="border-t border-slate-800">
                  <td className="py-2 pr-3">{u.name}{u.id === me?.id && <span className="ml-1 text-xs text-slate-400">(you)</span>}</td>
                  <td className="pr-3">{u.email}</td>
                  <td className="pr-3"><Badge tone={u.role === "admin" ? "red" : u.role === "member" ? "slate" : "blue"}>{cap(u.role)}</Badge></td>
                  <td className="pr-3">{u.hasPassword ? "Set" : "None"}</td>
                  <td className="pr-3">{u.totpEnabled ? "On" : "Off"}</td>
                  <td className="pr-3 whitespace-nowrap">{fmtDateTime(u.createdAt)}</td>
                  <td className="text-right">
                    {u.email === SYSTEM_EMAIL ? <span className="text-xs text-slate-500">System account</span> : (
                      <button className={btnGhost} aria-expanded={openId === u.id} onClick={() => setOpenId(openId === u.id ? null : u.id)}>{openId === u.id ? "Close" : "Manage"}</button>
                    )}
                  </td>
                </tr>
                {openId === u.id && <tr><td colSpan={7} className="pb-3"><UserPanel u={u} isSelf={u.id === me?.id} onChanged={refresh} /></td></tr>}
              </Fragment>
            ))}
          </tbody>
        </table>
        {list.data && items.length === 0 && <p className="py-4 text-sm text-slate-400">No users match.</p>}
        {list.isLoading && <p className="py-4 text-sm text-slate-400">Loading...</p>}
      </div>
      <Pagination offset={ls.offset} limit={LIMIT} total={total} onChange={(o) => ls.set({ offset: o ? String(o) : "" })} />
    </>
  );
}
