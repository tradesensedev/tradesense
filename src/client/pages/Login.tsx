import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { isStaff } from "@shared/permissions";
import { ApiError, api } from "../lib/api";
import { useAuth } from "../lib/auth";

const input = "w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-slate-400";
const button = "w-full rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-900 disabled:opacity-50";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [mode, setMode] = useState<"staff" | "member">("staff");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [totp, setTotp] = useState("");
  const [needTotp, setNeedTotp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function submitStaff(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const user = await login(email, password, needTotp ? totp : undefined);
      nav(isStaff(user.role) ? "/admin" : "/");
    } catch (err) {
      if (err instanceof ApiError && err.code === "totp_required") setNeedTotp(true);
      else setError(err instanceof Error ? err.message : "Sign-in failed");
    } finally {
      setBusy(false);
    }
  }

  async function submitMember(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await api("/api/auth/magic/request", { method: "POST", body: { email } });
      setInfo("If the address is valid, a sign-in link has been sent. It expires in 15 minutes.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not send the link");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto max-w-sm py-8">
      <h1 className="text-xl font-semibold">Sign in</h1>
      <div className="mt-4 flex gap-2 text-sm">
        {(["staff", "member"] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setError(null); setInfo(null); }}
            className={`rounded-md px-3 py-1 ${mode === m ? "bg-slate-100 text-slate-900" : "border border-slate-700 text-slate-300"}`}
          >
            {m === "staff" ? "Staff" : "Member"}
          </button>
        ))}
      </div>

      {mode === "staff" ? (
        <form onSubmit={submitStaff} className="mt-4 space-y-3">
          <input className={input} type="email" placeholder="Email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <input className={input} type="password" placeholder="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {needTotp && (
            <input className={input} inputMode="numeric" maxLength={6} placeholder="6-digit authentication code" value={totp} onChange={(e) => setTotp(e.target.value)} autoFocus />
          )}
          <button className={button} disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
        </form>
      ) : (
        <form onSubmit={submitMember} className="mt-4 space-y-3">
          <p className="text-sm text-slate-400">Enter your email and we will send a one-time sign-in link.</p>
          <input className={input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <button className={button} disabled={busy}>{busy ? "Sending..." : "Email me a link"}</button>
        </form>
      )}

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
      {info && <p className="mt-3 text-sm text-green-400">{info}</p>}
    </main>
  );
}
