import { ChevronDown, Pause, Play, SkipBack, SkipForward, Mic2, ListMusic, Heart, Download, Plus, Shuffle } from "lucide-react";
import { useEffect, useState } from "react";
import { usePlayer, formatTime } from "@/lib/player";
import { nativeImpact, writeNativeDownload } from "@/lib/native-shell";
import { fetchLyrics, type Lyrics } from "@/lib/lrclib";
import { useLike } from "@/lib/likes";
import { LyricsView, LYRICS_MODES, type LyricsMode } from "./LyricsView";
import { addToPlaylist, createPlaylist, ensureDownloadsPlaylist, getPlaylists } from "@/lib/playlists";
import { useTheme } from "@/lib/theme";


const MODE_KEY = "yvl.lyrics-mode";
const MODES = LYRICS_MODES;

export function FullPlayer() {
  const { current, expanded, expand, isPlaying, toggle, next, prev, position, duration, seek, queue, play } = usePlayer();
  const theme = useTheme();

  const [showLyrics, setShowLyrics] = useState(false);
  const [lyrics, setLyrics] = useState<Lyrics>(null);
  const [loadingL, setLoadingL] = useState(false);
  const trackMeta = current
    ? { id: current.id, title: current.title, artist: current.artist, cover: current.cover }
    : undefined;
  const { liked, toggle: toggleLike } = useLike(trackMeta);
  const [pulse, setPulse] = useState(0);
  const [showPlaylistPick, setShowPlaylistPick] = useState(false);
  const [mode, setMode] = useState<LyricsMode>(() => {
    if (typeof window === "undefined") return "ios";
    return (localStorage.getItem(MODE_KEY) as LyricsMode) || "ios";
  });
  const [offset, setOffset] = useState<number>(() => {
    if (typeof window === "undefined") return -0.15;
    const raw = localStorage.getItem("yvl.lyrics-offset");
    return raw != null ? parseFloat(raw) : -0.15;
  });
  useEffect(() => { try { localStorage.setItem(MODE_KEY, mode); } catch {} }, [mode]);
  useEffect(() => { try { localStorage.setItem("yvl.lyrics-offset", String(offset)); } catch {} }, [offset]);


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

  function shufflePlay() {
    if (queue.length < 2) return;
    const shuffled = [...queue].sort(() => Math.random() - 0.5);
    void play(shuffled, 0);
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-background">
      {/* Aurora layer inside player so theme reaches full-screen view too */}
      {theme.aurora && (
        <div className="pointer-events-none absolute inset-0 splash-aurora opacity-50" />
      )}

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
            onClick={() => { nativeImpact(); expand(false); }}
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
            onClick={() => { nativeImpact(); setShowLyrics((v) => !v); }}
            className={`grid size-10 place-items-center rounded-full ${showLyrics ? "bg-accent text-accent-foreground" : "bg-secondary/80 backdrop-blur"}`}
            aria-label="Toggle lyrics"
          >
            {showLyrics ? <ListMusic className="size-5" /> : <Mic2 className="size-5" />}
          </button>
        </header>

        {/* Hero area — same 1:1 footprint for both album art and lyrics window */}
        <div className="relative mx-auto mt-6 w-full max-w-[340px]">
          <div className="aspect-square">
            {!showLyrics ? (
              <div
                className="native-now-playing-art relative size-full overflow-hidden rounded-full bg-secondary shadow-glow"
                style={{ animation: isPlaying ? "spin-slow 22s linear infinite" : "none" }}
              >
                {current.cover && (
                  <img src={current.cover} alt="" className="size-full object-cover" />
                )}
                <div
                  className="pointer-events-none absolute inset-0 rounded-full"
                  style={{ background: "repeating-radial-gradient(circle at center, rgba(0,0,0,0.18) 0 1px, transparent 1px 6px)" }}
                />
                <div className="absolute left-1/2 top-1/2 size-12 -translate-x-1/2 -translate-y-1/2 rounded-full bg-background ring-4 ring-accent" />
              </div>
            ) : (
              <div className="relative size-full overflow-hidden rounded-3xl border border-border bg-black/55 backdrop-blur-xl">
                <LyricsView
                  lyrics={lyrics}
                  position={position}
                  duration={duration}
                  mode={mode}
                  loading={loadingL}
                  offset={offset}
                  onSeek={seek}
                />

              </div>
            )}
          </div>

          {showLyrics && (
            <>
              <div className="mx-auto mt-2 flex max-w-full gap-1 overflow-x-auto rounded-full bg-secondary/70 p-1 backdrop-blur scrollbar-none">
                {MODES.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-semibold transition-all ${
                      mode === m.id ? "bg-accent text-accent-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
              <div className="mx-auto mt-2 flex items-center justify-center gap-2 text-[11px]">
                <span className="text-muted-foreground">Sync</span>
                <button
                  onClick={() => setOffset((o) => Math.round((o - 0.1) * 100) / 100)}
                  className="rounded-full bg-secondary px-2.5 py-1 font-bold"
                  aria-label="Lyrics earlier"
                >−0.1s</button>
                <span className="min-w-[3.5rem] text-center font-mono font-semibold">
                  {offset >= 0 ? "+" : ""}{offset.toFixed(2)}s
                </span>
                <button
                  onClick={() => setOffset((o) => Math.round((o + 0.1) * 100) / 100)}
                  className="rounded-full bg-secondary px-2.5 py-1 font-bold"
                  aria-label="Lyrics later"
                >+0.1s</button>
                <button
                  onClick={() => setOffset(0)}
                  className="ml-1 rounded-full bg-secondary px-2.5 py-1 text-muted-foreground"
                >Reset</button>
              </div>
            </>
          )}

        </div>

        {/* Title + actions row — always present, never hidden */}
        <div className="mt-5 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="truncate font-display text-2xl leading-tight">{current.title}</h2>
            <p className="truncate text-sm text-muted-foreground">{current.artist}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <ActionButton
              ariaLabel={liked ? "Unlike" : "Like"}
              onClick={() => { nativeImpact("MEDIUM"); toggleLike(); setPulse((p) => p + 1); }}
              size="sm"
            >
              <Heart
                key={pulse}
                className={`size-4 ${liked ? "fill-accent text-accent" : "text-foreground"}`}
                style={{ animation: pulse ? "heart-pop 420ms cubic-bezier(.2,.8,.2,1)" : undefined }}
              />
            </ActionButton>
            <ActionButton ariaLabel="Add to playlist" onClick={() => { nativeImpact(); setShowPlaylistPick(true); }} size="sm">
              <Plus className="size-4" />
            </ActionButton>
            <DownloadAction stream={current.stream} title={current.title} artist={current.artist} cover={current.cover} id={current.id} size="sm" />
          </div>
        </div>

        {/* Controls — always visible */}
        <div className="mt-auto space-y-3 pt-4">
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
          <div className="flex items-center justify-center gap-6 pt-1">
            <button onClick={shufflePlay} aria-label="Shuffle" className="text-muted-foreground hover:text-foreground"><Shuffle className="size-5" /></button>
            <button onClick={() => void prev()} aria-label="Previous"><SkipBack className="size-7" /></button>
            <button
              onClick={() => { nativeImpact("MEDIUM"); toggle(); }}
              className="grid size-16 place-items-center rounded-full bg-accent text-accent-foreground shadow-glow"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="size-7" /> : <Play className="size-7 translate-x-[2px]" />}
            </button>
            <button onClick={() => void next()} aria-label="Next"><SkipForward className="size-7" /></button>
            <div className="size-5" />
          </div>
        </div>
      </div>

      {showPlaylistPick && current && (
        <PlaylistPicker
          track={{ id: current.id, title: current.title, artist: current.artist, cover: current.cover }}
          onClose={() => setShowPlaylistPick(false)}
        />
      )}
    </div>
  );
}

function ActionButton({
  children,
  onClick,
  ariaLabel,
  size = "md",
}: {
  children: React.ReactNode;
  onClick: () => void;
  ariaLabel: string;
  size?: "sm" | "md";
}) {
  return (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      className={`grid ${size === "sm" ? "size-9" : "size-12"} shrink-0 place-items-center rounded-full bg-secondary/80 backdrop-blur transition active:scale-90`}
    >
      {children}
    </button>
  );
}

function DownloadAction({
  stream,
  title,
  artist,
  cover,
  id,
  size = "md",
}: {
  stream?: string;
  title: string;
  artist: string;
  cover?: string;
  id: string;
  size?: "sm" | "md";
}) {
  const [busy, setBusy] = useState(false);
  async function download() {
    if (!stream || busy) return;
    setBusy(true);
    try {
      const res = await fetch(stream);
      if (!res.ok) throw new Error("fetch failed");
      const blob = await res.blob();
      const ext = (blob.type.split("/")[1] || "mp3").split(";")[0];
      const filename = `${artist} - ${title}`.replace(/[\\/:*?"<>|]+/g, "_") + `.${ext}`;
      const savedNative = await writeNativeDownload(blob, filename, `${artist} - ${title}`);
      if (!savedNative) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 4000);
      }
    } catch {
      window.open(stream, "_blank", "noopener");
    } finally {
      // Auto-add to Downloads playlist in library
      const pl = ensureDownloadsPlaylist();
      addToPlaylist(pl.id, { id, title, artist, cover });
      setBusy(false);
    }
  }
  return (
    <ActionButton ariaLabel="Download" onClick={download} size={size}>
      <Download className={`${size === "sm" ? "size-4" : "size-5"} ${busy ? "animate-pulse" : ""}`} />
    </ActionButton>
  );
}

function PlaylistPicker({
  track,
  onClose,
}: {
  track: { id: string; title: string; artist: string; cover?: string };
  onClose: () => void;
}) {
  const [items, setItems] = useState(() => getPlaylists());
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  function pick(id: string) {
    addToPlaylist(id, track);
    onClose();
  }

  function create() {
    if (!name.trim()) return;
    const pl = createPlaylist(name);
    addToPlaylist(pl.id, track);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-[460px] rounded-t-3xl border border-border bg-card p-5 animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-muted" />
        <h3 className="font-display text-xl">Add to playlist</h3>
        <p className="mt-1 truncate text-xs text-muted-foreground">{track.title} · {track.artist}</p>

        {!creating ? (
          <button
            onClick={() => setCreating(true)}
            className="mt-4 flex w-full items-center gap-3 rounded-2xl bg-secondary p-3 text-left"
          >
            <span className="grid size-10 place-items-center rounded-full bg-accent text-accent-foreground"><Plus className="size-5" /></span>
            <span className="font-semibold">New playlist</span>
          </button>
        ) : (
          <div className="mt-4 flex gap-2">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Playlist name"
              className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm outline-none focus:border-accent"
              onKeyDown={(e) => e.key === "Enter" && create()}
            />
            <button onClick={create} className="rounded-full bg-accent px-4 py-2 text-sm font-bold text-accent-foreground">Create</button>
          </div>
        )}

        <div className="mt-4 max-h-[40vh] space-y-1 overflow-y-auto scrollbar-none">
          {items.length === 0 && !creating && (
            <p className="rounded-2xl bg-secondary/40 p-4 text-center text-xs text-muted-foreground">
              No playlists yet. Create one above.
            </p>
          )}
          {items.map((pl) => (
            <button
              key={pl.id}
              onClick={() => pick(pl.id)}
              className="flex w-full items-center gap-3 rounded-2xl p-2 text-left hover:bg-secondary/60"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-secondary"><ListMusic className="size-5" /></span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold">{pl.name}</span>
                <span className="block text-[11px] text-muted-foreground">{pl.tracks.length} tracks</span>
              </span>
            </button>
          ))}
        </div>

        <button onClick={onClose} className="mt-4 w-full rounded-full bg-secondary py-2 text-sm font-semibold">Close</button>
      </div>
    </div>
  );
}
