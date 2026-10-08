import { Link, Route, Routes } from "react-router-dom";
import { can } from "@shared/permissions";
import AdminLayout, { RequirePermission } from "../components/admin/AdminLayout";
import { ADMIN_NAV } from "../components/admin/nav";
import { PageHeader } from "../components/ui";
import { useAuth } from "../lib/auth";
import AnalystsPage from "./admin/AnalystsPage";
import AuditPage from "./admin/AuditPage";
import EngagementPage from "./admin/EngagementPage";
import EventsPage from "./admin/EventsPage";
import MarketsPage from "./admin/MarketsPage";
import MediaPage from "./admin/MediaPage";
import NoteEditorPage from "./admin/NoteEditorPage";
import NotesPage from "./admin/NotesPage";
import PlansPage from "./admin/PlansPage";
import PostEditorPage from "./admin/PostEditorPage";
import PostsPage from "./admin/PostsPage";
import ResultsRoutes from "./admin/results";
import RevisionsPage from "./admin/RevisionsPage";
import SettingsPage from "./admin/SettingsPage";
import TagsPage from "./admin/TagsPage";
import UsersPage from "./admin/UsersPage";

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
        <Route path="results/*" element={<ResultsRoutes />} />
        <Route path="events" element={<RequirePermission permission="event:manage"><EventsPage /></RequirePermission>} />
        <Route path="engagement" element={<RequirePermission permission="post:publish"><EngagementPage /></RequirePermission>} />
        <Route path="revisions" element={<RequirePermission permission="post:publish"><RevisionsPage /></RequirePermission>} />
        <Route path="media" element={<RequirePermission permission="post:publish"><MediaPage /></RequirePermission>} />
        <Route path="markets" element={<RequirePermission permission="market:manage"><MarketsPage /></RequirePermission>} />
        <Route path="analysts" element={<RequirePermission permission="analyst:manage"><AnalystsPage /></RequirePermission>} />
        <Route path="tags" element={<RequirePermission permission="tag:manage"><TagsPage /></RequirePermission>} />
        <Route path="users" element={<RequirePermission permission="user:manage"><UsersPage /></RequirePermission>} />
        <Route path="plans" element={<RequirePermission permission="plan:manage"><PlansPage /></RequirePermission>} />
        <Route path="audit" element={<RequirePermission permission="audit:view"><AuditPage /></RequirePermission>} />
        <Route path="settings" element={<RequirePermission permission="settings:manage"><SettingsPage /></RequirePermission>} />
        <Route path="*" element={<p className="text-sm text-slate-400">Page not found.</p>} />
      </Route>
    </Routes>
  );
}
