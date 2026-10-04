import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../lib/auth";

export default function LoginVerify() {
  const [params] = useSearchParams();
  const { verifyMagic } = useAuth();
  const nav = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false); // links are single-use: never verify twice (React StrictMode runs effects twice in dev)

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const token = params.get("token");
    if (!token) {
      setError("Missing token");
      return;
    }
    verifyMagic(token)
      .then(() => nav("/", { replace: true }))
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Link invalid"));
  }, [params, verifyMagic, nav]);

  return (
    <main className="mx-auto max-w-sm py-8 text-sm">
      {error ? <p className="text-red-400">{error}</p> : <p className="text-slate-400">Signing you in...</p>}
    </main>
  );
}
