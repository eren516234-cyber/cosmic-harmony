import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Heart, ListMusic, Clock } from "lucide-react";
import { useRouteAccent } from "@/lib/theme";

export const Route = createFileRoute("/library")({
  head: () => ({ meta: [{ title: "YVL — Library" }] }),
  component: LibraryPage,
});

type LikedTrack = { id: string; title: string; artist: string; cover?: string };

function LibraryPage() {
  useRouteAccent("library");
  const [liked, setLiked] = useState<LikedTrack[]>([]);
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => {
    try { setLiked(JSON.parse(localStorage.getItem("yvl.liked") ?? "[]")); } catch {}
    try { setRecents(JSON.parse(localStorage.getItem("yvl.recent.searches") ?? "[]")); } catch {}
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="font-display text-5xl">Library</h1>

      <div className="grid grid-cols-2 gap-3">
        <Card icon={<Heart className="size-5" />} title="Liked songs" subtitle={`${liked.length} tracks`} to="/" />
        <Card icon={<ListMusic className="size-5" />} title="Playlists" subtitle="Coming soon" to="/" />
        <Card icon={<Clock className="size-5" />} title="Recent searches" subtitle={`${recents.length} queries`} to="/search" />
      </div>

      <section>
        <h2 className="font-display text-2xl">Liked</h2>
        {liked.length === 0 ? (
          <p className="mt-3 rounded-2xl border border-border bg-card p-4 text-sm text-muted-foreground">
            Tap the heart on any track to save it here. Stored on this device.
          </p>
        ) : (
          <div className="mt-3 space-y-1">
            {liked.map((t) => (
              <div key={t.id} className="flex items-center gap-3 rounded-2xl p-2">
                <div className="size-12 overflow-hidden rounded-xl bg-secondary">
                  {t.cover && <img src={t.cover} alt="" className="size-full object-cover" />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-semibold">{t.title}</div>
                  <div className="truncate text-xs text-muted-foreground">{t.artist}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Card({ icon, title, subtitle, to }: { icon: React.ReactNode; title: string; subtitle: string; to: string }) {
  return (
    <Link to={to} className="rounded-2xl border border-border bg-card p-4">
      <div className="grid size-9 place-items-center rounded-full bg-accent text-accent-foreground">{icon}</div>
      <div className="mt-3 font-semibold">{title}</div>
      <div className="text-xs text-muted-foreground">{subtitle}</div>
    </Link>
  );
}
