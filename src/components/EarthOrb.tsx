import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Saavn, bestImage, primaryArtist, toTrack, type SaavnAlbum } from "@/lib/saavn";
import { usePlayer } from "@/lib/player";
import { Play } from "lucide-react";

export function EarthOrb({ albums }: { albums: SaavnAlbum[] }) {
  const items = albums.slice(0, 48);
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
  const R = 170;

  async function quickPlay(a: SaavnAlbum) {
    let songs = a.songs;
    if (!songs?.length) {
      try { songs = (await Saavn.album(a.id)).songs ?? []; } catch { return; }
    }
    if (!songs?.length) return;
    await play(songs.map((s) => toTrack(s, quality)), 0);
  }

  return (
    <div className="relative mx-auto h-[480px] w-full max-w-[480px] select-none overflow-hidden rounded-3xl" style={{ background: "radial-gradient(ellipse at center, #06070d 0%, #000 70%)" }}>
      {/* Starfield */}
      <div className="pointer-events-none absolute inset-0" style={{
        backgroundImage:
          "radial-gradient(1px 1px at 20% 30%, #fff, transparent 60%), radial-gradient(1px 1px at 70% 80%, #fff, transparent 60%), radial-gradient(1.2px 1.2px at 40% 65%, #fff, transparent 60%), radial-gradient(1px 1px at 85% 20%, #fff, transparent 60%), radial-gradient(0.8px 0.8px at 10% 75%, #fff, transparent 60%), radial-gradient(1px 1px at 55% 12%, #fff, transparent 60%), radial-gradient(0.8px 0.8px at 33% 88%, #fff, transparent 60%), radial-gradient(1.4px 1.4px at 90% 55%, #fff, transparent 60%)",
        opacity: 0.65,
      }} />
      {/* Atmospheric rim glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          width: 340,
          height: 340,
          boxShadow: "0 0 80px 12px rgba(120,180,255,0.35), 0 0 200px 40px rgba(80,140,255,0.18)",
          background: "radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--accent-hex) 28%, transparent), transparent 65%)",
          filter: "blur(20px)",
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
          {/* Sphere — earth-blue core with rim light */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: R * 2,
              height: R * 2,
              background:
                "radial-gradient(circle at 30% 28%, #1a3a6e 0%, #0a1a3a 55%, #02060f 100%)",
              boxShadow:
                "inset -20px -30px 80px rgba(0,0,0,0.85), inset 18px 22px 60px rgba(120,180,255,0.18), 0 0 60px rgba(80,140,255,0.22)",
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
            // Hide the back-facing albums for crisper silhouette
            const front = z > -R * 0.15;
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
                  opacity: front ? Math.min(1, 0.55 + (z + R) / (2 * R) * 0.7) : 0,
                  pointerEvents: front ? "auto" : "none",
                  filter: isHover ? "none" : `brightness(${0.7 + ((z + R) / (2 * R)) * 0.5})`,
                  transition: "filter 200ms linear",
                }}
                aria-label={a.name}
              >
                <div
                  className={`relative overflow-hidden rounded-md bg-secondary transition-all ${
                    isHover ? "ring-2 ring-white shadow-glow scale-150 z-10" : ""
                  }`}
                  style={{
                    width: 42,
                    height: 42,
                    boxShadow: isHover
                      ? `0 0 24px color-mix(in srgb, var(--accent-hex) 80%, transparent)`
                      : `0 0 6px rgba(120,180,255,0.18)`,
                  }}
                >
                  {bestImage(a.image) && (
                    <img src={bestImage(a.image)} alt="" className="size-full object-cover" loading="lazy" />
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
