import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { isStaff } from "@shared/permissions";
import { useAuth } from "../lib/auth";

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-800">
        <nav className="mx-auto flex max-w-5xl items-center justify-between p-4 text-sm">
          <Link to="/" className="text-lg font-semibold">TradeSense</Link>
          <div className="flex items-center gap-4">
            {isStaff(user?.role) && <Link to="/admin" className="text-slate-300 hover:text-white">Admin</Link>}
            {user ? (
              <button onClick={() => void logout()} className="text-slate-300 hover:text-white">
                Sign out ({user.name})
              </button>
            ) : (
              <Link to="/login" className="text-slate-300 hover:text-white">Sign in</Link>
            )}
          </div>
        </nav>
      </header>
      <div className="mx-auto w-full max-w-5xl flex-1 p-4">{children}</div>
      <footer className="border-t border-slate-800 p-4 text-center text-xs text-slate-500">
        TradeSense provides market research and education only. Not financial advice. Past performance is not indicative of
        future results.
      </footer>
    </div>
  );
}
