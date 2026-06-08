import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Saavn, bestImage } from "@/lib/saavn";
import { SongRow } from "@/components/SongRow";
import { AlbumCard } from "@/components/AlbumCard";
import { useRouteAccent } from "@/lib/theme";

export const Route = createFileRoute("/artist/$id")({
  head: () => ({ meta: [{ title: "YVL — Artist" }] }),
  component: ArtistPage,
});

function ArtistPage() {
  useRouteAccent("artist");
  const { id } = Route.useParams();
  const q = useQuery({ queryKey: ["artist", id], queryFn: () => Saavn.artist(id) });

  if (q.isLoading) return <p className="text-muted-foreground">Loading artist…</p>;
  if (q.isError || !q.data) return <p className="text-muted-foreground">Couldn’t load artist.</p>;

  const a = q.data;
  const cover = bestImage(a.image);
  const songs = a.topSongs ?? [];
  const albums = a.topAlbums ?? [];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto aspect-square w-40 overflow-hidden rounded-full bg-secondary shadow-glow">
          {cover && <img src={cover} alt="" className="size-full object-cover" />}
        </div>
        <h1 className="mt-4 font-display text-3xl">{a.name}</h1>
        {a.followerCount ? (
          <p className="text-xs text-muted-foreground">{a.followerCount.toLocaleString()} followers</p>
        ) : null}
      </div>

      {songs.length > 0 && (
        <section>
          <h2 className="font-display text-2xl">Top songs</h2>
          <div className="mt-3 space-y-1">
            {songs.slice(0, 10).map((s) => <SongRow key={s.id} song={s} queue={songs} />)}
          </div>
        </section>
      )}

      {albums.length > 0 && (
        <section>
          <h2 className="font-display text-2xl">Albums</h2>
          <div className="mt-3 -mx-5 flex gap-3 overflow-x-auto scrollbar-none px-5">
            {albums.map((al) => (
              <AlbumCard key={al.id} album={al} size={160} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
