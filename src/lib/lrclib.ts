// LrcLib client — same source as the Kotlin `lrclib` core-feature module.

export type LyricsLine = { time: number; text: string };
export type Lyrics = {
  synced: LyricsLine[];
  plain: string;
  source: "lrclib";
} | null;

function parseLrc(lrc: string): LyricsLine[] {
  const lines: LyricsLine[] = [];
  const re = /\[(\d+):(\d+(?:\.\d+)?)\](.*)/g;
  for (const raw of lrc.split(/\r?\n/)) {
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(raw))) {
      const min = parseInt(m[1], 10);
      const sec = parseFloat(m[2]);
      lines.push({ time: min * 60 + sec, text: m[3].trim() });
    }
  }
  return lines.sort((a, b) => a.time - b.time);
}

export async function fetchLyrics(
  trackName: string,
  artistName: string,
  duration?: number,
): Promise<Lyrics> {
  const url = new URL("https://lrclib.net/api/get");
  url.searchParams.set("track_name", trackName);
  url.searchParams.set("artist_name", artistName);
  if (duration) url.searchParams.set("duration", String(Math.round(duration)));

  let res = await fetch(url.toString());
  if (!res.ok && res.status !== 404) throw new Error(`LrcLib ${res.status}`);
  if (res.status === 404) {
    // Relax: search endpoint
    const s = new URL("https://lrclib.net/api/search");
    s.searchParams.set("track_name", trackName);
    s.searchParams.set("artist_name", artistName);
    const r2 = await fetch(s.toString());
    if (!r2.ok) return null;
    const arr = (await r2.json()) as Array<{ id: number; syncedLyrics?: string; plainLyrics?: string }>;
    if (!arr.length) return null;
    const hit = arr[0];
    return {
      synced: hit.syncedLyrics ? parseLrc(hit.syncedLyrics) : [],
      plain: hit.plainLyrics ?? "",
      source: "lrclib",
    };
  }
  const data = (await res.json()) as { syncedLyrics?: string; plainLyrics?: string };
  return {
    synced: data.syncedLyrics ? parseLrc(data.syncedLyrics) : [],
    plain: data.plainLyrics ?? "",
    source: "lrclib",
  };
}
