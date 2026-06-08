import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Crosshair } from "lucide-react";
import type { Lyrics } from "@/lib/lrclib";

export type LyricsMode = "ios" | "word" | "karaoke" | "glow";

type Props = {
  lyrics: Lyrics;
  position: number;
  duration: number;
  mode: LyricsMode;
  loading: boolean;
  accent?: string;
  onSeek?: (t: number) => void;
};

export function LyricsView({ lyrics, position, duration, mode, loading, accent, onSeek }: Props) {
  if (loading) return <p className="py-10 text-center text-muted-foreground">Loading lyrics…</p>;

  if (!lyrics?.synced?.length) {
    if (lyrics?.plain) {
      return (
        <pre className="whitespace-pre-wrap px-2 py-4 font-sans text-base leading-relaxed text-foreground/80">
          {lyrics.plain}
        </pre>
      );
    }
    return <p className="py-10 text-center text-muted-foreground">No synced lyrics found.</p>;
  }

  const synced = lyrics.synced;
  const { activeLine, lineProgress } = useMemo(() => {
    let idx = -1;
    for (let i = 0; i < synced.length; i++) {
      if (synced[i].time <= position) idx = i;
      else break;
    }
    let progress = 0;
    if (idx >= 0) {
      const start = synced[idx].time;
      const end = synced[idx + 1]?.time ?? Math.min(start + 5, duration || start + 5);
      const span = Math.max(end - start, 0.5);
      progress = Math.min(1, Math.max(0, (position - start) / span));
    }
    return { activeLine: idx, lineProgress: progress };
  }, [synced, position, duration]);

  return (
    <ScrollFrame active={activeLine}>
      {mode === "ios" && <IOSLines synced={synced} active={activeLine} onSeek={onSeek} />}
      {mode === "word" && <WordLines synced={synced} active={activeLine} progress={lineProgress} onSeek={onSeek} accent={accent} />}
      {mode === "karaoke" && <KaraokeLines synced={synced} active={activeLine} progress={lineProgress} onSeek={onSeek} accent={accent} />}
      {mode === "glow" && <GlowLines synced={synced} active={activeLine} progress={lineProgress} onSeek={onSeek} accent={accent} />}
    </ScrollFrame>
  );
}

// Shared scroll container with auto-scroll + re-sync button
function ScrollFrame({ active, children }: { active: number; children: React.ReactNode }) {
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
    <div className="relative h-full">
      <div
        ref={ref}
        className="h-full overflow-y-auto scrollbar-none"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent 0, #000 18%, #000 82%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent 0, #000 18%, #000 82%, transparent 100%)",
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

function IOSLines({ synced, active, onSeek }: { synced: { time: number; text: string }[]; active: number; onSeek?: (t: number) => void }) {
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
            className={`cursor-pointer px-2 font-display text-xl leading-snug transition-all duration-500 ${
              i === active ? "scale-[1.04] text-foreground" : "text-foreground/30"
            }`}
            style={{ filter: `blur(${blur}px)` }}
          >
            {l.text || "♪"}
          </p>
        );
      })}
    </>
  );
}

function WordLines({ synced, active, progress, onSeek, accent }: { synced: { time: number; text: string }[]; active: number; progress: number; onSeek?: (t: number) => void; accent?: string }) {
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
            className={`cursor-pointer px-2 font-display text-xl leading-snug ${i === active ? "" : "text-foreground/20"}`}
          >
            {words.map((w, j) => {
              const lit = j < reveal;
              return (
                <span
                  key={j}
                  className="mr-2 inline-block transition-all duration-200"
                  style={{
                    color: lit ? accent ?? "var(--foreground)" : "rgba(255,255,255,0.25)",
                    textShadow: lit && i === active ? `0 0 18px ${accent ?? "rgba(255,255,255,0.5)"}` : "none",
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

function KaraokeLines({ synced, active, progress, onSeek, accent }: { synced: { time: number; text: string }[]; active: number; progress: number; onSeek?: (t: number) => void; accent?: string }) {
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
            className={`cursor-pointer px-2 font-display text-2xl leading-snug ${i === active ? "" : "text-foreground/15"}`}
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

function GlowLines({ synced, active, progress, onSeek, accent }: { synced: { time: number; text: string }[]; active: number; progress: number; onSeek?: (t: number) => void; accent?: string }) {
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
            className={`cursor-pointer px-2 text-center font-display text-xl leading-snug transition-all duration-500 ${
              isActive ? "scale-105" : "scale-100 text-foreground/25"
            }`}
            style={{
              color: isActive ? "#fff" : undefined,
              textShadow: isActive
                ? `0 0 18px ${color}, 0 0 40px ${color}, 0 0 80px ${color}80`
                : "none",
              opacity: isActive ? 1 : 0.5 + progress * 0.1,
            }}
          >
            {l.text || "♪"}
          </p>
        );
      })}
    </>
  );
}
