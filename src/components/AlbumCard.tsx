import { Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { useState } from "react";
import { Saavn, bestImage, primaryArtist, toTrack, type SaavnAlbum } from "@/lib/saavn";
import { usePlayer } from "@/lib/player";

export function AlbumCard({ album, size = 160, offset = 0 }: { album: SaavnAlbum; size?: number; offset?: number }) {
  const { play, quality } = usePlayer();
  const [loading, setLoading] = useState(false);
  const cover = bestImage(album.image);

  async function quickPlay(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (loading) return;
    setLoading(true);
    try {
      let songs = album.songs;
      if (!songs?.length) {
        const full = await Saavn.album(album.id);
        songs = full.songs ?? [];
      }
      if (!songs?.length) return;
      await play(songs.map((s) => toTrack(s, quality)), 0);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Link
      to="/album/$id"
      params={{ id: album.id }}
      className="group relative block shrink-0"
      style={{ width: size, transform: offset ? `translateY(${offset}px)` : undefined }}
    >
      <div className="native-album-card relative aspect-square overflow-hidden rounded-[1.75rem] bg-secondary">
        {cover && (
          <img
            src={cover}
            alt=""
            className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80" />
        <button
          type="button"
          onClick={quickPlay}
          aria-label="Play album"
          className="absolute bottom-2 right-2 grid size-10 place-items-center rounded-full bg-accent text-accent-foreground shadow-glow transition-all active:scale-90 group-hover:scale-110"
        >
          <Play className={`size-4 translate-x-[1px] ${loading ? "animate-pulse" : ""}`} />
        </button>
      </div>
      <div className="mt-2 truncate text-sm font-semibold">{album.name}</div>
      <div className="truncate text-xs text-muted-foreground">{primaryArtist(album)}</div>
    </Link>
  );
}
