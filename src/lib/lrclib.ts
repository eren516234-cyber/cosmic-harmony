// LrcLib client with Enhanced-LRC (per-word) timestamp support.

export type LyricsWord = { time: number; text: string };
export type LyricsLine = { time: number; text: string; words?: LyricsWord[]; end?: number };
export type Lyrics = {
  synced: LyricsLine[];
  plain: string;
  source: "lrclib";
} | null;

const LINE_RE = /\[(\d+):(\d+(?:\.\d+)?)\](.*)/;
const WORD_RE = /<(\d+):(\d+(?:\.\d+)?)>/g;

function parseLrc(lrc: string): LyricsLine[] {
  const lines: LyricsLine[] = [];
  for (const raw of lrc.split(/\r?\n/)) {
    const m = LINE_RE.exec(raw);
    if (!m) continue;
    const time = parseInt(m[1], 10) * 60 + parseFloat(m[2]);
    const body = m[3] ?? "";
    // Enhanced LRC has inline <mm:ss.xx>word markers
    const words: LyricsWord[] = [];
    let lastIdx = 0;
    let lastTime = time;
    let cleanedText = "";
    let wm: RegExpExecArray | null;
    WORD_RE.lastIndex = 0;
    while ((wm = WORD_RE.exec(body))) {
      const before = body.slice(lastIdx, wm.index);
      if (before) {
        if (words.length === 0) {
          // first segment before any <ts> — belongs to the line start time
          const seg = before.trim();
          if (seg) words.push({ time: lastTime, text: seg });
        } else {
          words[words.length - 1].text += before;
        }
        cleanedText += before;
      }
      lastTime = parseInt(wm[1], 10) * 60 + parseFloat(wm[2]);
      lastIdx = wm.index + wm[0].length;
      words.push({ time: lastTime, text: "" });
    }
    const tail = body.slice(lastIdx);
    if (tail) {
      if (words.length === 0) cleanedText = body;
      else words[words.length - 1].text += tail;
      cleanedText += tail;
    } else if (!cleanedText) {
      cleanedText = body;
    }
    // Normalise word texts (trim trailing spaces but keep separators)
    const filteredWords = words
      .map((w) => ({ ...w, text: w.text.replace(/\s+/g, " ").trim() }))
      .filter((w) => w.text.length > 0);
    lines.push({
      time,
      text: cleanedText.trim(),
      words: filteredWords.length > 1 ? filteredWords : undefined,
    });
  }
  lines.sort((a, b) => a.time - b.time);
  for (let i = 0; i < lines.length - 1; i++) lines[i].end = lines[i + 1].time;
  return lines;
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
