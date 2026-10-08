import { Link, useNavigate, useParams } from "react-router-dom";
import { NoteDetailView, PostDetailView } from "../components/public/DetailViews";

export function PostPage() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  return (
    <main className="mx-auto max-w-3xl space-y-4 py-4">
      <Link to="/" className="text-sm text-slate-400 hover:text-white">← Back to today</Link>
      <PostDetailView id={id} onOpen={(t, i) => nav(`/${t}/${i}`)} />
    </main>
  );
}

export function NotePage() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  return (
    <main className="mx-auto max-w-3xl space-y-4 py-4">
      <Link to="/" className="text-sm text-slate-400 hover:text-white">← Back to today</Link>
      <NoteDetailView id={id} onOpen={(t, i) => nav(`/${t}/${i}`)} />
    </main>
  );
}
