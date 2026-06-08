import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Saavn, toTrack, type Track } from "./saavn";

type PlayerState = {
  queue: Track[];
  index: number;
  current?: Track;
  isPlaying: boolean;
  position: number;   // seconds
  duration: number;
  expanded: boolean;
  quality: string;
  play: (tracks: Track[], startIndex?: number) => Promise<void>;
  toggle: () => void;
  next: () => Promise<void>;
  prev: () => Promise<void>;
  seek: (t: number) => void;
  expand: (v: boolean) => void;
  setQuality: (q: string) => void;
};

const Ctx = createContext<PlayerState | null>(null);

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [quality, setQuality] = useState<string>(() => {
    if (typeof window === "undefined") return "320kbps";
    return localStorage.getItem("yvl.quality") ?? "320kbps";
  });

  useEffect(() => { try { localStorage.setItem("yvl.quality", quality); } catch {} }, [quality]);

  // Lazily create the audio element on the client
  useEffect(() => {
    const el = new Audio();
    el.preload = "metadata";
    audioRef.current = el;
    const onTime = () => setPosition(el.currentTime);
    const onDur  = () => setDuration(el.duration || 0);
    const onEnd  = () => { void goTo(index + 1); };
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onDur);
    el.addEventListener("ended", onEnd);
    return () => {
      el.pause();
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onDur);
      el.removeEventListener("ended", onEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadAt(i: number, q: Track[]) {
    const track = q[i];
    if (!track) return;
    let stream = track.stream;
    if (!stream) {
      try {
        const full = await Saavn.song(track.id);
        const t = toTrack(full, quality);
        stream = t.stream;
        track.stream = stream;
        track.duration = track.duration || t.duration;
        track.cover = track.cover || t.cover;
      } catch (e) {
        console.error("Failed to resolve stream", e);
        return;
      }
    }
    const el = audioRef.current!;
    el.src = stream!;
    try { await el.play(); setIsPlaying(true); } catch { setIsPlaying(false); }
  }

  async function play(tracks: Track[], startIndex = 0) {
    setQueue(tracks);
    setIndex(startIndex);
    setExpanded(true);
    await loadAt(startIndex, tracks);
  }

  async function goTo(i: number) {
    if (i < 0 || i >= queue.length) return;
    setIndex(i);
    await loadAt(i, queue);
  }

  function toggle() {
    const el = audioRef.current;
    if (!el || !el.src) return;
    if (el.paused) { void el.play(); setIsPlaying(true); }
    else { el.pause(); setIsPlaying(false); }
  }

  function seek(t: number) {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = t;
    setPosition(t);
  }

  const current = queue[index];
  const value: PlayerState = {
    queue, index, current, isPlaying, position, duration, expanded, quality,
    play,
    toggle,
    next: () => goTo(index + 1),
    prev: () => goTo(index - 1),
    seek,
    expand: setExpanded,
    setQuality,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlayer() {
  const v = useContext(Ctx);
  if (!v) throw new Error("usePlayer outside provider");
  return v;
}

export function formatTime(s: number) {
  if (!isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const r = Math.floor(s % 60);
  return `${m}:${r.toString().padStart(2, "0")}`;
}
