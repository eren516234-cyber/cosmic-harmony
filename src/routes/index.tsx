import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Saavn, toTrack, bestImage, primaryArtist } from "@/lib/saavn";
import { SongRow } from "@/components/SongRow";
import { AlbumCard } from "@/components/AlbumCard";
import { EarthOrb } from "@/components/EarthOrb";
import { useRouteAccent } from "@/lib/theme";
import { usePlayer, formatTime } from "@/lib/player";
import { Play } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "YVL — For you" },
      { name: "description", content: "Quick picks, new songs and curated mixes — streamed from JioSaavn with synced lyrics." },
    ],
  }),
  component: Home,
});

const TABS = [
  { key: "for-you",  label: "For you", query: "top hits 2026" },
  { key: "rock",     label: "Rock",    query: "rock hits" },
  { key: "hip-hop",  label: "Hip-hop", query: "hip hop hits" },
  { key: "k-pop",    label: "K-Pop",   query: "k-pop hits" },
  { key: "pop",      label: "Pop",     query: "pop hits" },
  { key: "bolly",    label: "Bolly",   query: "bollywood hits 2026" },
  { key: "lofi",     label: "Lo-Fi",   query: "lofi chill" },
  { key: "rnb",      label: "R&B",     query: "rnb hits" },
] as const;

function Home() {
  useRouteAccent("home");
  const [tab, setTab] = useState<typeof TABS[number]["key"]>("for-you");
  const [songsExpanded, setSongsExpanded] = useState(false);
  const [playlistsExpanded, setPlaylistsExpanded] = useState(false);
  const active = TABS.find((t) => t.key === tab)!;

  const songsQ = useQuery({
    queryKey: ["home", "songs", active.query],
    queryFn: () => Saavn.searchSongs(active.query, 40).then((r) => r.results),
    staleTime: 5 * 60_000,
  });
  const albumsQ = useQuery({
    queryKey: ["home", "albums", active.query],
    queryFn: () => Saavn.searchAlbums(active.query, 45).then((r) => r.results),
    staleTime: 5 * 60_000,
  });

  const allSongs = songsQ.data ?? [];
  const quick = allSongs.slice(0, 5);
  const more = songsExpanded ? allSongs.slice(5) : allSongs.slice(5, 12);

  const albums = albumsQ.data ?? [];
  const playlistShown = playlistsExpanded ? albums : albums.slice(0, 12);

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <div className="flex items-end justify-between">
          <h1 className="font-display text-5xl">YVL</h1>
          <div className="grid size-9 place-items-center rounded-full bg-accent font-display text-sm text-accent-foreground">
            E
          </div>
        </div>

        <div className="-mx-5 flex gap-2 overflow-x-auto scrollbar-none px-5">
          {TABS.map((t) => {
            const sel = t.key === tab;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  sel ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </header>

      <section>
        <SectionHeader title="Orbit · spin to explore" />
        <div className="mt-2">
          {albumsQ.isLoading ? (
            <div className="h-[360px] animate-pulse rounded-3xl bg-secondary/40" />
          ) : (
            <EarthOrb albums={albums} />
          )}
        </div>
      </section>

      <section>
        <SectionHeader title="Quick picks" />
        {songsQ.isLoading && <SkeletonRows />}
        {songsQ.isError && <ErrorNote msg="Couldn’t load songs from JioSaavn." />}
        <div className="mt-3 space-y-1">
          {quick.map((s) => (
            <FeaturedRow key={s.id} song={s} queue={allSongs} />
          ))}
        </div>
      </section>

      {/* Wavy / staggered playlists */}
      <section>
        <SectionHeader
          title={`Playlists · ${albums.length}`}
          action={
            albums.length > 12 && (
              <button
                onClick={() => setPlaylistsExpanded((v) => !v)}
                className="text-sm font-semibold text-accent"
              >
                {playlistsExpanded ? "Show less" : "See more"}
              </button>
            )
          }
        />
        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3">
          {playlistShown.map((a, i) => (
            <AlbumCard
              key={a.id}
              album={a}
              size={160}
              offset={i % 2 === 0 ? 0 : 22}
            />
          ))}
        </div>
      </section>

      {/* New songs - horizontal carousel of album cards */}
      <section>
        <SectionHeader title="New drops" />
        <div className="mt-3 -mx-5 flex gap-3 overflow-x-auto scrollbar-none px-5 pb-2">
          {albums.slice(0, 18).map((a) => (
            <AlbumCard key={`drop-${a.id}`} album={a} size={170} />
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          title="More to play"
          action={
            allSongs.length > 12 && (
              <button
                onClick={() => setSongsExpanded((v) => !v)}
                className="text-sm font-semibold text-accent"
              >
                {songsExpanded ? "Show less" : "See more"}
              </button>
            )
          }
        />
        <div className="mt-3 space-y-1">
          {more.map((s) => (
            <SongRow key={s.id} song={s} queue={allSongs} />
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between">
      <h2 className="font-display text-2xl">{title}</h2>
      {action}
    </div>
  );
}

function FeaturedRow({ song, queue }: { song: import("@/lib/saavn").SaavnSong; queue: import("@/lib/saavn").SaavnSong[] }) {
  const { play, current, quality } = usePlayer();
  const isCurrent = current?.id === song.id;
  return (
    <button
      onClick={() => {
        const tracks = queue.map((s) => toTrack(s, quality));
        const idx = queue.findIndex((s) => s.id === song.id);
        void play(tracks, idx);
      }}
      className={`flex w-full items-center gap-3 rounded-2xl p-2 text-left transition-colors ${
        isCurrent ? "bg-card" : "hover:bg-secondary"
      }`}
    >
      <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-secondary">
        {bestImage(song.image) && <img src={bestImage(song.image)} alt="" className="size-full object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-base font-semibold">{song.name}</div>
        <div className="truncate text-xs text-muted-foreground">{primaryArtist(song)}</div>
      </div>
      <div className="text-xs text-muted-foreground">{formatTime(song.duration ?? 0)}</div>
      <div className="grid size-9 place-items-center rounded-full bg-accent text-accent-foreground shadow-glow">
        <Play className="size-4 translate-x-[1px]" />
      </div>
    </button>
  );
}

function SkeletonRows() {
  return (
    <div className="mt-3 space-y-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl p-2">
          <div className="size-12 animate-pulse rounded-xl bg-secondary" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-1/2 animate-pulse rounded bg-secondary" />
            <div className="h-2 w-1/3 animate-pulse rounded bg-secondary" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ErrorNote({ msg }: { msg: string }) {
  return <p className="mt-3 rounded-2xl border border-border bg-card p-3 text-sm text-muted-foreground">{msg}</p>;
}
