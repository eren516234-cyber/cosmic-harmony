import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Saavn, bestImage } from "@/lib/saavn";
import { AlbumCard } from "@/components/AlbumCard";
import { useRouteAccent } from "@/lib/theme";
import { usePlayer } from "@/lib/player";
import { toTrack } from "@/lib/saavn";
import { Play, Sparkles } from "lucide-react";

export const Route = createFileRoute("/explore")({
  head: () => ({
    meta: [
      { title: "YVL — Explore" },
      { name: "description", content: "Explore moods, genres and trending music." },
    ],
  }),
  component: ExplorePage,
});

const MOODS = [
  { key: "chill",    label: "Chill",    q: "chill lofi",            grad: "from-cyan-500 to-blue-700" },
  { key: "party",    label: "Party",    q: "party hits dance",      grad: "from-fuchsia-500 to-rose-600" },
  { key: "workout",  label: "Workout",  q: "workout gym hype",      grad: "from-orange-500 to-red-700" },
  { key: "focus",    label: "Focus",    q: "instrumental focus",    grad: "from-emerald-500 to-teal-700" },
  { key: "romance",  label: "Romance",  q: "romantic love songs",   grad: "from-pink-500 to-rose-700" },
  { key: "drive",    label: "Drive",    q: "road trip driving",     grad: "from-amber-500 to-orange-700" },
  { key: "sleep",    label: "Sleep",    q: "sleep ambient",         grad: "from-indigo-500 to-violet-800" },
  { key: "throwback",label: "Throwback",q: "2000s hits throwback",  grad: "from-violet-500 to-purple-800" },
];

const TRENDING_QUERIES = ["trending 2026", "global top 50", "new releases", "viral hits"];

function ExplorePage() {
  useRouteAccent("home");
  const { play, quality } = usePlayer();

  const trending = useQuery({
    queryKey: ["explore", "trending"],
    queryFn: async () => {
      const out = await Promise.all(
        TRENDING_QUERIES.map((q) => Saavn.searchSongs(q, 12).then((r) => r.results)),
      );
      const seen = new Set<string>();
      return out.flat().filter((s) => (seen.has(s.id) ? false : (seen.add(s.id), true))).slice(0, 30);
    },
    staleTime: 5 * 60_000,
  });

  const albums = useQuery({
    queryKey: ["explore", "albums"],
    queryFn: () => Saavn.searchAlbums("trending albums", 18).then((r) => r.results),
    staleTime: 5 * 60_000,
  });

  const list = trending.data ?? [];

  return (
    <div className="space-y-8 pb-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.25em] text-muted-foreground">
          <Sparkles className="size-3.5" /> Explore
        </div>
        <h1 className="font-display text-5xl">Discover</h1>
        <p className="text-sm text-muted-foreground">Moods, genres and trending tracks — curated for you.</p>
      </header>

      <section>
        <h2 className="mb-3 font-display text-2xl">Moods</h2>
        <div className="grid grid-cols-2 gap-3">
          {MOODS.map((m) => (
            <a
              key={m.key}
              href={`/search?q=${encodeURIComponent(m.q)}`}
              className={`relative h-24 overflow-hidden rounded-2xl bg-gradient-to-br ${m.grad} p-4 text-white shadow-glow transition-transform active:scale-95`}
            >
              <div className="font-display text-xl drop-shadow">{m.label}</div>
              <div className="absolute -bottom-3 -right-3 size-16 rounded-full bg-white/15 backdrop-blur-md" />
            </a>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-2xl">Trending now</h2>
        {trending.isLoading && <div className="h-32 animate-pulse rounded-2xl bg-secondary" />}
        <div className="grid grid-cols-2 gap-2">
          {list.slice(0, 8).map((s) => (
            <button
              key={s.id}
              onClick={() => {
                const tracks = list.map((x) => toTrack(x, quality));
                const idx = list.findIndex((x) => x.id === s.id);
                void play(tracks, idx);
              }}
              className="flex items-center gap-2 rounded-xl bg-card p-2 text-left hover:bg-secondary"
            >
              <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-secondary">
                {bestImage(s.image) && <img src={bestImage(s.image)} alt="" className="size-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{s.name}</div>
                <div className="truncate text-[11px] text-muted-foreground">
                  {s.artists?.primary?.[0]?.name ?? "Unknown"}
                </div>
              </div>
              <div className="grid size-7 place-items-center rounded-full bg-accent text-accent-foreground">
                <Play className="size-3 translate-x-[1px]" />
              </div>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-2xl">Hot albums</h2>
        <div className="-mx-5 flex gap-3 overflow-x-auto scrollbar-none px-5 pb-2">
          {(albums.data ?? []).map((a) => (
            <AlbumCard key={a.id} album={a} size={150} />
          ))}
        </div>
      </section>
    </div>
  );
}
