import imgFavorites from "../assets/favorites.png";
import imgStudy from "../assets/study.png";
import imgParty from "../assets/party.png";
import imgSports from "../assets/sports.png";
import imgHeadphones from "../assets/headphonezone.png";
import { useState, useRef, useCallback, useEffect, useMemo, type ReactNode } from "react";
import {
  aiApi,
  getToken,
  libraryApi,
  spotifyApi,
  type AiRecommendTrackDto,
  type SavedTrackResponse,
  type SpotifyTrackSummary,
} from "../lib/api";
import { generatePkcePair, spotifyRedirectUri } from "../lib/pkce";
import { CURATED_TRACK_IDS } from "../lib/spotifyCuratedTracks";
import { UserAvatar } from "./UserAvatar";

export type PlayerType = "study" | "party" | "sports" | "headphones";

const IC = {
  heart: (filled = false) => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
    </svg>
  ),
  book: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
  bot: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4"/>
      <circle cx="8" cy="16" r="1" fill="currentColor"/><circle cx="12" cy="16" r="1" fill="currentColor"/><circle cx="16" cy="16" r="1" fill="currentColor"/>
    </svg>
  ),
  play: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>,
  prev: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>,
  next: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg>,
  shuffle: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/>
      <polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/><line x1="4" y1="4" x2="9" y2="9"/>
    </svg>
  ),
  repeat: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
      <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
    </svg>
  ),
  repeatOne: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
      <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
      <path d="M12 9v6" strokeWidth="2.5"/><path d="M10 11l2-2" strokeWidth="2.5"/>
    </svg>
  ),
  search: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
  ),
  more: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/>
    </svg>
  ),
  music: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9 18V5l12-2v13" opacity="0.9"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
    </svg>
  ),
  send: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  ),
  clock: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  musicSm: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M9 18V5l12-2v13" opacity="0.92" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),
  refresh: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 4v6h-6" />
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L21 14" />
    </svg>
  ),
  sliders: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="4" y1="21" x2="4" y2="14" />
      <line x1="4" y1="10" x2="4" y2="3" />
      <line x1="12" y1="21" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12" y2="3" />
      <line x1="20" y1="21" x2="20" y2="16" />
      <line x1="20" y1="12" x2="20" y2="3" />
      <circle cx="4" cy="12" r="2" />
      <circle cx="12" cy="10" r="2" />
      <circle cx="20" cy="14" r="2" />
    </svg>
  ),
};

export type UiTrack = {
  id: string;
  name: string;
  artist: string;
  dur: string;
  color: string;
  liked: boolean;
  previewUrl?: string | null;
  imageUrl?: string | null;
  durationMs?: number | null;
};

type RepeatMode = "none" | "all" | "one";
type Msg = { role: "user" | "ai"; text: string };
type TabKey = "favorites" | "main" | "ai";

export type HeadphonesListeningMode = "late_night_radio" | "warm_cafe_jazz" | "cinematic_ambient";

type CuratedCacheEntry = {
  at: number;
  tracks: UiTrack[];
  /** True after user clicks Refresh picks; list stays until the next refresh. */
  refreshPinned?: boolean;
  /** Which headphone Listening style produced this list (headphones player only). */
  headphonesListeningMode?: HeadphonesListeningMode;
};

const CURATED_CACHE_KEY = "music_curated_cache_v1";

let memoryCuratedCache: Partial<Record<PlayerType, CuratedCacheEntry>> | null = null;

function readCuratedCache(): Partial<Record<PlayerType, CuratedCacheEntry>> {
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

function writeCuratedCache(next: Partial<Record<PlayerType, CuratedCacheEntry>>) {
  memoryCuratedCache = next;
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(CURATED_CACHE_KEY, JSON.stringify(next));
  } catch {
    // Ignore storage quota errors in private mode.
  }
}

function getCuratedCache(playerType: PlayerType): CuratedCacheEntry | null {
  const all = readCuratedCache();
  return all[playerType] ?? null;
}

function setCuratedCache(
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

function detectRecommendLocale(userText: string): "zh" | "en" {
  return /[\u4e00-\u9fff]/.test(userText) ? "zh" : "en";
}

function initialAiGreetingMsg(): Msg {
  return {
    role: "ai",
    text: "Hi! Tell me your mood or what you'd like to listen to, and I'll suggest some tracks for you.",
  };
}

type AiSessionState = {
  msgs: Msg[];
  lastItems: AiRecommendTrackDto[];
  input: string;
};

function createInitialAiSession(): AiSessionState {
  return { msgs: [initialAiGreetingMsg()], lastItems: [], input: "" };
}

function formatMs(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

function hashColor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = seed.charCodeAt(i) + ((h << 5) - h);
  const hue = Math.abs(h) % 360;
  return `hsl(${hue} 42% 62%)`;
}

function spotifyToUi(t: SpotifyTrackSummary, liked: boolean): UiTrack {
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

function pickDefaultCurrentFromMainList(tracks: UiTrack[], prev: UiTrack | null): UiTrack | null {
  if (prev && tracks.some(x => x.id === prev.id)) return prev;
  return tracks[0] ?? null;
}

function mergeTracksUnique(a: UiTrack[], b: UiTrack[]): UiTrack[] {
  const seen = new Set(a.map(t => t.id));
  const out = [...a];
  for (const t of b) {
    if (!seen.has(t.id)) { seen.add(t.id); out.push(t); }
  }
  return out;
}

function rotateStrings<T>(arr: readonly T[], n: number): T[] {
  if (arr.length === 0) return [];
  const k = ((n % arr.length) + arr.length) % arr.length;
  return [...arr.slice(k), ...arr.slice(0, k)];
}

const HEADPHONES_MODE_STORAGE_KEY = "headphones_listening_mode_v1";

const HEADPHONES_MODE_VARIANTS: Record<HeadphonesListeningMode, readonly string[]> = {
  late_night_radio: [
    "late night indie radio mellow vocals",
    "lo-fi indie bedroom pop slow",
    "alternative soft rock headphones intimate night",
    "indie folk quiet acoustic late",
    "slowcore indie melancholic atmospheric",
    "slow indie synth pop mellow night drives",
    "indie shoegaze soft headphone mix",
    "bedroom pop sad chill night walk headphones",
    "indie acoustic live session late evening",
    "dream pop indie ethereal slow",
  ],
  warm_cafe_jazz: [
    "coffee shop jazz warm mellow acoustic guitar",
    "late night café jazz soft intimate",
    "bossa nova lounge relaxed headphones warm",
    "smooth jazz ballad mellow nostalgic evening",
    "gypsy jazz swing acoustic calm café",
    "vocal jazz ballad smoky warm trio",
    "latin jazz soft percussion chill mellow",
    "nu jazz downtempo café warm",
    "piano trio jazz mellow intimate headphone",
    "soul jazz slow warm evening mellow",
  ],
  cinematic_ambient: [
    "cinematic ambient film score peaceful orchestral",
    "neo classical strings calm melancholic headphone",
    "post rock ambient instrumental slow cinematic",
    "ambient piano wide emotional soundtrack soft",
    "soundtrack emotional instrumental strings calm",
    "ambient orchestral pads slow burn cinematic",
    "modern classical cello piano peaceful wide",
    "atmospheric drone gentle cinematic mellow",
    "ambient guitar reverb melancholic headphone film",
    "neo classical minimalist piano orchestral calm",
  ],
};

const HEADPHONES_MODE_OPTIONS: readonly { mode: HeadphonesListeningMode; label: string }[] = [
  { mode: "late_night_radio", label: "Late Night Radio" },
  { mode: "warm_cafe_jazz", label: "Warm Café Jazz" },
  { mode: "cinematic_ambient", label: "Cinematic Ambient" },
];

function readHeadphonesMode(): HeadphonesListeningMode {
  if (typeof window === "undefined") return "late_night_radio";
  try {
    const raw = sessionStorage.getItem(HEADPHONES_MODE_STORAGE_KEY);
    if (raw === "late_night_radio" || raw === "warm_cafe_jazz" || raw === "cinematic_ambient") return raw;
  } catch {
    // ignore
  }
  return "late_night_radio";
}

function persistHeadphonesMode(mode: HeadphonesListeningMode) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(HEADPHONES_MODE_STORAGE_KEY, mode);
  } catch {
    // ignore
  }
}

