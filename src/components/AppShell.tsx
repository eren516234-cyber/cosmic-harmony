import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, Library, Settings } from "lucide-react";
import { type ReactNode } from "react";
import { MiniPlayer } from "./MiniPlayer";
import { FullPlayer } from "./FullPlayer";
import { usePlayer } from "@/lib/player";

const NAV = [
  { to: "/",         label: "Home",     icon: Home },
  { to: "/search",   label: "Search",   icon: Search },
  { to: "/library",  label: "Library",  icon: Library },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { current } = usePlayer();

  return (
    <div className="min-h-screen w-full pb-40">
      <div className="mx-auto w-full max-w-[440px] px-5 pt-6 sm:max-w-[520px] md:max-w-[680px] md:px-8 lg:max-w-[820px]">
        <div key={pathname} className="animate-fade-up">{children}</div>
      </div>

      {/* Bottom dock */}
      <div className="fixed inset-x-0 bottom-0 z-40 flex justify-center pb-3">
        <div className="w-[min(680px,calc(100vw-24px))] space-y-2">
          {current && <MiniPlayer />}
          <nav className="flex items-center justify-around rounded-full border border-border bg-card/80 px-2 py-2 backdrop-blur-xl">
            {NAV.map(({ to, label, icon: Icon }) => {
              const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex flex-col items-center gap-0.5 rounded-full px-4 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors ${
                    active ? "text-accent" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.5 : 2} />
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <FullPlayer />
    </div>
  );
}
