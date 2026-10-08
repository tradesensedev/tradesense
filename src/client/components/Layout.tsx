import type { ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { isStaff } from "@shared/permissions";
import { useAuth } from "../lib/auth";
import { usePublicMeta } from "../lib/publicApi";
import { DEFAULT_DISCLAIMER } from "../lib/publicFmt";
import { PUBLIC_NAV } from "./publicNav";
import { Notice } from "./ui";

const linkCls = ({ isActive }: { isActive: boolean }) =>
  `whitespace-nowrap rounded px-2 py-1 ${isActive ? "bg-slate-800 text-white" : "text-slate-300 hover:text-white"}`;

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const meta = usePublicMeta();
  const isAdmin = pathname.startsWith("/admin");
  // The admin panel needs room for the editor + live preview; the public site stays narrower.
  const width = isAdmin ? "max-w-7xl" : "max-w-5xl";
  const banner = meta.data?.settings.announcementBanner.trim();
  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-800">
        <nav className={`mx-auto flex ${width} flex-wrap items-center justify-between gap-x-4 gap-y-2 p-4 text-sm`} aria-label="Main">
          <Link to="/" className="text-lg font-semibold">TradeSense</Link>
          {!isAdmin && (
            <div className="order-last flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto">
              {PUBLIC_NAV.map((i) => (
                <NavLink key={i.to} to={i.to} end={i.end} className={linkCls}>{i.label}</NavLink>
              ))}
            </div>
          )}
          <div className="flex items-center gap-4">
            {isStaff(user?.role) && <Link to="/admin" className="text-slate-300 hover:text-white">Admin</Link>}
            {user && !isAdmin && <Link to="/feed?bookmarked=1" className="text-slate-300 hover:text-white">Bookmarks</Link>}
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
      {!isAdmin && banner && (
        <div className={`mx-auto w-full ${width} px-4 pt-4`}>
          <Notice kind="info">{banner}</Notice>
        </div>
      )}
      <div className={`mx-auto w-full ${width} flex-1 p-4`}>{children}</div>
      <footer className="border-t border-slate-800 p-4 text-center text-xs text-slate-500">
        {meta.data?.settings.disclaimerText || DEFAULT_DISCLAIMER}
      </footer>
    </div>
  );
}
