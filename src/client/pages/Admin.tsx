import { Link, Route, Routes } from "react-router-dom";
import { can } from "@shared/permissions";
import AdminLayout, { RequirePermission } from "../components/admin/AdminLayout";
import { ADMIN_NAV } from "../components/admin/nav";
import { PageHeader } from "../components/ui";
import { useAuth } from "../lib/auth";
import AnalystsPage from "./admin/AnalystsPage";
import MarketsPage from "./admin/MarketsPage";
import NoteEditorPage from "./admin/NoteEditorPage";
import NotesPage from "./admin/NotesPage";
import PostEditorPage from "./admin/PostEditorPage";
import PostsPage from "./admin/PostsPage";
import SettingsPage from "./admin/SettingsPage";
import TagsPage from "./admin/TagsPage";

function Dashboard() {
  const { user } = useAuth();
  const items = ADMIN_NAV.filter((i) => i.to !== "/admin" && can(user?.role, i.permission));
  return (
    <>
      <PageHeader title="Admin" />
      <p className="mb-4 text-sm text-slate-300">
        Signed in as {user?.name} ({user?.email}), role: <strong>{user?.role}</strong>.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((i) => (
          <Link key={i.to} to={i.to} className="rounded-md border border-slate-800 p-4 text-sm hover:border-slate-600">
            {i.label}
          </Link>
        ))}
      </div>
    </>
  );
}

// HOW TO ADD A SCREEN: nav item in components/admin/nav.ts + a <Route> here (wrap in <RequirePermission>).
export default function Admin() {
  return (
    <Routes>
      <Route element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="posts" element={<PostsPage />} />
        <Route path="posts/new" element={<RequirePermission permission="post:create"><PostEditorPage /></RequirePermission>} />
        <Route path="posts/:id" element={<PostEditorPage />} />
        <Route path="notes" element={<NotesPage />} />
        <Route path="notes/new" element={<RequirePermission permission="note:create"><NoteEditorPage /></RequirePermission>} />
        <Route path="notes/:id" element={<NoteEditorPage />} />
        <Route path="markets" element={<RequirePermission permission="market:manage"><MarketsPage /></RequirePermission>} />
        <Route path="analysts" element={<RequirePermission permission="analyst:manage"><AnalystsPage /></RequirePermission>} />
        <Route path="tags" element={<RequirePermission permission="tag:manage"><TagsPage /></RequirePermission>} />
        <Route path="settings" element={<RequirePermission permission="settings:manage"><SettingsPage /></RequirePermission>} />
        <Route path="*" element={<p className="text-sm text-slate-400">Page not found.</p>} />
      </Route>
    </Routes>
  );
}
