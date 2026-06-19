import type { SavedTrackResponse, SpotifyTrackSummary } from "@/lib/api";
import type { AiSessionState, CuratedCacheEntry, HeadphonesListeningMode, Msg, PlayerType, UiTrack } from "./types";
import { HEADPHONES_MODE_STORAGE_KEY } from "./constants";

const CURATED_CACHE_KEY = "music_curated_cache_v1";

let memoryCuratedCache: Partial<Record<PlayerType, CuratedCacheEntry>> | null = null;

export function readCuratedCache(): Partial<Record<PlayerType, CuratedCacheEntry>> {
  if (memoryCuratedCache) return memoryCuratedCache;
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(CURATED_CACHE_KEY);
    memoryCuratedCache = raw ? (JSON.parse(raw) as Partial<Record<PlayerType, CuratedCacheEntry>>) : {};
  } catch {
    memoryCuratedCache = {};
  }
  return memoryCuratedCache;
}

export function writeCuratedCache(next: Partial<Record<PlayerType, CuratedCacheEntry>>) {
  memoryCuratedCache = next;
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(CURATED_CACHE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota errors in private mode.
  }
}

export function getCuratedCache(playerType: PlayerType): CuratedCacheEntry | null {
  const all = readCuratedCache();
  return all[playerType] ?? null;
}

export function setCuratedCache(
  playerType: PlayerType,
  tracks: UiTrack[],
  opts: { refreshPinned: boolean; headphonesListeningMode?: HeadphonesListeningMode } = { refreshPinned: false },
) {
  const all = readCuratedCache();
  const entry: CuratedCacheEntry = { at: Date.now(), tracks };
  if (opts.refreshPinned) entry.refreshPinned = true;
  if (playerType === "headphones" && opts.headphonesListeningMode != null) {
    entry.headphonesListeningMode = opts.headphonesListeningMode;
  }
  writeCuratedCache({ ...all, [playerType]: entry });
}

export function detectRecommendLocale(userText: string): "zh" | "en" {
  return /[\u4e00-\u9fff]/.test(userText) ? "zh" : "en";
}

export function initialAiGreetingMsg(): Msg {
  return {
    role: "ai",
    text: "Hi! Tell me your mood or what you'd like to listen to, and I'll suggest some tracks for you.",
  };
}

export function createInitialAiSession(): AiSessionState {
  return { msgs: [initialAiGreetingMsg()], lastItems: [], input: "" };
}

export function formatMs(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

export function hashColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h);
  const hue = Math.abs(h) % 360;
  return `hsl(${hue} 42% 62%)`;
}

export function spotifyToUi(t: SpotifyTrackSummary, liked: boolean): UiTrack {
  const ms = t.durationMs ?? 0;
  return {
    id: t.id,
    name: t.name,
    artist: t.artistsDisplay ?? "",
    dur: ms ? formatMs(ms) : "—",
    color: hashColor(t.id),
    liked,
    previewUrl: t.previewUrl,
    imageUrl: t.albumImageUrl,
    durationMs: t.durationMs,
  };
}

export function pickDefaultCurrentFromMainList(tracks: UiTrack[], prev: UiTrack | null): UiTrack | null {
  if (prev && tracks.some(x => x.id === prev.id)) return prev;
  return tracks[0] ?? null;
}

export function mergeTracksUnique(a: UiTrack[], b: UiTrack[]): UiTrack[] {
  const seen = new Set(a.map(t => t.id));
  const out = [...a];
  for (const t of b) {
    if (!seen.has(t.id)) { seen.add(t.id); out.push(t); }
  }
  return out;
}

export function rotateStrings<T>(arr: readonly T[], n: number): T[] {
  if (arr.length === 0) return [];
  const k = ((n % arr.length) + arr.length) % arr.length;
  return [...arr.slice(k), ...arr.slice(0, k)];
}

export function savedToUi(s: SavedTrackResponse, liked = true): UiTrack {
  const ms = s.durationMs ?? 0;
  return {
    id: s.spotifyTrackId,
    name: s.trackName ?? "—",
    artist: s.artistNames ?? "",
    dur: ms ? formatMs(ms) : "—",
    color: hashColor(s.spotifyTrackId),
    liked,
    previewUrl: s.previewUrl,
    imageUrl: s.imageUrl,
    durationMs: s.durationMs,
  };
}

export function readHeadphonesMode(): HeadphonesListeningMode {
  if (typeof window === "undefined") return "late_night_radio";
  try {
    const raw = sessionStorage.getItem(HEADPHONES_MODE_STORAGE_KEY);
    if (raw === "late_night_radio" || raw === "warm_cafe_jazz" || raw === "cinematic_ambient") return raw;
  } catch {
    // ignore
  }
  return "late_night_radio";
}

export function persistHeadphonesMode(mode: HeadphonesListeningMode) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(HEADPHONES_MODE_STORAGE_KEY, mode);
  } catch {
    // ignore
  }
}
