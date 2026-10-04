import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";

export default function Home() {
  const health = useQuery({
    queryKey: ["health"],
    queryFn: () => api<{ ok: boolean; app: string; time: string }>("/api/health"),
  });
  return (
    <main className="mx-auto max-w-xl py-8">
      <h1 className="text-2xl font-semibold">TradeSense</h1>
      <p className="mt-2 text-sm text-slate-400">Public site arrives in Phase 4.</p>
      <div className="mt-6 rounded-lg border border-slate-800 p-4 text-sm">
        API status: {health.isLoading ? "checking..." : health.data?.ok ? `OK (${health.data.app})` : "unreachable"}
      </div>
    </main>
  );
}
