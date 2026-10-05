import type { ReactNode } from "react";
import { Navigate, NavLink, Outlet } from "react-router-dom";
import { can, isStaff, type Permission } from "@shared/permissions";
import { useAuth } from "../../lib/auth";
import { Notice } from "../ui";
import { ADMIN_NAV } from "./nav";

// Route guard for the whole admin area + role-aware sidebar (built from the permission map).
export default function AdminLayout() {
  const { user, loading } = useAuth();
  if (loading) return <p className="text-sm text-slate-400">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isStaff(user.role)) return <Notice kind="error">You do not have access to the admin panel.</Notice>;

  const items = ADMIN_NAV.filter((i) => can(user.role, i.permission));
  return (
    <div className="flex flex-col gap-4 md:flex-row md:gap-6">
      <aside className="md:w-52 md:shrink-0">
        <nav className="flex gap-1 overflow-x-auto pb-1 md:flex-col md:overflow-visible">
          {items.map((i) => (
            <NavLink
              key={i.to}
              to={i.to}
              end={i.end}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-md px-3 py-2 text-sm ${isActive ? "bg-slate-100 font-medium text-slate-900" : "text-slate-300 hover:bg-slate-900"}`
              }
            >
              {i.label}
            </NavLink>
          ))}
        </nav>
        <p className="mt-3 hidden px-3 text-xs text-slate-500 md:block">
          {user.name}
          <br />
          Role: {user.role}
        </p>
      </aside>
      <section className="min-w-0 flex-1">
        <Outlet />
      </section>
    </div>
  );
}

// Per-screen guard. The API enforces the same permission; this just avoids showing a broken screen.
export function RequirePermission({ permission, children }: { permission: Permission; children: ReactNode }) {
  const { user } = useAuth();
  if (!can(user?.role, permission)) return <Notice kind="error">Your role does not have access to this screen.</Notice>;
  return <>{children}</>;
}
