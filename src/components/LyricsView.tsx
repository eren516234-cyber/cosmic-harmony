import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Crosshair } from "lucide-react";
import type { Lyrics } from "@/lib/lrclib";
import { usePlayer } from "@/lib/player";

export type LyricsMode =
  | "ios"
  | "word"
  | "karaoke"
  | "wave"
  | "glow"
  | "cinematic"
  | "float"
  | "pulse";

export const LYRICS_MODES: { id: LyricsMode; label: string }[] = [
  { id: "ios", label: "Line" },
  { id: "word", label: "Word" },
  { id: "karaoke", label: "Char" },
  { id: "wave", label: "Wave" },
  { id: "glow", label: "Neon" },
  { id: "cinematic", label: "Cinema" },
  { id: "float", label: "Float" },
  { id: "pulse", label: "Pulse" },
];

type Props = {
  lyrics: Lyrics;
  position: number;
  duration: number;
  mode: LyricsMode;
  loading: boolean;
  accent?: string;
  onSeek?: (t: number) => void;
};

/**
 * Smooth-interpolated playback position.
 * timeupdate fires ~4Hz; we extrapolate at 60fps for jitter-free sync.
 */
function useSmoothPosition(position: number) {
  const { isPlaying } = usePlayer();
  const [smooth, setSmooth] = useState(position);
  const base = useRef({ pos: position, t: performance.now(), playing: isPlaying });

  useEffect(() => {
    base.current = { pos: position, t: performance.now(), playing: isPlaying };
    setSmooth(position);
  }, [position, isPlaying]);

  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const b = base.current;
      if (b.playing) {
        const dt = (performance.now() - b.t) / 1000;
        setSmooth(b.pos + dt);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return smooth;
}

export function LyricsView({ lyrics, position, duration, mode, loading, accent, onSeek }: Props) {
  const smoothPos = useSmoothPosition(position);

  const synced = lyrics?.synced ?? [];
  const { activeLine, lineProgress } = useMemo(() => {
    if (!synced.length) return { activeLine: -1, lineProgress: 0 };
    let idx = -1;
    for (let i = 0; i < synced.length; i++) {
      if (synced[i].time <= smoothPos) idx = i;
      else break;
    }
    let progress = 0;
    if (idx >= 0) {
      const start = synced[idx].time;
      const end = synced[idx + 1]?.time ?? Math.min(start + 5, duration || start + 5);
      const span = Math.max(end - start, 0.4);
      progress = Math.min(1, Math.max(0, (smoothPos - start) / span));
    }
    return { activeLine: idx, lineProgress: progress };
  }, [synced, smoothPos, duration]);

  if (loading) return <p className="py-10 text-center text-muted-foreground">Loading lyrics…</p>;

  if (!synced.length) {
    if (lyrics?.plain) {
      return (
        <pre className="whitespace-pre-wrap px-2 py-4 font-sans text-base leading-relaxed text-foreground/80">
          {lyrics.plain}
        </pre>
      );
    }
    return <p className="py-10 text-center text-muted-foreground">No synced lyrics found.</p>;
  }

  const cinematic = mode === "cinematic";

  return (
    <ScrollFrame active={activeLine} darken={cinematic}>
      {mode === "ios" && <IOSLines synced={synced} active={activeLine} onSeek={onSeek} />}
      {mode === "word" && <WordLines synced={synced} active={activeLine} progress={lineProgress} onSeek={onSeek} accent={accent} />}
      {mode === "karaoke" && <KaraokeLines synced={synced} active={activeLine} progress={lineProgress} onSeek={onSeek} accent={accent} />}
      {mode === "wave" && <WaveLines synced={synced} active={activeLine} progress={lineProgress} onSeek={onSeek} accent={accent} />}
      {mode === "glow" && <GlowLines synced={synced} active={activeLine} progress={lineProgress} onSeek={onSeek} accent={accent} />}
      {mode === "cinematic" && <CinematicLines synced={synced} active={activeLine} progress={lineProgress} onSeek={onSeek} accent={accent} />}
      {mode === "float" && <FloatLines synced={synced} active={activeLine} progress={lineProgress} onSeek={onSeek} accent={accent} />}
      {mode === "pulse" && <PulseLines synced={synced} active={activeLine} progress={lineProgress} onSeek={onSeek} accent={accent} />}
    </ScrollFrame>
  );
}

/* ---------- shared scroll container ---------- */

function ScrollFrame({ active, darken, children }: { active: number; darken?: boolean; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [userScrolled, setUserScrolled] = useState(false);
  const programmaticUntil = useRef(0);

  const scrollToActive = useCallback(() => {
    const root = ref.current;
    if (!root || active < 0) return;
    const el = root.querySelector<HTMLElement>(`[data-line="${active}"]`);
    if (!el) return;
    programmaticUntil.current = performance.now() + 900;
    const top = el.offsetTop - root.clientHeight / 2 + el.clientHeight / 2;
    root.scrollTo({ top, behavior: "smooth" });
  }, [active]);

  useEffect(() => {
    if (!userScrolled) scrollToActive();
  }, [active, userScrolled, scrollToActive]);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const onScroll = () => {
      if (performance.now() < programmaticUntil.current) return;
      setUserScrolled(true);
    };
    root.addEventListener("scroll", onScroll, { passive: true });
    return () => root.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="relative h-full" style={darken ? { background: "#000" } : undefined}>
      <div
        ref={ref}
        className="h-full overflow-y-auto scrollbar-none"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent 0, #000 18%, #000 82%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0, #000 18%, #000 82%, transparent 100%)",
          willChange: "scroll-position",
        }}
      >
        <div className="space-y-3 py-[35%]">{children}</div>
      </div>
      {userScrolled && (
        <button
          type="button"
          onClick={() => { setUserScrolled(false); scrollToActive(); }}
          className="absolute bottom-2 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-accent px-4 py-2 text-xs font-bold uppercase tracking-wider text-accent-foreground shadow-glow animate-fade-up"
        >
          <Crosshair className="size-3.5" />
          Re-sync
        </button>
      )}
    </div>
  );
}

