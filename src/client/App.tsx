import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { AuthProvider } from "./lib/auth";
import Admin from "./pages/Admin";
import Events from "./pages/Events";
import Feed from "./pages/Feed";
import Heatmap from "./pages/Heatmap";
import Login from "./pages/Login";
import LoginVerify from "./pages/LoginVerify";
import Matrix from "./pages/Matrix";
import { NotePage, PostPage } from "./pages/PublicDetailPages";
import Rules from "./pages/Rules";
import Today from "./pages/Today";
import Weekly from "./pages/Weekly";

// HOW TO ADD A PUBLIC PAGE: create it in pages/, add a <Route> here, add a link in components/publicNav.ts.
export default function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Today />} />
          <Route path="/matrix" element={<Matrix />} />
          <Route path="/weekly" element={<Weekly />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/heatmap" element={<Heatmap />} />
          <Route path="/events" element={<Events />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/post/:id" element={<PostPage />} />
          <Route path="/note/:id" element={<NotePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/login/verify" element={<LoginVerify />} />
          <Route path="/admin/*" element={<Admin />} />
          <Route path="*" element={<p className="py-8 text-sm text-slate-400">Page not found.</p>} />
        </Routes>
      </Layout>
    </AuthProvider>
  );
}
