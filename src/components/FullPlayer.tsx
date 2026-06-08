import { ChevronDown, Pause, Play, SkipBack, SkipForward, Mic2, ListMusic, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { usePlayer, formatTime } from "@/lib/player";
import { fetchLyrics, type Lyrics } from "@/lib/lrclib";
import { useLike } from "@/lib/likes";
import { LyricsView, type LyricsMode } from "./LyricsView";

const MODE_KEY = "yvl.lyrics-mode";
const MODES: { id: LyricsMode; label: string }[] = [
  { id: "ios", label: "iOS" },
  { id: "word", label: "Word" },
  { id: "karaoke", label: "Karaoke" },
  { id: "glow", label: "Glow" },
];

export function FullPlayer() {
  const { current, expanded, expand, isPlaying, toggle, next, prev, position, duration, seek } = usePlayer();
  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState<Lyrics>(null);
  const [loadingL, setLoadingL] = useState(false);
  const { liked, toggle: toggleLike } = useLike(current?.id);
  const [pulse, setPulse] = useState(0);
  const [mode, setMode] = useState<LyricsMode>(() => {
    if (typeof window === "undefined") return "ios";
    return (localStorage.getItem(MODE_KEY) as LyricsMode) || "ios";
  });
  useEffect(() => { try { localStorage.setItem(MODE_KEY, mode); } catch {} }, [mode]);

  useEffect(() => {
    if (!current) return;
    setLyrics(null);
    setLoadingL(true);
    fetchLyrics(current.title, current.artist, current.duration)
      .then(setLyrics)
      .catch(() => setLyrics(null))
      .finally(() => setLoadingL(false));
  }, [current?.id]);


  if (!current || !expanded) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden" style={{ background: "var(--background)" }}>
      {current.cover && (
        <div className="pointer-events-none absolute inset-0">
          <img
            src={current.cover}
            alt=""
            className="size-full scale-125 object-cover"
            style={{ filter: "blur(60px) saturate(1.3) brightness(0.55)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background" />
        </div>
      )}

      <div className="relative mx-auto flex w-full max-w-[440px] flex-1 flex-col px-6 pb-8 pt-6 md:max-w-[560px]">
        <header className="flex items-center justify-between">
          <button
            onClick={() => expand(false)}
            className="grid size-10 place-items-center rounded-full bg-secondary/80 backdrop-blur"
            aria-label="Collapse"
          >
            <ChevronDown className="size-5" />
          </button>
          <div className="text-center">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Now Playing</div>
            <div className="text-xs font-semibold">YVL</div>
          </div>
          <button
            onClick={() => setShowLyrics((v) => !v)}
            className={`grid size-10 place-items-center rounded-full ${showLyrics ? "bg-accent text-accent-foreground" : "bg-secondary/80 backdrop-blur"}`}
            aria-label="Toggle lyrics"
          >
            {showLyrics ? <ListMusic className="size-5" /> : <Mic2 className="size-5" />}
          </button>
        </header>

        {/* Album art — always visible (shrinks when lyrics on) */}
        <div className={`relative mx-auto mt-6 transition-all duration-500 ${showLyrics ? "w-[180px]" : "w-full max-w-[320px]"}`}>
          <div className="aspect-square">
            <div
              className="relative size-full overflow-hidden rounded-full bg-secondary shadow-glow"
              style={{ animation: isPlaying ? "spin-slow 22s linear infinite" : "none" }}
            >
              {current.cover && (
                <img src={current.cover} alt="" className="size-full object-cover" />
              )}
              <div
                className="pointer-events-none absolute inset-0 rounded-full"
                style={{ background: "repeating-radial-gradient(circle at center, rgba(0,0,0,0.18) 0 1px, transparent 1px 6px)" }}
              />
              <div className={`absolute left-1/2 top-1/2 ${showLyrics ? "size-7" : "size-12"} -translate-x-1/2 -translate-y-1/2 rounded-full bg-background ring-4 ring-accent transition-all`} />
            </div>
          </div>
        </div>

        {/* Lyrics in compact card */}
        {showLyrics && (
          <div className="mt-3 flex flex-1 flex-col overflow-hidden">
            <div className="mx-auto mb-2 flex gap-1 rounded-full bg-secondary/70 p-1 backdrop-blur">
              {MODES.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-all ${
                    mode === m.id ? "bg-accent text-accent-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            <div className="relative flex-1 overflow-hidden rounded-3xl border border-border bg-card/30 backdrop-blur">
              <LyricsView
                lyrics={lyrics}
                position={position}
                duration={duration}
                mode={mode}
                loading={loadingL}
                onSeek={seek}
              />
            </div>
          </div>
        )}

        {!showLyrics && (
          <div className="mt-6 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="truncate font-display text-3xl leading-tight">{current.title}</h2>
              <p className="truncate text-base text-muted-foreground">{current.artist}</p>
            </div>
            <button
              onClick={() => { toggleLike(); setPulse((p) => p + 1); }}
              className="grid size-12 shrink-0 place-items-center rounded-full bg-secondary/80 backdrop-blur"
              aria-label={liked ? "Unlike" : "Like"}
            >
              <Heart
                key={pulse}
                className={`size-6 ${liked ? "fill-accent text-accent" : "text-foreground"}`}
                style={{ animation: pulse ? "heart-pop 420ms cubic-bezier(.2,.8,.2,1)" : undefined }}
              />
            </button>
          </div>
        )}

        {showLyrics && (
          <div className="mt-3 text-center">
            <div className="truncate font-display text-lg leading-tight">{current.title}</div>
            <div className="truncate text-xs text-muted-foreground">{current.artist}</div>
          </div>
        )}

        {/* Controls */}
        <div className="mt-5 space-y-3">
          <input
            type="range"
            min={0}
            max={Math.max(duration, 1)}
            step={0.1}
            value={Math.min(position, duration || 0)}
            onChange={(e) => seek(parseFloat(e.target.value))}
            className="w-full accent-[var(--accent-hex)]"
            aria-label="Seek"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(position)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div className="flex items-center justify-center gap-8 pt-1">
            <button onClick={() => void prev()} aria-label="Previous"><SkipBack className="size-7" /></button>
            <button
              onClick={toggle}
              className="grid size-16 place-items-center rounded-full bg-accent text-accent-foreground shadow-glow"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="size-7" /> : <Play className="size-7 translate-x-[2px]" />}
            </button>
            <button onClick={() => void next()} aria-label="Next"><SkipForward className="size-7" /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
