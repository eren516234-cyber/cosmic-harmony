// LocalStorage-backed playlists. Pure client-side, no backend.

export type PlaylistTrack = {
  id: string;
  title: string;
  artist: string;
  cover?: string;
};

export type Playlist = {
  id: string;
  name: string;
  createdAt: number;
  tracks: PlaylistTrack[];
};

const KEY = "yvl.playlists";

export function getPlaylists(): Playlist[] {
  if (typeof window === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}

function save(pls: Playlist[]) {
  try { localStorage.setItem(KEY, JSON.stringify(pls)); } catch {}
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("yvl:playlists-changed"));
  }
}

export function createPlaylist(name: string): Playlist {
  const pls = getPlaylists();
  const pl: Playlist = {
    id: `pl_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: name.trim() || "Untitled playlist",
    createdAt: Date.now(),
    tracks: [],
  };
  pls.unshift(pl);
  save(pls);
  return pl;
}

export function deletePlaylist(id: string) {
  save(getPlaylists().filter((p) => p.id !== id));
}

export function renamePlaylist(id: string, name: string) {
  const pls = getPlaylists();
  const p = pls.find((p) => p.id === id);
  if (!p) return;
  p.name = name.trim() || p.name;
  save(pls);
}

export function addToPlaylist(playlistId: string, track: PlaylistTrack) {
  const pls = getPlaylists();
  const p = pls.find((p) => p.id === playlistId);
  if (!p) return;
  if (p.tracks.some((t) => t.id === track.id)) return;
  p.tracks.push(track);
  save(pls);
}

export function removeFromPlaylist(playlistId: string, trackId: string) {
  const pls = getPlaylists();
  const p = pls.find((p) => p.id === playlistId);
  if (!p) return;
  p.tracks = p.tracks.filter((t) => t.id !== trackId);
  save(pls);
}