type LineProps = {
  synced: { time: number; text: string }[];
  active: number;
  progress: number;
  onSeek?: (t: number) => void;
  accent?: string;
};

/* ---------- 1. iOS line ---------- */
function IOSLines({ synced, active, onSeek }: { synced: LineProps["synced"]; active: number; onSeek?: (t: number) => void }) {
  return (
    <>
      {synced.map((l, i) => {
        const dist = Math.abs(i - active);
        const blur = i === active ? 0 : Math.min(3, dist * 0.6);
        return (
          <p
            key={i}
            data-line={i}
            onClick={() => onSeek?.(l.time)}
            className={`cursor-pointer px-2 font-display text-2xl leading-snug transition-all duration-500 ${
              i === active ? "scale-[1.05] text-white" : "text-white/25"
            }`}
            style={{ filter: `blur(${blur}px)`, willChange: "transform, opacity" }}
          >
            {l.text || "♪"}
          </p>
        );
      })}
    </>
  );
}

/* ---------- 2. Word-by-word ---------- */
function WordLines({ synced, active, progress, onSeek, accent }: LineProps) {
  return (
    <>
      {synced.map((l, i) => {
        const words = (l.text || "♪").split(/\s+/).filter(Boolean);
        const reveal = i === active ? progress * words.length : i < active ? words.length : 0;
        return (
          <p
            key={i}
            data-line={i}
            onClick={() => onSeek?.(l.time)}
            className={`cursor-pointer px-2 font-display text-2xl leading-snug ${i === active ? "" : "text-white/20"}`}
          >
            {words.map((w, j) => {
              const lit = j < reveal;
              return (
                <span
                  key={j}
                  className="mr-2 inline-block transition-all duration-200"
                  style={{
                    color: lit ? accent ?? "#fff" : "rgba(255,255,255,0.22)",
                    textShadow: lit && i === active ? `0 0 18px ${accent ?? "rgba(255,255,255,0.6)"}` : "none",
                    transform: lit && i === active ? "translateY(-2px)" : "none",
                  }}
                >
                  {w}
                </span>
              );
            })}
          </p>
        );
      })}
    </>
  );
}

/* ---------- 3. Character-by-character ---------- */
function KaraokeLines({ synced, active, progress, onSeek, accent }: LineProps) {
  return (
    <>
      {synced.map((l, i) => {
        const chars = (l.text || "♪").split("");
        const total = chars.length || 1;
        const reveal = i === active ? progress * total : i < active ? total : 0;
        return (
          <p
            key={i}
            data-line={i}
            onClick={() => onSeek?.(l.time)}
            className={`cursor-pointer px-2 font-display text-2xl leading-snug ${i === active ? "" : "text-white/15"}`}
          >
            {chars.map((c, j) => {
              const lit = j < reveal;
              const justLit = i === active && j < reveal && j >= reveal - 1;
              return (
                <span
                  key={j}
                  className="inline-block transition-all duration-150"
                  style={{
                    color: lit ? accent ?? "#fff" : "rgba(255,255,255,0.18)",
                    textShadow: lit ? `0 0 12px ${accent ?? "#fff"}, 0 0 24px ${accent ?? "#fff"}` : "none",
                    transform: justLit ? "translateY(-4px) scale(1.18)" : "none",
                  }}
                >
                  {c === " " ? "\u00A0" : c}
                </span>
              );
            })}
          </p>
        );
      })}
    </>
  );
}

