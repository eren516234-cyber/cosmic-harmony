import { Pause, Play, SkipForward } from "lucide-react";
import { usePlayer } from "@/lib/player";

export function MiniPlayer() {
  const { current, isPlaying, toggle, next, expand, position, duration } = usePlayer();
  if (!current) return null;
  const pct = duration ? Math.min(100, (position / duration) * 100) : 0;
  return (
    <button
      type="button"
      onClick={() => expand(true)}
      className="group relative flex w-full items-center gap-3 overflow-hidden rounded-full border border-border bg-card/90 p-2 pr-4 text-left backdrop-blur-xl"
    >
      <div className="relative size-12 shrink-0 overflow-hidden rounded-full bg-secondary">
        {current.cover && (
          <img src={current.cover} alt="" className="size-full object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold">{current.title}</div>
        <div className="truncate text-xs text-muted-foreground">{current.artist}</div>
      </div>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); toggle(); }}
        className="grid size-9 place-items-center rounded-full bg-accent text-accent-foreground"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? <Pause className="size-4" /> : <Play className="size-4 translate-x-[1px]" />}
      </button>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); void next(); }}
        className="grid size-9 place-items-center text-foreground/80 hover:text-foreground"
        aria-label="Next"
      >
        <SkipForward className="size-4" />
      </button>
      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-border">
        <div className="h-full bg-accent transition-[width]" style={{ width: `${pct}%` }} />
      </div>
    </button>
  );
}
