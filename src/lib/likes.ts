import { useCallback, useEffect, useState } from "react";

const KEY = "yvl.likes.v1";

function read(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try { return new Set(JSON.parse(localStorage.getItem(KEY) ?? "[]")); } catch { return new Set(); }
}
function write(s: Set<string>) {
  try { localStorage.setItem(KEY, JSON.stringify([...s])); } catch {}
  window.dispatchEvent(new Event("yvl:likes"));
}

export function useLike(id?: string) {
  const [set, setSet] = useState<Set<string>>(() => read());
  useEffect(() => {
    const sync = () => setSet(read());
    window.addEventListener("yvl:likes", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("yvl:likes", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const liked = id ? set.has(id) : false;
  const toggle = useCallback(() => {
    if (!id) return;
    const next = new Set(set);
    if (next.has(id)) next.delete(id); else next.add(id);
    write(next);
  }, [id, set]);
  return { liked, toggle, all: set };
}
