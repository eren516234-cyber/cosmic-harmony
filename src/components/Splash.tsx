import { useEffect, useState } from "react";

const KEY = "yvl.splash.shown.v1";

export function Splash() {
  const [show, setShow] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem(KEY)) return;
    setShow(true);
    sessionStorage.setItem(KEY, "1");
    const t1 = setTimeout(() => setLeaving(true), 2100);
    const t2 = setTimeout(() => setShow(false), 2700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] grid place-items-center bg-black transition-opacity duration-500 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
      aria-hidden
    >
      {/* aurora gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="splash-aurora absolute inset-0 opacity-70" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,#000_75%)]" />
      </div>

      <div className="relative flex flex-col items-center gap-6">
        <div className="relative size-32">
          <span className="absolute inset-0 rounded-full bg-white/10 splash-ring" />
          <span className="absolute inset-2 rounded-full bg-white/15 splash-ring [animation-delay:.2s]" />
          <span className="absolute inset-4 rounded-full bg-white/20 splash-ring [animation-delay:.4s]" />
          <span className="absolute inset-0 grid place-items-center font-display text-6xl text-white splash-pop">
            Y
          </span>
        </div>
        <div className="splash-fade text-center">
          <div className="font-display text-2xl tracking-[0.3em] text-white">YVL</div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.4em] text-white/50">Music · Lyrics · Colour</div>
        </div>
      </div>
    </div>
  );
}
