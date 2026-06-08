import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Play, Shuffle } from "lucide-react";
import { Saavn, bestImage, primaryArtist, toTrack } from "@/lib/saavn";
import { SongRow } from "@/components/SongRow";
import { useRouteAccent } from "@/lib/theme";
import { usePlayer } from "@/lib/player";

export const Route = createFileRoute("/album/$id")({
  head: () => ({ meta: [{ title: "YVL — Album" }] }),
  component: AlbumPage,
});

function AlbumPage() {
  useRouteAccent("album");
  const { id } = Route.useParams();
  const { play, quality } = usePlayer();

  const q = useQuery({
    queryKey: ["album", id],
    queryFn: () => Saavn.album(id),
  });

  if (q.isLoading) return <p className="text-muted-foreground">Loading album…</p>;
  if (q.isError || !q.data) return <p className="text-muted-foreground">Couldn’t load album.</p>;

  const album = q.data;
  const cover = bestImage(album.image);
  const songs = album.songs ?? [];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto aspect-square w-64 overflow-hidden rounded-3xl bg-secondary shadow-glow">
          {cover && <img src={cover} alt="" className="size-full object-cover" />}
        </div>
        <h1 className="mt-5 font-display text-3xl leading-tight">{album.name}</h1>
        <p className="text-sm text-muted-foreground">
          {primaryArtist(album)}{album.year ? ` • ${album.year}` : ""}{album.songCount ? ` • ${album.songCount} songs` : ""}
        </p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => songs.length && play(songs.map((s) => toTrack(s, quality)), 0)}
          className="flex flex-1 items-center justify-center gap-2 rounded-full bg-accent py-3 font-semibold text-accent-foreground"
        >
          <Play className="size-4 translate-x-[1px]" /> Play
        </button>
        <button
          onClick={() => {
            const shuffled = [...songs].sort(() => Math.random() - 0.5);
            shuffled.length && play(shuffled.map((s) => toTrack(s, quality)), 0);
          }}
          className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border py-3 font-semibold"
        >
          <Shuffle className="size-4" /> Shuffle
        </button>
      </div>

      <div className="space-y-1">
        {songs.map((s) => (
          <SongRow key={s.id} song={s} queue={songs} />
        ))}
      </div>

      <Link to="/" className="block pt-2 text-center text-xs text-muted-foreground">← Back to home</Link>
    </div>
  );
}
