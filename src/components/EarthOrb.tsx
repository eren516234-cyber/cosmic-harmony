import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Saavn, bestImage, primaryArtist, toTrack, type SaavnAlbum } from "@/lib/saavn";
import { usePlayer } from "@/lib/player";
import { Play } from "lucide-react";

export function EarthOrb({ albums }: { albums: SaavnAlbum[] }) {
  const items = albums.slice(0, 26);
  const navigate = useNavigate();
  const { play, quality } = usePlayer();
  const [rot, setRot] = useState({ x: -12, y: 0 });
  const [hovered, setHovered] = useState<number | null>(null);
  const dragging = useRef<{ x: number; y: number; rx: number; ry: number } | null>(null);
  const velocity = useRef({ x: 0, y: 0 });

  // Auto-rotate + inertia loop
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      if (!dragging.current) {
        setRot((r) => {
          const vy = velocity.current.y;
          const vx = velocity.current.x;
          velocity.current.x *= 0.94;
          velocity.current.y *= 0.94;
          const drift = Math.abs(vy) < 0.05 && Math.abs(vx) < 0.05 ? 0.12 : 0;
          return { x: r.x + vx, y: r.y + vy + drift };
        });
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  if (!items.length) return null;
  const R = 130;

  async function quickPlay(a: SaavnAlbum) {
    let songs = a.songs;
    if (!songs?.length) {
      try { songs = (await Saavn.album(a.id)).songs ?? []; } catch { return; }
    }
    if (!songs?.length) return;
    await play(songs.map((s) => toTrack(s, quality)), 0);
  }

  return (
    <div className="relative mx-auto h-[360px] w-full max-w-[380px] select-none">
      {/* Glow under orb */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: 320,
          height: 320,
          background:
            "radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--accent-hex) 55%, transparent), transparent 65%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="absolute inset-0 touch-none"
        style={{ perspective: "1000px" }}
        onPointerDown={(e) => {
          (e.target as Element).setPointerCapture(e.pointerId);
          dragging.current = { x: e.clientX, y: e.clientY, rx: rot.x, ry: rot.y };
          velocity.current = { x: 0, y: 0 };
        }}
        onPointerMove={(e) => {
          if (!dragging.current) return;
          const dx = e.clientX - dragging.current.x;
          const dy = e.clientY - dragging.current.y;
          const ny = dragging.current.ry + dx * 0.45;
          const nx = Math.max(-50, Math.min(50, dragging.current.rx - dy * 0.35));
          velocity.current = { x: nx - rot.x, y: ny - rot.y };
          setRot({ x: nx, y: ny });
        }}
        onPointerUp={() => { dragging.current = null; }}
        onPointerCancel={() => { dragging.current = null; }}
      >
        <div
          className="absolute inset-0"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(${rot.x}deg) rotateY(${rot.y}deg)`,
            transition: dragging.current ? "none" : "transform 60ms linear",
          }}
        >
          {/* Sphere wireframe */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: R * 2,
              height: R * 2,
              border: "1px solid color-mix(in srgb, var(--accent-hex) 18%, transparent)",
              boxShadow: "inset 0 0 80px color-mix(in srgb, var(--accent-hex) 14%, transparent)",
              transform: "translateZ(-1px)",
            }}
          />

          {items.map((a, i) => {
            // Fibonacci sphere distribution
            const k = i + 0.5;
            const phi = Math.acos(1 - (2 * k) / items.length);
            const theta = Math.PI * (1 + Math.sqrt(5)) * k;
            const x = Math.sin(phi) * Math.cos(theta) * R;
            const y = Math.sin(phi) * Math.sin(theta) * R - R * 0.05;
            const z = Math.cos(phi) * R;
            const isHover = hovered === i;
            return (
              <button
                key={a.id}
                type="button"
                onPointerEnter={() => setHovered(i)}
                onPointerLeave={() => setHovered(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  navigate({ to: "/album/$id", params: { id: a.id } });
                }}
                className="absolute left-1/2 top-1/2 outline-none"
                style={{
                  transform: `translate(-50%,-50%) translate3d(${x}px,${y}px,${z}px) rotateY(${-rot.y}deg) rotateX(${-rot.x}deg)`,
                  transformStyle: "preserve-3d",
                }}
                aria-label={a.name}
              >
                <div
                  className={`relative overflow-hidden rounded-xl bg-secondary shadow-glow transition-all ${
                    isHover ? "ring-2 ring-accent" : ""
                  }`}
                  style={{ width: 48, height: 48 }}
                >
                  {bestImage(a.image) && (
                    <img src={bestImage(a.image)} alt="" className="size-full object-cover" />
                  )}
                  <span
                    onClick={(e) => { e.stopPropagation(); void quickPlay(a); }}
                    className="absolute inset-0 grid cursor-pointer place-items-center bg-black/55 opacity-0 transition-opacity hover:opacity-100"
                  >
                    <Play className="size-4 text-white" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Caption */}
      {hovered !== null && items[hovered] && (
        <div className="pointer-events-none absolute inset-x-0 bottom-1 text-center">
          <div className="truncate text-sm font-semibold">{items[hovered].name}</div>
          <div className="truncate text-xs text-muted-foreground">{primaryArtist(items[hovered])}</div>
        </div>
      )}
      <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 text-center">
        <div className="text-[9px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Orbit</div>
        <div className="font-display text-lg leading-none">YVL · Earth</div>
      </div>
    </div>
  );
}
