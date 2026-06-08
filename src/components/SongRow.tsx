import { Link } from "@tanstack/react-router";
import { Play, Pause } from "lucide-react";
import { usePlayer } from "@/lib/player";
import { toTrack, type SaavnSong } from "@/lib/saavn";
import { formatTime } from "@/lib/player";

export function SongRow({ song, queue }: { song: SaavnSong; queue: SaavnSong[] }) {
  const { play, current, isPlaying, toggle, quality } = usePlayer();
  const tr = toTrack(song, quality);
  const isCurrent = current?.id === song.id;
  const playing = isCurrent && isPlaying;

  function startPlay() {
    if (isCurrent) { toggle(); return; }
    const tracks = (queue.length ? queue : [song]).map((s) => toTrack(s, quality));
    const idx = Math.max(0, (queue.length ? queue : [song]).findIndex((s) => s.id === song.id));
    void play(tracks, idx);
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={startPlay}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); startPlay(); } }}
      className={`group flex cursor-pointer items-center gap-3 rounded-2xl p-2 transition-colors ${
        isCurrent ? "bg-card" : "hover:bg-secondary"
      }`}
    >
      <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-secondary">
        {tr.cover ? <img src={tr.cover} alt="" className="size-full object-cover" /> : null}
        {playing && (
          <div className="absolute inset-0 grid place-items-center bg-black/45">
            <Equalizer />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className={`truncate text-sm font-semibold ${isCurrent ? "text-accent" : ""}`}>{song.name}</div>
        <div className="truncate text-xs text-muted-foreground">
          {song.artists?.primary?.map((a, i) => (
            <span key={a.id}>
              {i > 0 ? ", " : ""}
              {a.id ? (
                <Link
                  to="/artist/$id"
                  params={{ id: a.id }}
                  className="hover:underline"
                  onClick={(e) => e.stopPropagation()}
                >
                  {a.name}
                </Link>
              ) : a.name}
            </span>
          ))}
        </div>
      </div>
      <div className="hidden text-xs text-muted-foreground sm:block">{formatTime(song.duration ?? 0)}</div>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); startPlay(); }}
        className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground shadow-glow transition-transform active:scale-90"
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? <Pause className="size-4" /> : <Play className="size-4 translate-x-[1px]" />}
      </button>
    </div>
  );
}

function Equalizer() {
  return (
    <div className="flex h-4 items-end gap-[3px]">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-[3px] origin-bottom bg-accent"
          style={{ height: "100%", animation: `equalizer 0.9s ${i * 0.15}s ease-in-out infinite` }}
        />
      ))}
    </div>
  );
}
