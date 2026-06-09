import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, ListMusic, Trash2, Play, Shuffle, Download } from "lucide-react";
import { useRouteAccent } from "@/lib/theme";
import { getPlaylists, deletePlaylist, type Playlist, DOWNLOADS_PLAYLIST_ID } from "@/lib/playlists";
import { getLiked, useLike, type LikedTrack } from "@/lib/likes";
import { usePlayer } from "@/lib/player";
import { Saavn, toTrack, type Track } from "@/lib/saavn";

export const Route = createFileRoute("/library")({
  head: () => ({ meta: [{ title: "YVL — Library" }] }),
  component: LibraryPage,
});

function LibraryPage() {
  useRouteAccent("library");
  const [liked, setLiked] = useState<LikedTrack[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const { play, quality } = usePlayer();

  function refresh() {
    setLiked(getLiked());
    setPlaylists(getPlaylists());
  }

  useEffect(() => {
    refresh();
    const onChange = () => refresh();
    window.addEventListener("yvl:playlists-changed", onChange);
    window.addEventListener("yvl:likes", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("yvl:playlists-changed", onChange);
      window.removeEventListener("yvl:likes", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  async function resolveTracks(items: { id: string; title: string; artist: string; cover?: string }[]): Promise<Track[]> {
    return Promise.all(
      items.map(async (t) => {
        try {
          const s = await Saavn.song(t.id);
          return toTrack(s, quality);
        } catch {
          return { id: t.id, title: t.title, artist: t.artist, cover: t.cover, duration: 0 } as Track;
        }
      })
    );
  }

  async function playList(items: { id: string; title: string; artist: string; cover?: string }[], shuffle = false, startIdx = 0) {
    if (!items.length) return;
    let tracks = await resolveTracks(items);
    let start = startIdx;
    if (shuffle) {
      tracks = [...tracks].sort(() => Math.random() - 0.5);
      start = 0;
    }
    await play(tracks, start);
  }

  return (
    <div className="space-y-8">
      <h1 className="font-display text-5xl">Library</h1>

      {/* Playlists */}
      <section>
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl">Playlists</h2>
          <span className="text-xs text-muted-foreground">{playlists.length}</span>
        </div>
        {playlists.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
            Tap <strong>+</strong> on any playing track to start a playlist. Downloads land here too.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {playlists.map((pl) => (
              <div key={pl.id} className="rounded-2xl border border-border bg-card p-3">
                <div className="flex items-center gap-3">
                  <div className={`grid size-12 place-items-center rounded-xl text-accent-foreground ${pl.id === DOWNLOADS_PLAYLIST_ID ? "bg-accent" : "bg-secondary"}`}>
                    {pl.id === DOWNLOADS_PLAYLIST_ID
                      ? <Download className="size-5 text-foreground" />
                      : <ListMusic className="size-5 text-foreground" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{pl.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{pl.tracks.length} tracks</div>
                  </div>
                  <button
                    onClick={() => void playList(pl.tracks, true)}
                    className="grid size-9 place-items-center rounded-full bg-secondary"
                    aria-label="Shuffle"
                  >
                    <Shuffle className="size-4" />
                  </button>
                  <button
                    onClick={() => void playList(pl.tracks)}
                    className="grid size-10 place-items-center rounded-full bg-accent text-accent-foreground"
                    aria-label="Play playlist"
                  >
                    <Play className="size-4 translate-x-[1px]" />
                  </button>
                  {pl.id !== DOWNLOADS_PLAYLIST_ID && (
                    <button
                      onClick={() => { if (confirm(`Delete "${pl.name}"?`)) { deletePlaylist(pl.id); refresh(); } }}
                      className="grid size-9 place-items-center rounded-full bg-secondary"
                      aria-label="Delete"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </div>
                {pl.tracks.length > 0 && (
                  <div className="mt-3 space-y-0.5">
                    {pl.tracks.slice(0, 6).map((t, i) => (
                      <button
                        key={t.id}
                        onClick={() => void playList(pl.tracks, false, i)}
                        className="flex w-full items-center gap-2 rounded-xl p-1.5 text-left hover:bg-secondary/60"
                      >
                        <div className="size-9 shrink-0 overflow-hidden rounded-lg bg-secondary">
                          {t.cover && <img src={t.cover} alt="" className="size-full object-cover" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-xs font-semibold">{t.title}</div>
                          <div className="truncate text-[10px] text-muted-foreground">{t.artist}</div>
                        </div>
                        <Play className="size-3.5 text-muted-foreground" />
                      </button>
                    ))}
                    {pl.tracks.length > 6 && (
                      <div className="px-1 text-[10px] text-muted-foreground">+{pl.tracks.length - 6} more</div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Liked */}
      <section>
        <div className="flex items-end justify-between">
          <h2 className="font-display text-2xl flex items-center gap-2"><Heart className="size-5 fill-accent text-accent" /> Liked</h2>
          {liked.length > 0 && (
            <div className="flex gap-2">
              <button
                onClick={() => void playList(liked, true)}
                className="rounded-full bg-secondary px-3 py-1.5 text-xs font-semibold flex items-center gap-1"
              >
                <Shuffle className="size-3.5" /> Shuffle
              </button>
              <button
                onClick={() => void playList(liked)}
                className="rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-accent-foreground flex items-center gap-1"
              >
                <Play className="size-3.5" /> Play all
              </button>
            </div>
          )}
        </div>
        {liked.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
            Tap the heart on any track to save it here.
          </p>
        ) : (
          <div className="mt-3 space-y-1">
            {liked.map((t, i) => (
              <LikedRow key={t.id} track={t} onPlay={() => void playList(liked, false, i)} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function LikedRow({ track, onPlay }: { track: LikedTrack; onPlay: () => void }) {
  const { toggle } = useLike(track);
  return (
    <div className="flex items-center gap-3 rounded-2xl p-2 hover:bg-secondary/60">
      <button onClick={onPlay} className="flex min-w-0 flex-1 items-center gap-3 text-left">
        <div className="size-12 shrink-0 overflow-hidden rounded-xl bg-secondary">
          {track.cover && <img src={track.cover} alt="" className="size-full object-cover" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{track.title}</div>
          <div className="truncate text-xs text-muted-foreground">{track.artist}</div>
        </div>
      </button>
      <button onClick={onPlay} className="grid size-9 place-items-center rounded-full bg-accent text-accent-foreground" aria-label="Play">
        <Play className="size-4 translate-x-[1px]" />
      </button>
      <button onClick={toggle} className="grid size-9 place-items-center rounded-full bg-secondary" aria-label="Unlike">
        <Heart className="size-4 fill-accent text-accent" />
      </button>
    </div>
  );
}
