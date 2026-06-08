import { createFileRoute } from "@tanstack/react-router";
import { Check } from "lucide-react";
import { CUSTOM_COLOURS, useTheme } from "@/lib/theme";
import { usePlayer } from "@/lib/player";
import { useRouteAccent } from "@/lib/theme";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "YVL — Settings" }] }),
  component: SettingsPage,
});

const QUALITIES = ["96kbps", "160kbps", "320kbps"] as const;

function SettingsPage() {
  useRouteAccent("settings");
  const t = useTheme();
  const p = usePlayer();

  return (
    <div className="space-y-8 pb-10">
      <h1 className="font-display text-5xl">Settings</h1>

      <Group label="Theme">
        <Card>
          <Toggle
            emoji="🌈"
            title="Rainbow Mode"
            subtitle="Change the whole app's colour"
            value={t.rainbow}
            onChange={t.setRainbow}
          />
        </Card>

        <Card>
          <div className="space-y-3">
            <div className="text-base font-semibold">✏️ Custom Colour</div>
            <div className="flex flex-wrap gap-3">
              {CUSTOM_COLOURS.map((c) => {
                const selected = t.baseAccent.toLowerCase() === c.hex.toLowerCase() && !t.rainbow;
                return (
                  <button
                    key={c.hex}
                    onClick={() => { t.setRainbow(false); t.setPaint(true); t.setAccent(c.hex); }}
                    className={`grid size-12 place-items-center rounded-full ring-offset-background transition-all ${
                      selected ? "ring-4 ring-foreground" : ""
                    }`}
                    style={{ background: c.hex }}
                    aria-label={c.name}
                  >
                    {selected && <Check className="size-4 text-black/80" />}
                  </button>
                );
              })}
            </div>
          </div>
        </Card>

        <Card>
          <Toggle
            emoji="🎨"
            title="Per-Screen Colour"
            subtitle="Each screen has its own colour"
            value={t.perScreen}
            onChange={t.setPerScreen}
          />
        </Card>

        <button
          onClick={t.reset}
          className="w-full rounded-2xl border border-border bg-card py-4 text-sm font-semibold text-muted-foreground"
        >
          Reset to Black &amp; White
        </button>
      </Group>

      <Group label="Playback">
        <Card>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-base font-semibold">Audio Quality</div>
                <div className="text-xs text-muted-foreground">Streamed from JioSaavn (Melo API)</div>
              </div>
            </div>
            <div className="flex gap-2">
              {QUALITIES.map((q) => (
                <button
                  key={q}
                  onClick={() => p.setQuality(q)}
                  className={`flex-1 rounded-full px-3 py-2 text-xs font-semibold ${
                    p.quality === q ? "bg-accent text-accent-foreground" : "bg-secondary text-foreground"
                  }`}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </Group>

      <Group label="Account">
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="text-base font-semibold">🟢 Connect Spotify</div>
              <div className="text-xs text-muted-foreground">
                Optional. Only needed if you want to import your Spotify playlists & liked songs.
                Your library works without it.
              </div>
            </div>
            <button
              onClick={() => alert("Spotify import coming soon — sign-in flow will open here.")}
              className="shrink-0 rounded-full bg-accent px-4 py-2 text-xs font-semibold text-accent-foreground"
            >
              Connect
            </button>
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-base font-semibold">📥 Import Playlists</div>
              <div className="text-xs text-muted-foreground">After connecting, choose which playlists to bring in.</div>
            </div>
            <button disabled className="shrink-0 rounded-full bg-secondary px-4 py-2 text-xs font-semibold text-muted-foreground">
              Import
            </button>
          </div>
        </Card>
      </Group>

      <Group label="About">
        <Card>
          <p className="text-sm">
            <strong>YVL</strong> uses the same open sources as your Kotlin core-features:
            <span className="text-muted-foreground"> JioSaavn (meloapi)</span> for songs &amp; albums,
            <span className="text-muted-foreground"> LrcLib</span> for synced lyrics.
          </p>
        </Card>
      </Group>

    </div>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">{label}</h2>
      {children}
    </section>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-border bg-card p-4">{children}</div>;
}

function Toggle({
  emoji, title, subtitle, value, onChange,
}: { emoji: string; title: string; subtitle: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="text-base font-semibold">{emoji} {title}</div>
        <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
      </div>
      <button
        onClick={() => onChange(!value)}
        aria-pressed={value}
        className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${value ? "bg-accent" : "bg-secondary"}`}
      >
        <span
          className={`absolute top-1 size-6 rounded-full bg-background transition-transform ${value ? "translate-x-7" : "translate-x-1"}`}
        />
      </button>
    </div>
  );
}
