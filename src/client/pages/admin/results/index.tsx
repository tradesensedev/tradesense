import { NavLink, Route, Routes } from "react-router-dom";
import ResultDetailPage from "./ResultDetailPage";
import ResultsListPage from "./ResultsListPage";
import ResultsQueuePage from "./ResultsQueuePage";
import RulesPage from "./RulesPage";

const tab = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-1.5 text-sm ${isActive ? "bg-slate-100 font-medium text-slate-900" : "text-slate-300 hover:bg-slate-900"}`;

// Everything under /admin/results. HOW TO ADD A RESULTS SCREEN: add a tab here and a <Route> below.
export default function ResultsRoutes() {
  return (
    <>
      <nav className="mb-4 flex gap-1" aria-label="Results sections">
        <NavLink to="/admin/results" end className={tab}>Queue</NavLink>
        <NavLink to="/admin/results/all" className={tab}>All results</NavLink>
        <NavLink to="/admin/results/rules" className={tab}>Evaluation rules</NavLink>
      </nav>
      <Routes>
        <Route index element={<ResultsQueuePage />} />
        <Route path="all" element={<ResultsListPage />} />
        <Route path="rules" element={<RulesPage />} />
        <Route path=":id" element={<ResultDetailPage />} />
        <Route path="*" element={<p className="text-sm text-slate-400">Page not found.</p>} />
      </Routes>
    </>
  );
}
