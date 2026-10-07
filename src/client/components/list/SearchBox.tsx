import { useEffect, useState } from "react";
import { inputCls } from "../ui";

// Text search that waits for a short pause in typing before it changes the list (and the URL).
export default function SearchBox({ value, onChange, placeholder = "Search text" }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]); // a saved view or "Clear filters" resets the box

  useEffect(() => {
    if (text === value) return;
    const t = setTimeout(() => onChange(text), 350);
    return () => clearTimeout(t);
  }, [text, value, onChange]);

  return <input className={inputCls} placeholder={placeholder} value={text} onChange={(e) => setText(e.target.value)} aria-label={placeholder} />;
}
