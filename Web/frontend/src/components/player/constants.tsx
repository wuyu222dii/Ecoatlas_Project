import imgFavorites from "@/assets/favorites.png";
import imgStudy from "@/assets/study.png";
import imgParty from "@/assets/party.png";
import imgSports from "@/assets/sports.png";
import imgHeadphones from "@/assets/headphonezone.png";
import type { HeadphonesListeningMode, PlayerType } from "./types";

export { imgFavorites, imgStudy, imgParty, imgSports, imgHeadphones };

export const IC = {
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

export const HEADPHONES_MODE_STORAGE_KEY = "headphones_listening_mode_v1";

export const HEADPHONES_MODE_VARIANTS: Record<HeadphonesListeningMode, readonly string[]> = {
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

export const HEADPHONES_MODE_OPTIONS: readonly { mode: HeadphonesListeningMode; label: string }[] = [
  { mode: "late_night_radio", label: "Late Night Radio" },
  { mode: "warm_cafe_jazz", label: "Warm Café Jazz" },
  { mode: "cinematic_ambient", label: "Cinematic Ambient" },
];

export const CFG: Record<
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
export const REFRESH_SEARCH_VARIANTS: Record<Exclude<PlayerType, "headphones">, readonly string[]> = {
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

export const CSS = `
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
