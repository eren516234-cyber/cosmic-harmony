import { useCallback, useEffect, useState } from "react";

const KEY = "yvl.likes.v2";
const LEGACY = "yvl.likes.v1";

export type LikedTrack = {
  id: string;
  title: string;
  artist: string;
  cover?: string;
  likedAt: number;
};

function read(): LikedTrack[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as LikedTrack[];
    // migrate from v1 (ids only)
    const old = JSON.parse(localStorage.getItem(LEGACY) ?? "[]") as string[];
    return old.map((id) => ({ id, title: id, artist: "—", likedAt: Date.now() }));
  } catch {
    return [];
  }
}
function write(list: LikedTrack[]) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch {}
  window.dispatchEvent(new Event("yvl:likes"));
}

export function getLiked(): LikedTrack[] {
  return read();
}

export function useLike(track?: { id: string; title: string; artist: string; cover?: string }) {
  const [list, setList] = useState<LikedTrack[]>(() => read());
  useEffect(() => {
    const sync = () => setList(read());
    window.addEventListener("yvl:likes", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("yvl:likes", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const liked = !!(track && list.some((t) => t.id === track.id));
  const toggle = useCallback(() => {
    if (!track) return;
    const exists = list.some((t) => t.id === track.id);
    const next = exists
      ? list.filter((t) => t.id !== track.id)
      : [{ ...track, likedAt: Date.now() }, ...list];
    write(next);
  }, [track, list]);
  return { liked, toggle, all: list };
}
