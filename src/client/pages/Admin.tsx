import { Navigate } from "react-router-dom";
import { isStaff } from "@shared/permissions";
import { useAuth } from "../lib/auth";

// Placeholder. Real admin screens arrive in Phase 2.
export default function Admin() {
  const { user, loading } = useAuth();
  if (loading) return <p className="text-sm text-slate-400">Loading...</p>;
  if (!user) return <Navigate to="/login" replace />;
  if (!isStaff(user.role)) return <p className="text-sm text-red-400">You do not have access to the admin panel.</p>;
  return (
    <main className="py-4">
      <h1 className="text-xl font-semibold">Admin</h1>
      <p className="mt-2 text-sm text-slate-300">
        Signed in as {user.name} ({user.email}), role: <strong>{user.role}</strong>. Admin screens arrive in Phase 2.
      </p>
    </main>
  );
}
