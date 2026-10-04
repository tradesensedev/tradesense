import { Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import { AuthProvider } from "./lib/auth";
import Admin from "./pages/Admin";
import Home from "./pages/Home";
import Login from "./pages/Login";
import LoginVerify from "./pages/LoginVerify";

export default function App() {
  return (
    <AuthProvider>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/login/verify" element={<LoginVerify />} />
          <Route path="/admin/*" element={<Admin />} />
          <Route path="*" element={<p className="py-8 text-sm text-slate-400">Page not found.</p>} />
        </Routes>
      </Layout>
    </AuthProvider>
  );
}