/* ---------- 4. Fluid Wave ---------- */
function WaveLines({ synced, active, progress, onSeek, accent }: LineProps) {
  const t = performance.now() / 1000;
  return (
    <>
      {synced.map((l, i) => {
        const chars = (l.text || "♪").split("");
        const isActive = i === active;
        return (
          <p
            key={i}
            data-line={i}
            onClick={() => onSeek?.(l.time)}
            className={`cursor-pointer px-2 text-center font-display text-2xl leading-snug ${isActive ? "" : "text-white/20"}`}
          >
            {chars.map((c, j) => {
              const phase = isActive ? Math.sin(t * 3 + j * 0.35 + progress * 4) : 0;
              return (
                <span
                  key={j}
                  className="inline-block"
                  style={{
                    color: isActive ? "#fff" : undefined,
                    transform: isActive ? `translateY(${phase * 6}px)` : "none",
                    textShadow: isActive ? `0 0 14px ${accent ?? "#fff"}` : "none",
                    transition: "transform 120ms linear",
                  }}
                >
                  {c === " " ? "\u00A0" : c}
                </span>
              );
            })}
          </p>
        );
      })}
    </>
  );
}

/* ---------- 5. Neon Glow ---------- */
function GlowLines({ synced, active, progress, onSeek, accent }: LineProps) {
  const color = accent ?? "var(--accent-hex)";
  return (
    <>
      {synced.map((l, i) => {
        const isActive = i === active;
        return (
          <p
            key={i}
            data-line={i}
            onClick={() => onSeek?.(l.time)}
            className={`cursor-pointer px-2 text-center font-display text-2xl leading-snug transition-all duration-500 ${
              isActive ? "scale-105" : "scale-100 text-white/25"
            }`}
            style={{
              color: isActive ? "#fff" : undefined,
              textShadow: isActive
                ? `0 0 18px ${color}, 0 0 40px ${color}, 0 0 80px ${color}80`
                : "none",
              opacity: isActive ? 1 : 0.45 + progress * 0.1,
            }}
          >
            {l.text || "♪"}
          </p>
        );
      })}
    </>
  );
}

/* ---------- 6. Cinematic Dark (spotlight) ---------- */
function CinematicLines({ synced, active, onSeek }: LineProps) {
  return (
    <>
      {synced.map((l, i) => {
        const isActive = i === active;
        return (
          <p
            key={i}
            data-line={i}
            onClick={() => onSeek?.(l.time)}
            className="cursor-pointer px-4 text-center font-display text-2xl leading-snug transition-all duration-700"
            style={{
              color: isActive ? "#fff" : "rgba(255,255,255,0.05)",
              filter: isActive ? "none" : "blur(2px)",
              textShadow: isActive ? "0 0 30px rgba(255,255,255,0.4)" : "none",
              transform: isActive ? "scale(1.06)" : "scale(1)",
            }}
          >
            {l.text || "♪"}
          </p>
        );
      })}
    </>
  );
}

/* ---------- 7. Floating Parallax ---------- */
function FloatLines({ synced, active, onSeek, accent }: LineProps) {
  const t = performance.now() / 1000;
  return (
    <>
      {synced.map((l, i) => {
        const dist = i - active;
        const isActive = i === active;
        const float = Math.sin(t * 0.8 + i * 0.4) * (isActive ? 4 : 2);
        const drift = Math.cos(t * 0.5 + i * 0.7) * (isActive ? 0 : 6);
        return (
          <p
            key={i}
            data-line={i}
            onClick={() => onSeek?.(l.time)}
            className="cursor-pointer px-2 font-display text-2xl leading-snug transition-colors duration-500"
            style={{
              color: isActive ? "#fff" : "rgba(255,255,255,0.22)",
              textShadow: isActive ? `0 0 22px ${accent ?? "rgba(255,255,255,0.5)"}` : "none",
              transform: `translate(${drift}px, ${float}px) scale(${isActive ? 1.06 : 1 - Math.min(Math.abs(dist) * 0.04, 0.2)})`,
              opacity: isActive ? 1 : Math.max(0.18, 1 - Math.abs(dist) * 0.18),
              willChange: "transform",
            }}
          >
            {l.text || "♪"}
          </p>
        );
      })}
    </>
  );
}

/* ---------- 8. Pulse Beat ---------- */
function PulseLines({ synced, active, progress, onSeek, accent }: LineProps) {
  // beat-style pulse: 2 pulses per line based on progress
  const beat = Math.sin(progress * Math.PI * 4);
  const scale = 1 + Math.max(0, beat) * 0.08;
  return (
    <>
      {synced.map((l, i) => {
        const isActive = i === active;
        return (
          <p
            key={i}
            data-line={i}
            onClick={() => onSeek?.(l.time)}
            className={`cursor-pointer px-2 text-center font-display text-2xl leading-snug ${isActive ? "" : "text-white/22"}`}
            style={{
              color: isActive ? "#fff" : undefined,
              transform: isActive ? `scale(${scale})` : "scale(1)",
              textShadow: isActive
                ? `0 0 ${10 + beat * 18}px ${accent ?? "#fff"}, 0 0 ${24 + beat * 24}px ${accent ?? "#fff"}80`
                : "none",
              transition: "transform 80ms linear",
              willChange: "transform",
            }}
          >
            {l.text || "♪"}
          </p>
        );
      })}
    </>
  );
}