function savedToUi(s: SavedTrackResponse, liked = true): UiTrack {
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

const CFG: Record<
  PlayerType,
  {
    emoji: string;
    mainLabel: string;
    title: string;
    desc: string;
    loadingDesc: string;
    dur: string;
    accent: string;
    accentB: string;
    grad: string;
    searchQuery: string;
    pageScene: string;
    cover: string;
  }
> = {
  study: {
    emoji: "📚",
    mainLabel: "Study Playlist",
    title: "Study Flow",
    desc: "Focus, boost efficiency, enjoy immersive sessions.",
    loadingDesc: "Enjoy your immersive study session.",
    dur: "Spotify",
    accent: "#70c0ff",
    accentB: "#50a0f0",
    grad: "linear-gradient(135deg, rgba(80,150,230,0.6), rgba(55,110,210,0.55))",
    searchQuery: "focus study lo-fi instrumental calm",
    pageScene: "STUDY",
    cover: imgStudy,
  },
  party: {
    emoji: "🎉",
    mainLabel: "Party Mix",
    title: "Party Mix",
    desc: "Turn up the energy and get the crowd moving.",
    loadingDesc: "Enjoy your energetic party time.",
    dur: "Spotify",
    accent: "#a060e8",
    accentB: "#8040c8",
    grad: "linear-gradient(135deg, rgba(155,80,220,0.6), rgba(120,55,195,0.55))",
    searchQuery: "party dance pop hits energy",
    pageScene: "PARTY",
    cover: imgParty,
  },
  sports: {
    emoji: "🏃",
    mainLabel: "Sports Mode",
    title: "Sports Mode",
    desc: "Push your limits with high-energy anthems.",
    loadingDesc: "Enjoy your powerful workout session.",
    dur: "Spotify",
    accent: "#90c040",
    accentB: "#b8d830",
    grad: "linear-gradient(135deg, rgba(130,190,50,0.6), rgba(175,210,40,0.55))",
    searchQuery: "workout gym motivation running power",
    pageScene: "SPORTS",
    cover: imgSports,
  },
  headphones: {
    emoji: "🎧",
    mainLabel: "Listening Room",
    title: "Headphone Zone",
    desc: "Deep listening — pick a style with the button by the search box.",
    loadingDesc: "Curating your headphone playlist…",
    dur: "Spotify",
    accent: "#7d5544",
    accentB: "#c4a574",
    grad: "linear-gradient(135deg, rgba(120,82,62,0.62), rgba(180,138,94,0.52))",
    searchQuery: HEADPHONES_MODE_VARIANTS.late_night_radio[0]!,
    pageScene: "HEADPHONES",
    cover: imgHeadphones,
  },
};

/** Rotated Spotify search queries so “Refresh picks” surfaces different tracks (non-headphone modes). */
const REFRESH_SEARCH_VARIANTS: Record<Exclude<PlayerType, "headphones">, readonly string[]> = {
  study: [
    "focus study lo-fi instrumental calm",
    "piano instrumental study concentration",
    "deep focus reading music instrumental",
    "classical piano ambient study",
    "lo-fi beats homework chill",
    "minimal piano focus concentration",
    "soft jazz study background instrumental",
    "acoustic guitar calm focus",
    "cello ambient peaceful study",
    "synth ambient focus music",
  ],
  party: [
    "party dance pop hits energy",
    "disco funk dance floor",
    "edm festival banger",
    "hip hop party anthems",
    "latin dance party summer",
    "2000s dance pop party",
    "house music party night",
    "reggaeton dance hits",
    "indie dance party upbeat",
    "remix pack dance energy",
  ],
  sports: [
    "workout gym motivation running",
    "high energy cardio training",
    "power rock workout anthems",
    "hip hop gym motivation",
    "electronic running tempo",
    "crossfit intense workout",
    "metal gym energy",
    "afrobeats workout rhythm",
    "stadium rock sports hype",
    "drum bass running pace",
  ],
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&family=DM+Mono:wght@400;500&display=swap');

.mp * { box-sizing: border-box; font-family: 'DM Sans', system-ui, sans-serif; }
.mp ::-webkit-scrollbar { width: 2px; }
.mp ::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.18); border-radius: 1px; }

.mp-overlay {
  position: fixed; inset: 0;
  display: flex; align-items: center; justify-content: center;
  z-index: 9999;
  animation: mpIn 0.3s ease-out;
}
@keyframes mpIn { from{opacity:0;transform:scale(0.97)} to{opacity:1;transform:scale(1)} }

.mp-panel {
  width: 1120px; height: 720px;
  max-width: none; max-height: none;
  border-radius: 28px; overflow: hidden;
  display: flex; flex-direction: column;
  position: relative; color: #1a1a1a;
  background: rgba(180, 178, 178, 0.62);
  backdrop-filter: blur(28px) saturate(120%);
  -webkit-backdrop-filter: blur(28px) saturate(120%);
  border: 1px solid rgba(255,255,255,0.28);
  box-shadow:
    0 24px 70px rgba(40,20,80,0.3),
    0 0 0 1px rgba(255,255,255,0.08) inset;
}
.mp-panel::before {
  content:''; position:absolute; top:0; left:0; right:0; height:1px;
  background: linear-gradient(90deg, transparent 8%, rgba(255,255,255,0.6) 40%, rgba(255,255,255,0.65) 60%, transparent 92%);
  border-radius:28px 28px 0 0; z-index:3; pointer-events:none;
}

.mp-sidebar {
  width: 215px; min-width: 215px; padding: 24px 12px;
  display: flex; flex-direction: column;
  border-right: 1px solid rgba(0,0,0,0.1);
  background: rgba(255,255,255,0.12);
}

