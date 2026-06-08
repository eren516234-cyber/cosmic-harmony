// Client for the open JioSaavn API. We use saavn.dev (well-maintained fork of
// the same wrapper the Kotlin `jiosaavn` core-feature module uses) with a
// fallback to meloapi so search playback keeps working even if one is down.

const BASES = [
  "https://saavn.dev/api",
  "https://jiosaavn-api-privatecvc2.vercel.app/api",
  "https://meloapi.vercel.app/api",
];

export type SaavnImage = { quality: string; url: string };
export type SaavnDownloadUrl = { quality: string; url: string };
export type SaavnArtistMini = { id: string; name: string; image?: SaavnImage[] };
export type SaavnSong = {
  id: string;
  name: string;
  duration?: number;
  explicitContent?: boolean;
  playCount?: number;
  album?: { id?: string; name?: string };
  artists?: { primary?: SaavnArtistMini[]; featured?: SaavnArtistMini[]; all?: SaavnArtistMini[] };
  image?: SaavnImage[];
  downloadUrl?: SaavnDownloadUrl[];
};
export type SaavnAlbum = {
  id: string;
  name: string;
  year?: string;
  songCount?: number;
  image?: SaavnImage[];
  artists?: { primary?: SaavnArtistMini[]; all?: SaavnArtistMini[] };
  songs?: SaavnSong[];
};
export type SaavnArtist = {
  id: string;
  name: string;
  image?: SaavnImage[];
  followerCount?: number;
  topSongs?: SaavnSong[];
  topAlbums?: SaavnAlbum[];
};

export function bestImage(images?: SaavnImage[]) {
  if (!images?.length) return undefined;
  const order = ["500x500", "high", "large", "medium", "150x150", "low"];
  for (const q of order) {
    const hit = images.find((i) => i.quality === q || i.quality.includes(q));
    if (hit) return hit.url?.replace("http://", "https://");
  }
  return images[images.length - 1]?.url?.replace("http://", "https://");
}

export function bestStream(urls?: SaavnDownloadUrl[], preferred: string = "320kbps") {
  if (!urls?.length) return undefined;
  const pick =
    urls.find((u) => u.quality?.toLowerCase() === preferred.toLowerCase())?.url ??
    urls.find((u) => u.quality?.toLowerCase() === "320kbps")?.url ??
    urls.find((u) => u.quality?.toLowerCase() === "160kbps")?.url ??
    urls[urls.length - 1]?.url;
  return pick?.replace("http://", "https://");
}

export function primaryArtist(song?: SaavnSong | SaavnAlbum) {
  return song?.artists?.primary?.[0]?.name ?? song?.artists?.all?.[0]?.name ?? "Unknown";
}

async function get<T>(path: string, params: Record<string, string | number> = {}): Promise<T> {
  let lastErr: unknown;
  for (const base of BASES) {
    try {
      const url = new URL(`${base}${path}`);
      for (const [k, v] of Object.entries(params)) url.searchParams.set(k, String(v));
      const res = await fetch(url.toString(), { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`${res.status}`);
      const body = (await res.json()) as { success?: boolean; data: T };
      if (body.success === false) throw new Error("success=false");
      return body.data;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("All Saavn endpoints failed");
}

export const Saavn = {
  searchSongs: (query: string, limit = 20) =>
    get<{ results: SaavnSong[]; total: number }>(`/search/songs`, { query, limit }),
  searchAlbums: (query: string, limit = 20) =>
    get<{ results: SaavnAlbum[]; total: number }>(`/search/albums`, { query, limit }),
  searchArtists: (query: string, limit = 20) =>
    get<{ results: SaavnArtist[]; total: number }>(`/search/artists`, { query, limit }),
  song: (id: string) =>
    get<SaavnSong[] | { songs: SaavnSong[] }>(`/songs`, { id }).then((r) =>
      Array.isArray(r) ? r[0] : r.songs?.[0]
    ),
  album: (id: string) => get<SaavnAlbum>(`/albums`, { id }),
  artist: (id: string) => get<SaavnArtist>(`/artists`, { id }),
};

export type Track = {
  id: string;
  title: string;
  artist: string;
  artistId?: string;
  albumId?: string;
  cover?: string;
  duration: number;
  stream?: string;
};

export function toTrack(s: SaavnSong, quality = "320kbps"): Track {
  return {
    id: s.id,
    title: s.name,
    artist: primaryArtist(s),
    artistId: s.artists?.primary?.[0]?.id,
    albumId: s.album?.id,
    cover: bestImage(s.image),
    duration: s.duration ?? 0,
    stream: bestStream(s.downloadUrl, quality),
  };
}
