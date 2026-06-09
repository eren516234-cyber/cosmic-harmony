import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Saavn, toTrack, type Track } from "./saavn";

type PlayerState = {
  queue: Track[];
  index: number;
  current?: Track;
  isPlaying: boolean;
  position: number;
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

function showNowPlayingNotification(track: Track) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification("♫ Now Playing", {
      body: `${track.title} — ${track.artist}`,
      icon: track.cover,
      silent: true,
      tag: "now-playing",
    });
  } catch {}
}

function registerMediaSession(
  track: Track,
  audioEl: HTMLAudioElement,
  getIdx: () => number,
  getQueue: () => Track[],
  doLoadAt: (i: number, q: Track[]) => Promise<void>,
  setIdx: (i: number) => void,
  setPos: (p: number) => void,
  setPlay: (v: boolean) => void,
) {
  if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;

  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: track.artist,
    album: track.artist,
    artwork: track.cover
      ? [
          { src: track.cover, sizes: "96x96",   type: "image/jpeg" },
          { src: track.cover, sizes: "512x512",  type: "image/jpeg" },
        ]
      : [],
  });

  navigator.mediaSession.setActionHandler("play", () => {
    void audioEl.play();
    setPlay(true);
    navigator.mediaSession.playbackState = "playing";
  });

  navigator.mediaSession.setActionHandler("pause", () => {
    audioEl.pause();
    setPlay(false);
    navigator.mediaSession.playbackState = "paused";
  });

  navigator.mediaSession.setActionHandler("nexttrack", () => {
    const q = getQueue();
    const i = getIdx();
    if (i + 1 < q.length) {
      setIdx(i + 1);
      void doLoadAt(i + 1, q);
    }
  });

  navigator.mediaSession.setActionHandler("previoustrack", () => {
    const q = getQueue();
    const i = getIdx();
    if (audioEl.currentTime > 3) {
      audioEl.currentTime = 0;
      setPos(0);
    } else if (i - 1 >= 0) {
      setIdx(i - 1);
      void doLoadAt(i - 1, q);
    } else {
      audioEl.currentTime = 0;
      setPos(0);
    }
  });

  navigator.mediaSession.setActionHandler("seekto", (d) => {
    if (d.seekTime != null) {
      audioEl.currentTime = d.seekTime;
      setPos(d.seekTime);
    }
  });

  navigator.mediaSession.setActionHandler("seekforward", (d) => {
    const skip = d.seekOffset ?? 10;
    audioEl.currentTime = Math.min(audioEl.currentTime + skip, audioEl.duration || 0);
  });

  navigator.mediaSession.setActionHandler("seekbackward", (d) => {
    const skip = d.seekOffset ?? 10;
    audioEl.currentTime = Math.max(audioEl.currentTime - skip, 0);
  });

  navigator.mediaSession.playbackState = "playing";
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const queueRef = useRef<Track[]>([]);
  const indexRef = useRef(0);

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

  // Keep refs fresh so media-session callbacks always see latest state
  useEffect(() => { queueRef.current = queue; }, [queue]);
  useEffect(() => { indexRef.current = index; }, [index]);

  useEffect(() => {
    const el = new Audio();
    el.preload = "metadata";
    audioRef.current = el;

    const onTime = () => {
      setPosition(el.currentTime);
      // Keep the media-session seek bar in sync
      if ("mediaSession" in navigator && el.duration && isFinite(el.duration)) {
        try {
          navigator.mediaSession.setPositionState({
            duration: el.duration,
            playbackRate: el.playbackRate,
            position: Math.min(el.currentTime, el.duration),
          });
        } catch {}
      }
    };
    const onDur = () => setDuration(el.duration || 0);
    const onEnd = () => { void goTo(indexRef.current + 1); };

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
    try {
      await el.play();
      setIsPlaying(true);
      showNowPlayingNotification(track);
      registerMediaSession(
        track,
        el,
        () => indexRef.current,
        () => queueRef.current,
        loadAt,
        (idx) => { setIndex(idx); indexRef.current = idx; },
        setPosition,
        setIsPlaying,
      );
    } catch { setIsPlaying(false); }
  }

  async function play(tracks: Track[], startIndex = 0) {
    setQueue(tracks);
    queueRef.current = tracks;
    setIndex(startIndex);
    indexRef.current = startIndex;
    setExpanded(true);
    await loadAt(startIndex, tracks);
  }

  async function goTo(i: number) {
    if (i < 0 || i >= queueRef.current.length) return;
    setIndex(i);
    indexRef.current = i;
    await loadAt(i, queueRef.current);
  }

  function toggle() {
    const el = audioRef.current;
    if (!el || !el.src) return;
    if (el.paused) {
      void el.play();
      setIsPlaying(true);
      if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "playing";
    } else {
      el.pause();
      setIsPlaying(false);
      if ("mediaSession" in navigator) navigator.mediaSession.playbackState = "paused";
    }
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