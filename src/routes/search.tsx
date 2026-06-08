import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search as SearchIcon, X, History } from "lucide-react";
import { useEffect, useState } from "react";
import { Saavn, bestImage } from "@/lib/saavn";
import { SongRow } from "@/components/SongRow";
import { AlbumCard } from "@/components/AlbumCard";
import { useRouteAccent } from "@/lib/theme";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "YVL — Search" },
      { name: "description", content: "Search any song, artist or album — powered by JioSaavn." },
    ],
  }),
  component: SearchPage,
});

const GENRES = ["Pop", "Hip-Hop", "Rock", "R&B", "K-Pop", "Electronic", "Jazz", "Lo-Fi"] as const;
const LS = "yvl.recent.searches";

function SearchPage() {
  useRouteAccent("search");
  const [q, setQ] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    try { setRecent(JSON.parse(localStorage.getItem(LS) ?? "[]")); } catch {}
  }, []);

  function saveRecent(term: string) {
    const next = [term, ...recent.filter((r) => r.toLowerCase() !== term.toLowerCase())].slice(0, 8);
    setRecent(next);
    try { localStorage.setItem(LS, JSON.stringify(next)); } catch {}
  }

  function submit(term: string) {
    const t = term.trim();
    if (!t) return;
    setQ(t);
    setSubmitted(t);
    saveRecent(t);
  }

  const songsQ = useQuery({
    queryKey: ["search", "songs", submitted],
    queryFn: () => Saavn.searchSongs(submitted, 30).then((r) => r.results),
    enabled: !!submitted,
  });
  const albumsQ = useQuery({
    queryKey: ["search", "albums", submitted],
    queryFn: () => Saavn.searchAlbums(submitted, 10).then((r) => r.results),
    enabled: !!submitted,
  });
  const artistsQ = useQuery({
    queryKey: ["search", "artists", submitted],
    queryFn: () => Saavn.searchArtists(submitted, 10).then((r) => r.results),
    enabled: !!submitted,
  });

  return (
    <div className="space-y-8">
      <h1 className="font-display text-5xl">Search</h1>

      <form
        onSubmit={(e) => { e.preventDefault(); submit(q); }}
        className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-3"
      >
        <SearchIcon className="size-4 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Songs, artists, albums…"
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
        {q && (
          <button type="button" onClick={() => { setQ(""); setSubmitted(""); }} aria-label="Clear">
            <X className="size-4 text-muted-foreground" />
          </button>
        )}
      </form>

      {!submitted && (
        <>
          {recent.length > 0 && (
            <section>
              <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Recent</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {recent.map((r) => (
                  <button
                    key={r}
                    onClick={() => submit(r)}
                    className="flex items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm"
                  >
                    <History className="size-3.5 text-muted-foreground" />
                    {r}
                    <X
                      className="size-3.5 text-muted-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        const next = recent.filter((x) => x !== r);
                        setRecent(next);
                        try { localStorage.setItem(LS, JSON.stringify(next)); } catch {}
                      }}
                    />
                  </button>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="font-display text-3xl">Browse</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {GENRES.map((g) => (
                <button
                  key={g}
                  onClick={() => submit(g)}
                  className="relative aspect-[2/1] overflow-hidden rounded-2xl bg-card p-4 text-left"
                >
                  <span className="absolute inset-0 bg-gradient-to-br from-accent/0 via-accent/0 to-accent/20" />
                  <span className="relative text-lg font-bold">{g}</span>
                </button>
              ))}
            </div>
          </section>
        </>
      )}

      {submitted && (
        <>
          {artistsQ.data && artistsQ.data.length > 0 && (
            <section>
              <h2 className="font-display text-2xl">Artists</h2>
              <div className="mt-3 -mx-5 flex gap-4 overflow-x-auto scrollbar-none px-5">
                {artistsQ.data.map((a) => (
                  <Link to="/artist/$id" params={{ id: a.id }} key={a.id} className="w-28 shrink-0 text-center">
                    <div className="mx-auto aspect-square overflow-hidden rounded-full bg-secondary">
                      {bestImage(a.image) && <img src={bestImage(a.image)} alt="" className="size-full object-cover" />}
                    </div>
                    <div className="mt-2 truncate text-xs font-semibold">{a.name}</div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {albumsQ.data && albumsQ.data.length > 0 && (
            <section>
              <h2 className="font-display text-2xl">Albums</h2>
              <div className="mt-3 -mx-5 flex gap-3 overflow-x-auto scrollbar-none px-5">
                {albumsQ.data.map((a) => (
                  <AlbumCard key={a.id} album={a} size={160} />
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="font-display text-2xl">Songs</h2>
            <div className="mt-3 space-y-1">
              {songsQ.data?.map((s) => (
                <SongRow key={s.id} song={s} queue={songsQ.data ?? []} />
              ))}
              {songsQ.isLoading && <p className="text-sm text-muted-foreground">Searching JioSaavn…</p>}
              {songsQ.isError && <p className="text-sm text-muted-foreground">No results.</p>}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
