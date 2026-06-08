import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { bestImage, primaryArtist, type SaavnAlbum } from "@/lib/saavn";

export function HoneycombDialer({ albums }: { albums: SaavnAlbum[] }) {
  const items = albums.slice(0, 8);
  const [angle, setAngle] = useState(0);
  const [selected, setSelected] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startA: number; v: number; lastX: number; lastT: number } | null>(null);
  const inertia = useRef<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => () => { if (inertia.current) cancelAnimationFrame(inertia.current); }, []);

  function startDrag(x: number) {
    if (inertia.current) cancelAnimationFrame(inertia.current);
    dragRef.current = { startX: x, startA: angle, v: 0, lastX: x, lastT: performance.now() };
  }
  function moveDrag(x: number) {
    if (!dragRef.current) return;
    const dx = x - dragRef.current.startX;
    const newA = dragRef.current.startA + dx * 0.6;
    const now = performance.now();
    const dt = Math.max(1, now - dragRef.current.lastT);
    dragRef.current.v = ((x - dragRef.current.lastX) * 0.6) / dt; // deg per ms
    dragRef.current.lastX = x;
    dragRef.current.lastT = now;
    setAngle(newA);
  }
  function endDrag() {
    if (!dragRef.current) return;
    let v = dragRef.current.v * 16; // per-frame
    dragRef.current = null;
    const tick = () => {
      v *= 0.94;
      setAngle((a) => a + v);
      if (Math.abs(v) > 0.05) inertia.current = requestAnimationFrame(tick);
      else inertia.current = null;
    };
    inertia.current = requestAnimationFrame(tick);
  }

  if (!items.length) return null;
  const r = 110; // radius
  const cur = items[((selected % items.length) + items.length) % items.length];

  return (
    <div className="relative mx-auto h-[320px] w-full max-w-[360px] select-none">
      <div
        ref={ref}
        className="absolute inset-0 touch-none"
        onPointerDown={(e) => { (e.target as Element).setPointerCapture(e.pointerId); startDrag(e.clientX); }}
        onPointerMove={(e) => moveDrag(e.clientX)}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        {items.map((a, i) => {
          const theta = (i / items.length) * 360 + angle;
          const rad = (theta * Math.PI) / 180;
          const x = Math.cos(rad) * r;
          const y = Math.sin(rad) * r;
          const depth = (Math.sin(rad) + 1) / 2; // 0..1
          const scale = 0.7 + depth * 0.55;
          const z = Math.round(depth * 100);
          const isSel = i === ((selected % items.length) + items.length) % items.length;
          return (
            <button
              key={a.id}
              onClick={(e) => {
                e.stopPropagation();
                if (isSel) navigate({ to: "/album/$id", params: { id: a.id } });
                else setSelected(i);
              }}
              className="absolute left-1/2 top-1/2 honeycomb-cell transition-transform duration-300"
              style={{
                transform: `translate(-50%,-50%) translate(${x}px,${y}px) scale(${scale})`,
                zIndex: z,
                opacity: 0.4 + depth * 0.6,
              }}
              aria-label={a.name}
            >
              <div
                className={`grid size-20 place-items-center overflow-hidden bg-secondary shadow-glow ${
                  isSel ? "ring-2 ring-accent" : ""
                }`}
                style={{ clipPath: "polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)" }}
              >
                {bestImage(a.image) && (
                  <img src={bestImage(a.image)} alt="" className="size-full object-cover" />
                )}
              </div>
            </button>
          );
        })}

        {/* Center */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="grid size-24 place-items-center rounded-full bg-accent text-accent-foreground shadow-glow">
            <div>
              <div className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-70">Now</div>
              <div className="font-display text-lg leading-none">Hive</div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 text-center">
        <div className="truncate text-sm font-semibold">{cur.name}</div>
        <div className="truncate text-xs text-muted-foreground">{primaryArtist(cur)}</div>
      </div>
    </div>
  );
}