.mp-nav {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 13px; border-radius: 11px; cursor: pointer;
  border: 1px solid transparent; transition: all .18s;
  font-size: 14px; color: rgba(0,0,0,0.5);
}
.mp-nav:hover { background: rgba(0,0,0,0.07); color: rgba(0,0,0,0.8); }
.mp-nav.active { color: #1a1a1a; font-weight: 600; }

.mp-track { border-radius: 9px; transition: background .13s; cursor: pointer; }
.mp-track:hover { background: rgba(0,0,0,0.06) !important; }

.mp-btn {
  background: none; border: none; padding: 0; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: opacity .14s, transform .13s;
}
.mp-btn:hover { opacity: .6; }
.mp-btn:active { transform: scale(.86); }

.mp-search-in:focus { outline: none; }
.mp-chat-in:focus   { outline: none; border-color: rgba(100,100,200,0.4) !important; }

@keyframes mpin { from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:translateY(0)} }
.mpin { animation: mpin .2s ease forwards; }

@keyframes dp { 0%,100%{opacity:.3} 50%{opacity:1} }
.mp-dot { display:inline-block; width:5px; height:5px; border-radius:50%; background:rgba(80,80,180,0.7); margin:0 2px; animation:dp 1.2s ease infinite; }
.mp-dot:nth-child(2){animation-delay:.2s} .mp-dot:nth-child(3){animation-delay:.4s}
`;

function TrackList({
  tracks, title, desc, duration, accent, accentB, grad, cover, coverObjectFit = "cover", coverPad = 0, currentId, onSelect, onToggleLike,
  primaryLabel, primaryIcon, onPrimaryAction, primaryDisabled,
}: {
  tracks: UiTrack[]; title: string; desc: string; duration: string;
  accent: string; accentB: string; grad: string; cover: string;
  /** Headphone art is taller than square — use contain so nothing is cropped. */
  coverObjectFit?: "cover" | "contain";
  /** Inner padding inside the poster (px) when scaling with contain. */
  coverPad?: number;
  currentId: string;
  onSelect: (t: UiTrack) => void; onToggleLike: (t: UiTrack) => void;
  primaryLabel: string;
  primaryIcon: ReactNode;
  onPrimaryAction: () => void | Promise<void>;
  primaryDisabled?: boolean;
}) {
  return (
    <div className="mpin" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
      <div style={{ display: "flex", gap: 22, padding: "22px 24px 14px", alignItems: "flex-start", flexShrink: 0 }}>
        <div
          style={{
            width: 128,
            height: 128,
            borderRadius: 16,
            flexShrink: 0,
            background: grad,
            border: "1px solid rgba(255,255,255,0.22)",
            overflow: "hidden",
            boxShadow: `0 6px 24px rgba(0,0,0,0.2), 0 0 20px ${accent}33, inset 0 1px 0 rgba(255,255,255,0.25)`,
            boxSizing: "border-box",
            padding: coverPad,
            display: coverObjectFit === "contain" ? "flex" : "block",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img src={cover} alt="" style={{ width: "100%", height: "100%", objectFit: coverObjectFit, objectPosition: "center center" }} />
        </div>
        <div style={{ flex: 1, minWidth: 0, paddingTop: 4 }}>
          <h2 style={{ margin: "0 0 5px", fontSize: 25, fontWeight: 600, color: "#1a1a1a", letterSpacing: "-0.02em" }}>{title}</h2>
          <p style={{ margin: "0 0 4px", fontSize: 13, color: "rgba(0,0,0,0.6)", lineHeight: 1.5 }}>{desc}</p>
          <p style={{ margin: "0 0 14px", fontSize: 12, color: "rgba(0,0,0,0.45)" }}>{tracks.length} tracks · {duration}</p>
          <button type="button" className="mp-btn" onClick={() => void onPrimaryAction()} disabled={primaryDisabled}
            style={{ gap: 6, color: "#fff", cursor: primaryDisabled ? "wait" : "pointer", opacity: primaryDisabled ? 0.72 : 1, background: `linear-gradient(135deg,${accent},${accentB})`, border: "none", padding: "9px 24px", borderRadius: 20, fontSize: 13, fontWeight: 600, boxShadow: `0 4px 14px ${accent}55` }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              {primaryIcon}
              {primaryLabel}
            </span>
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "28px 1fr 130px 50px 28px 28px", gap: 8, padding: "4px 12px", fontSize: 11, color: "rgba(0,0,0,0.4)", borderBottom: "1px solid rgba(0,0,0,0.1)", marginBottom: 2, fontWeight: 500, letterSpacing: "0.05em", textTransform: "uppercase", alignItems: "center", flexShrink: 0 }}>
        <span>#</span><span>Title</span><span>Artist</span>
        <span style={{ display: "flex", justifyContent: "flex-end" }}>{IC.clock()}</span>
        <span /><span />
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "0 6px 6px", minHeight: 0 }}>
        {tracks.map((t, idx) => {
          const isActive = currentId === t.id;
          return (
            <div key={t.id} className="mp-track" onClick={() => onSelect(t)}
              style={{ display: "grid", gridTemplateColumns: "28px 1fr 130px 50px 28px 28px", gap: 8, padding: "9px 6px", alignItems: "center", background: isActive ? `${accent}28` : "transparent" }}>
              <span style={{ fontSize: 12, color: isActive ? accent : "rgba(0,0,0,0.38)", textAlign: "center", fontWeight: 700, fontFamily: "'DM Mono',monospace" }}>
                {isActive ? "▶" : idx + 1}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                {t.imageUrl ? (
                  <img src={t.imageUrl} alt="" style={{ width: 34, height: 34, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 34, height: 34, borderRadius: 8, background: t.color + "28", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: t.color, boxShadow: `0 0 6px ${t.color}` }} />
                  </div>
                )}
                <span style={{ fontSize: 15, fontWeight: isActive ? 600 : 500, color: isActive ? "#1a1a1a" : "rgba(0,0,0,0.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {t.name}
                </span>
              </div>
              <span style={{ fontSize: 13, color: "rgba(0,0,0,0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.artist}</span>
              <span style={{ fontSize: 12, color: "rgba(0,0,0,0.4)", textAlign: "right", fontFamily: "'DM Mono',monospace" }}>{t.dur}</span>
              <button type="button" className="mp-btn" onClick={e => { e.stopPropagation(); onToggleLike(t); }} style={{ color: t.liked ? accent : "rgba(0,0,0,0.25)", transition: "color .2s" }}>
                {IC.heart(t.liked)}
              </button>
              <button type="button" className="mp-btn" onClick={e => e.stopPropagation()} style={{ color: "rgba(0,0,0,0.25)" }}>
                {IC.more()}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AIChat({
  accent, accentB, pageScene, spotifyLinked, token, session, playerType, patchAiSession, onAppendTracks, onSwitchMain,
}: {
  accent: string; accentB: string; pageScene: string; spotifyLinked: boolean; token: string | null;
  session: AiSessionState; playerType: PlayerType;
  patchAiSession: (pt: PlayerType, patch: Partial<AiSessionState> | ((prev: AiSessionState) => AiSessionState)) => void;
  onAppendTracks: (tracks: UiTrack[]) => void; onSwitchMain: () => void;
}) {
  const { msgs, lastItems, input } = session;
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }); });
    return () => cancelAnimationFrame(id);
  }, [msgs, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const txt = input.trim();
    const loc = detectRecommendLocale(txt);
    const pt = playerType;
    if (!token) {
      const deny = "Please sign in to EchoAtlas first (keypad on the door).";
      patchAiSession(pt, prev => ({ ...prev, input: "", msgs: [...prev.msgs, { role: "user", text: txt }, { role: "ai", text: deny }] }));
      return;
    }
    patchAiSession(pt, prev => ({ ...prev, input: "", msgs: [...prev.msgs, { role: "user", text: txt }] }));
    setLoading(true);
    try {
      const res = await aiApi.recommend(token, { userMessage: txt, mode: "MIXED", maxItems: 12, pageScene, locale: loc });
      const lines: string[] = [];
      if (res.data.summary) lines.push(res.data.summary);
      if (res.data.tracks?.length) {
        lines.push("");
        res.data.tracks.forEach((tr, i) => {
          const notePart = tr.note ? (loc === "zh" ? `（${tr.note}）` : ` (${tr.note})`) : "";
          lines.push(`${i + 1}. ${tr.title ?? "—"} — ${tr.artist ?? ""}${notePart}`);
        });
      }
      const aiText = lines.join("\n") || "(No text summary.)";
      patchAiSession(pt, prev => ({ ...prev, lastItems: res.data.tracks ?? [], msgs: [...prev.msgs, { role: "ai", text: aiText }] }));
    } catch (e) {
      const fail = e instanceof Error ? e.message : "Request failed.";
      patchAiSession(pt, prev => ({ ...prev, lastItems: [], msgs: [...prev.msgs, { role: "ai", text: fail }] }));
    } finally { setLoading(false); }
  };

  const resolveToSpotify = async () => {
    if (!token || !spotifyLinked || !lastItems.length) return;
    const pt = playerType;
    const sceneLabel =
      pageScene === "STUDY"
        ? "Study"
        : pageScene === "PARTY"
          ? "Party"
          : pageScene === "HEADPHONES"
            ? "Listening Room"
            : "Sports";
    setLoading(true);
    try {
      const items = lastItems.map(x => ({ title: x.title ?? "", artist: x.artist ?? "" }));
      const res = await aiApi.resolveTracks(token, { items });
      const mapped: UiTrack[] = [];
      for (const it of res.data.items ?? []) {
        if (it.matched && it.spotify) mapped.push(spotifyToUi(it.spotify, false));
      }
      if (mapped.length) {
        onAppendTracks(mapped);
        const ok = `Added ${mapped.length} track(s) to the "${sceneLabel}" list — open the playlist on the left to listen.`;
        patchAiSession(pt, prev => ({ ...prev, msgs: [...prev.msgs, { role: "ai", text: ok }] }));
        onSwitchMain();
      } else {
        const bad = "No matching Spotify tracks. Try different wording or check regional availability.";
        patchAiSession(pt, prev => ({ ...prev, msgs: [...prev.msgs, { role: "ai", text: bad }] }));
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to resolve tracks.";
      patchAiSession(pt, prev => ({ ...prev, msgs: [...prev.msgs, { role: "ai", text: msg }] }));
    } finally { setLoading(false); }
  };

  return (
    <div className="mpin" style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minHeight: 0 }}>
      <div style={{ padding: "22px 24px 12px", borderBottom: "1px solid rgba(0,0,0,0.1)", flexShrink: 0 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 600, color: "#1a1a1a", letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ color: accent, display: "flex", opacity: 0.95 }}>{IC.musicSm()}</span>
          AI Music
        </h2>
        <p style={{ margin: "5px 0 0", fontSize: 13, color: "rgba(0,0,0,0.55)", lineHeight: 1.45 }}>
          Describe your mood or the type of music you want, and AI will recommend tracks for you.
        </p>
        {lastItems.length > 0 && spotifyLinked && token && (
          <button type="button" onClick={resolveToSpotify} disabled={loading}
            style={{ marginTop: 10, padding: "8px 14px", borderRadius: 10, border: "none", cursor: loading ? "wait" : "pointer", fontSize: 13, fontWeight: 600, color: "#fff", background: `linear-gradient(135deg,${accent},${accentB})`, boxShadow: `0 3px 12px ${accent}55` }}>
            Add this round of recommendations to Spotify (main list)
          </button>
        )}
        {lastItems.length > 0 && !spotifyLinked && (
          <p style={{ margin: "10px 0 0", fontSize: 12, color: "rgba(0,0,0,0.45)" }}>
            After connecting Spotify, you can turn recommendations into playable tracks.
          </p>
        )}
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px", display: "flex", flexDirection: "column", gap: 10, minHeight: 0 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            <div style={{ maxWidth: "75%", padding: "10px 14px", borderRadius: m.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: m.role === "user" ? `linear-gradient(135deg,${accent}88,${accentB}66)` : "rgba(255,255,255,0.45)", border: m.role === "user" ? `1px solid ${accent}44` : "1px solid rgba(0,0,0,0.08)", fontSize: 14, color: m.role === "user" ? "#fff" : "rgba(0,0,0,0.8)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: "flex" }}>
            <div style={{ padding: "10px 14px", borderRadius: "14px 14px 14px 4px", background: "rgba(255,255,255,0.45)", border: "1px solid rgba(0,0,0,0.08)" }}>
              <span className="mp-dot" /><span className="mp-dot" /><span className="mp-dot" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding: "11px 14px", borderTop: "1px solid rgba(0,0,0,0.1)", display: "flex", gap: 8, flexShrink: 0 }}>
        <input className="mp-chat-in" value={input}
          onChange={e => patchAiSession(playerType, prev => ({ ...prev, input: e.target.value }))}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="e.g. calm focus music for studying…"
          style={{ flex: 1, padding: "10px 14px", borderRadius: 11, background: "rgba(255,255,255,0.45)", border: "1px solid rgba(0,0,0,0.12)", color: "#1a1a1a", fontSize: 14 }} />
        <button type="button" className="mp-btn" onClick={send}
          style={{ width: 40, height: 40, borderRadius: 11, flexShrink: 0, background: `linear-gradient(135deg,${accent},${accentB})`, border: "none", color: "#fff", cursor: "pointer", boxShadow: `0 3px 12px ${accent}55` }}>
          {IC.send()}
        </button>
      </div>
    </div>
  );
}

function MusicPlayer({
  onClose,
  playerType = "study",
  userName,
  avatarUrl,
}: {
  onClose: () => void;
  playerType?: PlayerType;
  userName?: string;
  avatarUrl?: string | null;
}) {
  const cfg = CFG[playerType];
  const { accent, accentB } = cfg;

  const token = getToken();
  const [favTracks, setFavTracks] = useState<UiTrack[]>([]);
  const [mainTracks, setMainTracks] = useState<UiTrack[]>([]);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [spotifyLinked, setSpotifyLinked] = useState<boolean | null>(null);
  const [loadErr, setLoadErr] = useState<string | null>(null);
  const [loadingLib, setLoadingLib] = useState(false);
  const [loadingMain, setLoadingMain] = useState(false);
  const [current, setCurrent] = useState<UiTrack | null>(null);
  const [tab, setTab] = useState<TabKey>("main");
  const [aiByPlayer, setAiByPlayer] = useState<Record<PlayerType, AiSessionState>>(() => ({
    study: createInitialAiSession(),
    party: createInitialAiSession(),
    sports: createInitialAiSession(),
    headphones: createInitialAiSession(),
  }));
  const [repeat, setRepeat] = useState<RepeatMode>("none");
  const [shuffle, setShuffle] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [mainAppliedQuery, setMainAppliedQuery] = useState("");
  const [embedReload, setEmbedReload] = useState(0);
  const tabRef = useRef<TabKey>(tab);
  tabRef.current = tab;
  const [headphonesMode, setHeadphonesMode] = useState<HeadphonesListeningMode>(() => readHeadphonesMode());
  const [listeningStyleOpen, setListeningStyleOpen] = useState(false);
  const listeningStyleWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!listeningStyleOpen) return;
    const onDoc = (e: MouseEvent) => {
      const el = listeningStyleWrapRef.current;
      if (el && !el.contains(e.target as Node)) setListeningStyleOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [listeningStyleOpen]);

  const patchAiSession = useCallback(
    (pt: PlayerType, patch: Partial<AiSessionState> | ((prev: AiSessionState) => AiSessionState)) => {
      setAiByPlayer(prevAll => {
        const cur = prevAll[pt];
        const next = typeof patch === "function" ? patch(cur) : { ...cur, ...patch };
        return { ...prevAll, [pt]: next };
      });
    }, [],
  );

  const skipCuratedOnceRef = useRef(false);
  const cycleRepeat = () => setRepeat(r => (r === "none" ? "all" : r === "all" ? "one" : "none"));

  const reloadLibrary = useCallback(async () => {
    if (!token) return;
    setLoadingLib(true);
    try {
      const res = await libraryApi.list(token, { page: 0, size: 100 });
      const ids = new Set<string>();
      const tracks = (res.data.content ?? []).map(s => { ids.add(s.spotifyTrackId); return savedToUi(s, true); });
      setLikedIds(ids); setFavTracks(tracks);
    } catch (e) { setLoadErr(e instanceof Error ? e.message : "Failed to load library."); }
    finally { setLoadingLib(false); }
  }, [token]);

  const applyMainTracks = useCallback((tracks: UiTrack[], opts?: { forceFirst?: boolean }) => {
    setMainTracks(tracks); setSpotifyLinked(true);
    setCurrent(prev => {
      if (tabRef.current !== "main") return prev;
      if (opts?.forceFirst) return tracks[0] ?? null;
      if (prev != null) return prev;
      return pickDefaultCurrentFromMainList(tracks, null);
    });
  }, []);

  const refreshMainNonceRef = useRef(0);
  /** Blocks main-tab hydrate from re-applying stale cache while a refresh fetch is running. */
  const refreshMainInFlightRef = useRef(false);

  const refreshMainPlaylist = useCallback(async (pickedHeadphonesMode?: HeadphonesListeningMode) => {
    if (!token) return;
    refreshMainNonceRef.current += 1;
    const n = refreshMainNonceRef.current;
    const hMode = pickedHeadphonesMode ?? headphonesMode;
    const variants: readonly string[] =
      playerType === "headphones"
        ? HEADPHONES_MODE_VARIANTS[hMode]
        : REFRESH_SEARCH_VARIANTS[playerType];
    const query = variants[n % variants.length] ?? cfg.searchQuery;
    refreshMainInFlightRef.current = true;
    setLoadingMain(true);
    setLoadErr(null);
    setMainAppliedQuery("");
    setSearchInput("");
    try {
      const res = await spotifyApi.search(token, { query, limit: 10 });
      let tracks = (res.data.tracks ?? []).map(t => spotifyToUi(t, false));
      const curatedIds = rotateStrings([...CURATED_TRACK_IDS[playerType]], n).slice(0, 8);
      const batch = await spotifyApi.tracksByIds(token, { ids: curatedIds });
      const extra = (batch.data.tracks ?? []).map(t => spotifyToUi(t, false));
      tracks = mergeTracksUnique(tracks, extra).slice(0, 12);
      tracks = tracks.map(t => ({ ...t, liked: likedIds.has(t.id) }));
      setCuratedCache(playerType, tracks, {
        refreshPinned: true,
        ...(playerType === "headphones" ? { headphonesListeningMode: hMode } : {}),
      });
      applyMainTracks(tracks, { forceFirst: true });
      if (tracks.length) setEmbedReload(r => r + 1);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not refresh playlist.";
      setLoadErr(msg);
      if (msg.toLowerCase().includes("not linked") || msg.toLowerCase().includes("link")) setSpotifyLinked(false);
      else setSpotifyLinked(null);
    } finally {
      refreshMainInFlightRef.current = false;
      setLoadingMain(false);
    }
  }, [token, playerType, cfg.searchQuery, likedIds, applyMainTracks, headphonesMode]);

  const loadCuratedMain = useCallback(async (opts?: { silent?: boolean }) => {
    if (!token) return;
    if (!opts?.silent) {
      setLoadingMain(true);
      setLoadErr(null);
    }
    const fallbackSearch = async () => {
      const qBase =
        playerType === "headphones"
          ? HEADPHONES_MODE_VARIANTS[headphonesMode][0]!
          : cfg.searchQuery;
      const fb = await spotifyApi.search(token, { query: qBase, limit: 10 });
      return (fb.data.tracks ?? []).map(t => spotifyToUi(t, false));
    };
    try {
      const ids = [...CURATED_TRACK_IDS[playerType]];
      const res = await spotifyApi.tracksByIds(token, { ids });
      let tracks = (res.data.tracks ?? []).map(t => spotifyToUi(t, false));
      if (tracks.length === 0) { tracks = await fallbackSearch(); }
      else if (tracks.length < 3) { const extra = await fallbackSearch(); tracks = mergeTracksUnique(tracks, extra).slice(0, 12); }
      setCuratedCache(playerType, tracks, {
        refreshPinned: false,
        ...(playerType === "headphones" ? { headphonesListeningMode: headphonesMode } : {}),
      });
      applyMainTracks(tracks);
    } catch {
      try {
        const tracks = await fallbackSearch();
        applyMainTracks(tracks);
        setCuratedCache(playerType, tracks, {
          refreshPinned: false,
          ...(playerType === "headphones" ? { headphonesListeningMode: headphonesMode } : {}),
        });
      }
      catch (e2) {
        const msg = e2 instanceof Error ? e2.message : "Failed to load recommended tracks.";
        setLoadErr(msg);
        if (msg.toLowerCase().includes("not linked") || msg.toLowerCase().includes("link")) setSpotifyLinked(false);
        else setSpotifyLinked(null);
      }
    } finally {
      if (!opts?.silent) {
        setLoadingMain(false);
      }
    }
  }, [token, playerType, cfg.searchQuery, applyMainTracks, headphonesMode]);

  const prefetchCuratedForType = useCallback(
    async (pt: PlayerType) => {
      if (!token) return;
      if ((getCuratedCache(pt)?.tracks.length ?? 0) > 0) return;
      const fallbackSearch = async () => {
        const qFb =
          pt === "headphones"
            ? HEADPHONES_MODE_VARIANTS[readHeadphonesMode()][0]!
            : CFG[pt].searchQuery;
        const fb = await spotifyApi.search(token, { query: qFb, limit: 10 });
        return (fb.data.tracks ?? []).map((t) => spotifyToUi(t, false));
      };
      try {
        const ids = [...CURATED_TRACK_IDS[pt]];
        const res = await spotifyApi.tracksByIds(token, { ids });
        let tracks = (res.data.tracks ?? []).map((t) => spotifyToUi(t, false));
        if (tracks.length === 0) tracks = await fallbackSearch();
        else if (tracks.length < 3) {
          const extra = await fallbackSearch();
          tracks = mergeTracksUnique(tracks, extra).slice(0, 12);
        }
        setCuratedCache(pt, tracks, {
          refreshPinned: false,
          ...(pt === "headphones" ? { headphonesListeningMode: readHeadphonesMode() } : {}),
        });
      } catch {
        try {
          const tracks = await fallbackSearch();
          setCuratedCache(pt, tracks, {
            refreshPinned: false,
            ...(pt === "headphones" ? { headphonesListeningMode: readHeadphonesMode() } : {}),
          });
        } catch {
          // Best-effort prefetch; ignore background failures.
        }
      }
    },
    [token],
  );

  useEffect(() => { if (!token) return; void reloadLibrary(); }, [token, reloadLibrary]);
  useEffect(() => {
    if (!token) return;
    void prefetchCuratedForType("study");
    void prefetchCuratedForType("party");
    void prefetchCuratedForType("sports");
    void prefetchCuratedForType("headphones");
  }, [token, prefetchCuratedForType]);
  useEffect(() => { setSearchInput(""); setMainAppliedQuery(""); setCurrent(null); }, [playerType]);

  useEffect(() => {
    if (!token || tab !== "main") return;
    const q = mainAppliedQuery.trim();
    const handle = window.setTimeout(async () => {
      if (!q) {
        if (skipCuratedOnceRef.current) { skipCuratedOnceRef.current = false; return; }
        if (refreshMainInFlightRef.current) return;
        const cached = getCuratedCache(playerType);
        const cachedTracks = cached?.tracks ?? [];
        if (cachedTracks.length > 0) {
          if (playerType === "headphones" && cached?.headphonesListeningMode !== headphonesMode) {
            await loadCuratedMain();
            return;
          }
          applyMainTracks(cachedTracks);
          setLoadingMain(false);
          setSpotifyLinked(true);
          return;
        }
        await loadCuratedMain();
        return;
      }
      setLoadingMain(true); setLoadErr(null);
      try {
        const res = await spotifyApi.search(token, { query: q, limit: 10 });
        const tracks = (res.data.tracks ?? []).map(t => spotifyToUi(t, false));
        applyMainTracks(tracks);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Search failed.";
        setLoadErr(msg);
        if (msg.toLowerCase().includes("not linked") || msg.toLowerCase().includes("link")) setSpotifyLinked(false);
        else setSpotifyLinked(null);
      } finally { setLoadingMain(false); }
    }, 0);
    return () => window.clearTimeout(handle);
  }, [token, tab, playerType, mainAppliedQuery, loadCuratedMain, applyMainTracks, headphonesMode]);

  useEffect(() => {
    setMainTracks(prev => prev.map(t => ({ ...t, liked: likedIds.has(t.id) })));
    setFavTracks(prev => prev.map(t => ({ ...t, liked: likedIds.has(t.id) })));
    setCurrent(prev => (prev ? { ...prev, liked: likedIds.has(prev.id) } : null));
  }, [likedIds]);

  const connectSpotify = async () => {
    if (!token) return;
    if (window.location.hostname === "localhost") {
      setLoadErr("Spotify cannot use localhost as a redirect URI. Open this site at http://127.0.0.1:5173, sign in, then use Connect Spotify.");
      return;
    }
    const { verifier, challenge } = await generatePkcePair();
    sessionStorage.setItem("spotify_pkce_verifier", verifier);
    const res = await spotifyApi.authorizeUrl(token, { redirectUri: spotifyRedirectUri(), codeChallenge: challenge, codeChallengeMethod: "S256" });
    window.location.href = res.data.authorizeUrl;
  };

  const toggleLike = async (t: UiTrack) => {
    if (!token) { setLoadErr("Please sign in first."); return; }
    try {
      if (!t.liked) await libraryApi.save(token, { spotifyTrackId: t.id, source: "SEARCH" });
      else await libraryApi.remove(token, { spotifyTrackId: t.id });
      await reloadLibrary();
    } catch (e) { setLoadErr(e instanceof Error ? e.message : "Library action failed."); }
  };

  const filteredFavorites = useMemo(() => {
    const q = searchInput.trim().toLowerCase();
    if (!q) return favTracks;
    return favTracks.filter(t => t.name.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q));
  }, [searchInput, favTracks]);

  /** Prev/next only walk the playlist for the active sidebar tab (favorites ≠ scene list). */
  const skipListBase = useMemo(() => {
    if (tab === "favorites") return filteredFavorites;
    if (tab === "main") return mainTracks;
    if (tab === "ai") return mainTracks.length > 0 ? mainTracks : filteredFavorites;
    return [];
  }, [tab, filteredFavorites, mainTracks]);

  const commitMainSearch = useCallback(() => { setMainAppliedQuery(searchInput.trim()); }, [searchInput]);
  const switchTab = useCallback((k: TabKey) => { setSearchInput(""); setMainAppliedQuery(""); setTab(k); }, []);

  const skipPrev = useCallback(() => {
    if (!current) return;
    const list = shuffle ? [...skipListBase].sort(() => Math.random() - 0.5) : skipListBase;
    if (!list.length) return;
    const i = list.findIndex(t => t.id === current.id);
    if (i < 0) {
      setCurrent(list[list.length - 1]!);
      setEmbedReload(r => r + 1);
      return;
    }
    if (i > 0) setCurrent(list[i - 1]!);
    else if (repeat === "all" && list.length) setCurrent(list[list.length - 1]!);
  }, [current, skipListBase, shuffle, repeat]);

  const skipNext = useCallback(() => {
    if (!current) return;
    const list = shuffle ? [...skipListBase].sort(() => Math.random() - 0.5) : skipListBase;
    if (!list.length) return;
    if (repeat === "one") {
      setEmbedReload(r => r + 1);
      return;
    }
    const i = list.findIndex(t => t.id === current.id);
    if (i < 0) {
      setCurrent(list[0]!);
      setEmbedReload(r => r + 1);
      return;
    }
    if (i < list.length - 1) setCurrent(list[i + 1]!);
    else if (repeat === "all" && list.length) setCurrent(list[0]!);
  }, [current, skipListBase, shuffle, repeat]);

  const dc = "rgba(0,0,0,0.5)";
  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: "favorites", label: "My Favorites", icon: IC.heart() },
    { key: "main", label: cfg.mainLabel, icon: IC.book() },
    { key: "ai", label: "AI Music", icon: <span style={{ display: "flex" }}>{IC.musicSm()}</span> },
  ];

  const appendMain = (tracks: UiTrack[]) => {
    skipCuratedOnceRef.current = true;
    setSearchInput(""); setMainAppliedQuery("");
    setMainTracks(prev => {
      const existing = new Set(prev.map(p => p.id));
      const merged = [...prev];
      for (const t of tracks) {
        if (!existing.has(t.id)) { existing.add(t.id); merged.push({ ...t, liked: likedIds.has(t.id) }); }
      }
      return merged;
    });
    setTab("main");
  };

  const playAllFav = () => {
    if (!filteredFavorites.length) return;
    setCurrent(filteredFavorites[0]!);
    setEmbedReload(r => r + 1);
  };
  const pickHeadphonesListeningMode = useCallback(
    (mode: HeadphonesListeningMode) => {
      setListeningStyleOpen(false);
      if (mode === headphonesMode) return;
      setHeadphonesMode(mode);
      persistHeadphonesMode(mode);
      void refreshMainPlaylist(mode);
    },
    [headphonesMode, refreshMainPlaylist],
  );
  const selectTrack = (t: UiTrack) => { setCurrent(t); };

  const safeCurrent: UiTrack = current ?? ({ id: "_", name: "—", artist: "—", dur: "0:00", color: accent, liked: false } as UiTrack);

  return (
    <div className="mp mp-overlay">
      <style>{CSS}</style>
      <div className="mp-panel">
        {/* Top bar — no bottom border */}
        <div style={{ flexShrink: 0, display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 8, padding: "10px 13px" }}>
          {(tab === "main" || tab === "favorites") && (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ position: "relative", display: "flex", alignItems: "center", background: "rgba(255,255,255,0.45)", border: "1px solid rgba(0,0,0,0.15)", borderRadius: 20, overflow: "hidden" }}>
                <input className="mp-search-in" value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  onKeyDown={e => { if (tab === "main" && e.key === "Enter") { e.preventDefault(); commitMainSearch(); } }}
                  placeholder={tab === "main" ? "Search music…" : "Filter my favorites…"}
                  style={{ paddingLeft: 10, paddingRight: 9, paddingTop: 6, paddingBottom: 6, background: "transparent", border: "none", color: "#1a1a1a", fontSize: 13, width: 200 }} />
                <button type="button" className="mp-btn" title="Search"
                  onClick={() => { if (tab === "main") commitMainSearch(); }}
                  style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg,${accent}66,${accentB}44)`, border: "none", borderLeft: `1px solid ${accent}55`, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, cursor: "pointer" }}>
                  {IC.search()}
                </button>
              </div>
              {token && tab === "main" && playerType === "headphones" && (
                <div ref={listeningStyleWrapRef} style={{ position: "relative" }}>
                  <button
                    type="button"
                    className="mp-btn"
                    aria-haspopup="listbox"
                    aria-expanded={listeningStyleOpen}
                    title="Listening style"
                    disabled={loadingMain}
                    onClick={() => setListeningStyleOpen(o => !o)}
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: "50%",
                      background: listeningStyleOpen
                        ? `linear-gradient(135deg,${accent}88,${accentB}77)`
                        : `linear-gradient(135deg,${accent}66,${accentB}44)`,
                      border: `1px solid ${accent}55`,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                      cursor: loadingMain ? "wait" : "pointer",
                      opacity: loadingMain ? 0.72 : 1,
                      boxShadow: listeningStyleOpen ? `0 0 14px ${accent}55` : "none",
                    }}
                  >
                    {IC.sliders()}
                  </button>
                  {listeningStyleOpen && (
                    <div
                      role="listbox"
                      aria-label="Listening style"
                      style={{
                        position: "absolute",
                        right: 0,
                        top: "calc(100% + 8px)",
                        zIndex: 30,
                        minWidth: 220,
                        padding: "8px 0",
                        borderRadius: 12,
                        background: "rgba(255,255,255,0.95)",
                        border: `1px solid rgba(125,85,68,0.35)`,
                        boxShadow: "0 8px 28px rgba(45,28,22,0.16)",
                      }}
                    >
                      <div style={{ padding: "4px 12px 8px", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: "rgba(0,0,0,0.45)" }}>
                        Listening style
                      </div>
                      {HEADPHONES_MODE_OPTIONS.map(({ mode, label }) => {
                        const active = mode === headphonesMode;
                        return (
                          <button
                            key={mode}
                            type="button"
                            role="option"
                            aria-selected={active}
                            onClick={() => pickHeadphonesListeningMode(mode)}
                            style={{
                              display: "block",
                              width: "100%",
                              textAlign: "left",
                              padding: "10px 14px",
                              fontSize: 13,
                              fontWeight: active ? 600 : 400,
                              color: "#1a1a1a",
                              border: "none",
                              cursor: "pointer",
                              background: active ? `${accent}22` : "transparent",
                            }}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          <button type="button" className="mp-btn" onClick={onClose} aria-label="Close"
            style={{ width: 28, height: 28, borderRadius: "50%", background: "rgba(0,0,0,0.1)", border: "1px solid rgba(0,0,0,0.2)", color: "rgba(0,0,0,0.6)", fontSize: 14, cursor: "pointer" }}>
            ✕
          </button>
        </div>

        {!token && (
          <div style={{ padding: "10px 16px", background: "rgba(180,60,60,0.15)", fontSize: 12, color: "rgba(0,0,0,0.7)", borderBottom: "1px solid rgba(0,0,0,0.08)" }}>
            Not signed in: use the keypad to log in before favorites and AI.
          </div>
        )}
        {token && spotifyLinked === false && (
          <div style={{ padding: "10px 16px", background: "rgba(30,120,200,0.15)", fontSize: 12, color: "rgba(0,0,0,0.7)", borderBottom: "1px solid rgba(0,0,0,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span>After connecting Spotify you can search and add AI recommendations.</span>
            <button type="button" onClick={() => void connectSpotify()}
              style={{ flexShrink: 0, padding: "6px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600, background: `linear-gradient(135deg,${accent},${accentB})`, color: "#fff" }}>
              Connect Spotify
            </button>
          </div>
        )}
        {loadErr && (
          <div style={{ padding: "8px 16px", fontSize: 11, color: "rgba(160,40,40,0.9)", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>{loadErr}</div>
        )}
        {loadErr && spotifyLinked === null && (
          <div style={{ padding: "0 16px 8px", fontSize: 10, lineHeight: 1.45, color: "rgba(0,0,0,0.42)", borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
            Note: after Spotify authorization, the blue Connect Spotify bar hides. Red text here means a search or list request failed.
          </div>
        )}

        <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
          <div className="mp-sidebar">
            <div style={{ textAlign: "center", paddingBottom: 18, borderBottom: "1px solid rgba(0,0,0,0.1)", marginBottom: 12 }}>
              <div style={{ margin: "0 auto 10px", width: 62 }}>
                <UserAvatar avatarUrl={avatarUrl} name={userName} size={62} />
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: "#1a1a1a" }}>{userName?.trim() || "six cookies"}</div>
              <div style={{ fontSize: 11, color: "rgba(0,0,0,0.45)", marginTop: 2, letterSpacing: "0.06em" }}>Focus · Enjoy · Flow</div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 5 }}>
              {tabs.map(({ key, label, icon }) => {
                const isActive = tab === key;
                return (
                  <div key={key} className={`mp-nav${isActive ? " active" : ""}`} onClick={() => switchTab(key)}
                    style={isActive ? { background: `linear-gradient(135deg,${accent}30,${accentB}1a)`, borderColor: `${accent}60`, boxShadow: `0 0 16px ${accent}33, 0 0 28px ${accent}18, inset 0 1px 0 rgba(255,255,255,0.12)` } : {}}>
                    <span style={{ color: isActive ? accent : dc, flexShrink: 0 }}>{icon}</span>
                    <span style={{ fontSize: 14, color: isActive ? "#1a1a1a" : "rgba(0,0,0,0.5)", fontWeight: isActive ? 600 : 400 }}>{label}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: "flex", justifyContent: "center", color: "rgba(0,0,0,0.15)", paddingTop: 4 }}>{IC.music()}</div>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
            {tab === "favorites" && (
              <TrackList key="fav" tracks={filteredFavorites} title="My Favorites"
                desc="Your saved tracks, ready to play anytime."
                duration={loadingLib ? "Loading…" : searchInput.trim() ? `Showing ${filteredFavorites.length} of ${favTracks.length} tracks` : `${favTracks.length} saved`}
                accent={accent} accentB={accentB} grad={`linear-gradient(135deg,${accent}88,${accentB}66)`}
                cover={imgFavorites} currentId={safeCurrent.id} onSelect={selectTrack}
                onToggleLike={t => void toggleLike(t)}
                primaryLabel="Play all" primaryIcon={IC.play()} onPrimaryAction={playAllFav}
                primaryDisabled={!filteredFavorites.length || !token} />
            )}
            {tab === "main" && (
              <TrackList key="main" tracks={mainTracks} title={cfg.title}
                desc={
                  loadingMain
                    ? cfg.loadingDesc
                    : mainAppliedQuery.trim()
                      ? `Search results for "${mainAppliedQuery.trim()}"`
                      : playerType === "headphones"
                        ? `Mode — ${
                          HEADPHONES_MODE_OPTIONS.find(o => o.mode === headphonesMode)?.label ?? headphonesMode
                        }. ${cfg.desc}`
                        : cfg.desc
                }
                duration={loadingMain ? "…" : cfg.dur}
                accent={accent} accentB={accentB} grad={cfg.grad}
                cover={cfg.cover}
                coverObjectFit="cover"
                coverPad={0}
                currentId={safeCurrent.id} onSelect={selectTrack}
                onToggleLike={t => void toggleLike(t)}
                primaryLabel="Refresh picks" primaryIcon={IC.refresh()} onPrimaryAction={() => void refreshMainPlaylist()}
                primaryDisabled={loadingMain || !token} />
            )}
            {tab === "ai" && (
              <AIChat accent={accent} accentB={accentB} pageScene={cfg.pageScene} spotifyLinked={spotifyLinked === true}
                token={token} session={aiByPlayer[playerType]} playerType={playerType} patchAiSession={patchAiSession}
                onAppendTracks={appendMain} onSwitchMain={() => switchTab("main")} />
            )}
          </div>
        </div>

        {/* Bottom player bar */}
        <div style={{ padding: "0 10px 8px", flexShrink: 0 }}>
          {safeCurrent.id !== "_" && (
            <div id="mp-spotify-embed" style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px", borderRadius: 14, background: "rgba(255,255,255,0.35)", border: `1px solid ${accent}44`, boxShadow: `0 0 12px ${accent}22, inset 0 1px 0 rgba(255,255,255,0.3)`, backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)", minHeight: 0 }}>
              {/* Controls: 2 rows — row1: heart, shuffle, repeat | row2: prev, next */}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: 8, width: 90, flexShrink: 0, paddingRight: 8, marginRight: 4, borderRight: "1px solid rgba(0,0,0,0.1)" }}>
                {/* Row 1 */}
                <button type="button" className="mp-btn" aria-pressed={safeCurrent.liked} onClick={() => void toggleLike(safeCurrent)}
                  title={safeCurrent.liked ? "Saved — click to remove" : "Save to library"}
                  style={{ flexShrink: 0, padding: 6, margin: -6, borderRadius: "50%", color: safeCurrent.liked ? accent : "rgba(0,0,0,0.35)", background: safeCurrent.liked ? `${accent}26` : "transparent", boxShadow: safeCurrent.liked ? `0 0 12px ${accent}77, inset 0 0 0 1px ${accent}55` : "none", transition: "background 0.15s ease, box-shadow 0.15s ease, color 0.15s ease" }}>
                  {IC.heart(safeCurrent.liked)}
                </button>
                <button type="button" className="mp-btn" onClick={() => setShuffle(!shuffle)} style={{ color: shuffle ? accent : dc, position: "relative", flexShrink: 0 }} title="Shuffle">
                  {IC.shuffle()}
                  {shuffle && <span style={{ position: "absolute", bottom: -2, left: "50%", transform: "translateX(-50%)", width: 3, height: 3, borderRadius: "50%", background: accent }} />}
                </button>
                <button type="button" className="mp-btn" onClick={cycleRepeat} style={{ color: repeat !== "none" ? accent : dc, position: "relative", flexShrink: 0 }} title="Repeat">
                  {repeat === "one" ? IC.repeatOne() : IC.repeat()}
                  {repeat !== "none" && <span style={{ position: "absolute", bottom: -2, left: "50%", transform: "translateX(-50%)", width: 3, height: 3, borderRadius: "50%", background: accent }} />}
                </button>
                {/* Row 2 */}
                <button type="button" className="mp-btn" onClick={skipPrev} style={{ color: "rgba(0,0,0,0.55)", flexShrink: 0 }} title="Previous">{IC.prev()}</button>
                <button type="button" className="mp-btn" onClick={skipNext} style={{ color: "rgba(0,0,0,0.55)", flexShrink: 0 }} title="Next">{IC.next()}</button>
              </div>
              {/* Spotify embed */}
              <div style={{ flex: 1, minWidth: 120, borderRadius: 10, overflow: "hidden", lineHeight: 0 }}>
                <iframe
                  key={`${safeCurrent.id}-${embedReload}`}
                  title="Spotify"
                  src={`https://open.spotify.com/embed/track/${safeCurrent.id}?utm_source=echo`}
                  width="100%" height={88}
                  style={{ border: 0, display: "block", width: "100%", height: 88, maxWidth: "100%" }}
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy" referrerPolicy="origin-when-cross-origin"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MusicPlayer;