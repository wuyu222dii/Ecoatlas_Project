import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Globe, { type GlobeMethods } from "react-globe.gl";
import * as THREE from "three";
import {
  getToken,
  libraryApi,
  resonanceApi,
  type ResonanceListItemDto,
  type ResonanceResponseDto,
  type SavedTrackResponse,
} from "../lib/api";
import { UserAvatar } from "./UserAvatar";

/* ── Hooks ── */
function useIsMobile(breakpoint = 768) {
  const [mobile, setMobile] = useState(window.innerWidth < breakpoint);
  useEffect(() => {
    const h = () => setMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", h);
    return () => window.removeEventListener("resize", h);
  }, [breakpoint]);
  return mobile;
}

/* ── Data ── */

type PolaroidMeta = {
  caption: string;
  rotate: number;
};

type MemoryData = {
  title: string;
  location: string;
  time: string;
  mood: string;
  track: string;
  artist: string;
  lat: number;
  lng: number;
  color: string;
  image?: string;
  polaroid?: PolaroidMeta;
  story?: string;
  /** Set when loaded or saved from the API */
  resonanceId?: number;
  spotifyTrackId?: string | null;
  trackImageUrl?: string | null;
};

type GlobeCoords = {
  lat: number;
  lng: number;
  altitude?: number;
};

type MemoryFormDraft = {
  key: string;
  title: string;
  location: string;
  mood: string;
  lat: string;
  lng: string;
  track: string;
  artist: string;
  story: string;
  resonanceId?: number;
  /** Cover preview when editing an existing entry (no re-upload required) */
  existingImageUrl?: string;
  spotifyTrackId?: string;
  trackImageUrl?: string;
};

const MOOD_OPTIONS = [
  {
    label: "Happy",
    value: "😊",
  },
  {
    label: "Sad",
    value: "☹️",
  },
  {
    label: "Excited",
    value: "😄",
  },
  {
    label: "Calm",
    value: "😌",
  },
  {
    label: "Touched",
    value: "🥹",
  },
  {
    label: "Angry",
    value: "😠",
  },
  {
    label: "Tired",
    value: "😴",
  },
];
const DEFAULT_MOOD = MOOD_OPTIONS[0].value;
const LEGACY_MOOD_MAP: Record<string, string> = {
  "🌙": "😌",
  "🌅": "😊",
  "🌧️": "☹️",
  "🕹️": "😄",
  "🌊": "😌",
  "🔥": "😠",
  "✨": "🥹",
};
const normalizeMood = (mood?: string | null) => {
  const value = mood?.trim();
  if (!value) return DEFAULT_MOOD;
  if (MOOD_OPTIONS.some((option) => option.value === value)) return value;
  return LEGACY_MOOD_MAP[value] ?? DEFAULT_MOOD;
};

const ACCENT = "#e8845a";
const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;
/** Invalid colors from react-globe / three become null and crash opacity animation */
function safeMarkerHex(c: string | undefined): string {
  return typeof c === "string" && HEX_COLOR_RE.test(c.trim()) ? c.trim() : ACCENT;
}
const MEMORY_FORM_ID = "map-resonance-form";
const COUNTRIES_GEOJSON_URL =
  "https://cdn.jsdelivr.net/npm/three-globe/example/country-polygons/ne_110m_admin_0_countries.geojson";
const DESKTOP_GLOBE_OFFSET_X = 72;
const DESKTOP_HALO_OFFSET_X = 54;
const HALO_CENTER_Y = "49%";
const DESKTOP_GLOBE_ALTITUDE = 1.95;
const MOBILE_GLOBE_ALTITUDE = 3.25;

const withAlpha = (color: string, alpha: string) => `${safeMarkerHex(color)}${alpha}`;
const formatCoord = (value: number) => value.toFixed(4);
const LIGHT_REGION_COLORS = [
  "#e8845a",
  "#6fa18f",
  "#8a7fd0",
  "#d9a441",
  "#6796be",
];
const DARK_REGION_COLORS = [
  "#ff5ce0",
  "#3ce8ff",
  "#9f6dff",
  "#ffd670",
  "#3a8eff",
];
const MAP_VISUALS = {
  light: {
    globeColor: "#dcece7",
    globeEmissive: "#8fd6e2",
    globeEmissiveIntensity: 0.08,
    globeOpacity: 0.82,
    globeShininess: 10,
    atmosphereColor: "#b9dff2",
    atmosphereAltitude: 0.18,
    polygonSideColor: "rgba(255,255,255,0.08)",
    polygonStrokeColor: "rgba(47,39,35,0.42)",
    arcColor: ["rgba(232,132,90,0.18)", "rgba(232,132,90,0.82)"],
    arcStroke: 0.45,
    arcDashLength: 0.6,
    arcDashGap: 0.18,
    pointRadius: 0.3,
    pointActiveRadius: 0.42,
    pointAltitude: 0.04,
    pointActiveAltitude: 0.07,
    ringMaxRadius: 3,
    ringPropagationSpeed: 0.8,
    ringRepeatPeriod: 1400,
    surfaceBackground: "rgba(255,255,255,0.16)",
    surfaceOverlay:
      "radial-gradient(circle at center, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.58) 100%)",
    surfaceShadow: "inset 0 1px 1px rgba(255,255,255,0.35)",
  },
  dark: {
    globeColor: "#121a55",
    globeEmissive: "#2144d8",
    globeEmissiveIntensity: 0.46,
    globeOpacity: 0.97,
    globeShininess: 48,
    atmosphereColor: "#8cf8ff",
    atmosphereAltitude: 0.28,
    polygonSideColor: "rgba(76,203,255,0.22)",
    polygonStrokeColor: "rgba(151,116,255,0.72)",
    arcColor: [
      "rgba(40,240,255,0.2)",
      "rgba(255,75,236,0.95)",
      "rgba(255,255,255,0.88)",
    ],
    arcStroke: 0.82,
    arcDashLength: 0.42,
    arcDashGap: 0.12,
    pointRadius: 0.42,
    pointActiveRadius: 0.62,
    pointAltitude: 0.06,
    pointActiveAltitude: 0.1,
    ringMaxRadius: 4.8,
    ringPropagationSpeed: 1.25,
    ringRepeatPeriod: 980,
    surfaceBackground: "rgba(7,10,30,0.84)",
    surfaceOverlay:
      "radial-gradient(circle at 54% 47%, rgba(58,232,255,0.18) 0%, rgba(77,55,182,0.22) 36%, rgba(7,10,30,0.92) 100%)",
    surfaceShadow:
      "inset 0 1px 1px rgba(255,255,255,0.14), inset 0 0 72px rgba(67,105,255,0.18)",
  },
};
const UI_VISUALS = {
  light: {
    shellBackground: "rgba(255,255,255,0.12)",
    shellBorder: "rgba(255,255,255,0.25)",
    shellShadow:
      "0 8px 32px rgba(31,38,135,0.15), inset 0 1px 1px rgba(255,255,255,0.5), inset 0 -1px 1px rgba(255,255,255,0.1)",
    sidebarBackground: (_color: string) => "rgba(255,255,255,0.34)",
    sidebarShadow: "0 18px 48px rgba(80,50,32,0.14)",
    activeMemoryBackground: (color: string) =>
      `linear-gradient(135deg, ${withAlpha(color, "2e")}, rgba(255,255,255,0.56))`,
    controlSurface: "rgba(255,255,255,0.34)",
    subtleSurface: "rgba(255,255,255,0.28)",
    cardBorder: "rgba(255,255,255,0.4)",
    border: "rgba(255,255,255,0.35)",
    panelBorder: "rgba(255,255,255,0.25)",
    cardShadow: "0 12px 32px rgba(80,50,32,0.14)",
    textPrimary: "#2f2723",
    textSecondary: "rgba(79,67,61,0.8)",
    textMuted: "rgba(79,67,61,0.65)",
    textFaint: "rgba(79,67,61,0.3)",
    controlIcon: "rgba(79,67,61,0.7)",
    drawerBackdrop: "rgba(47,39,35,0.18)",
    drawerSurface: "rgba(255,255,255,0.72)",
    drawerShadow: "-24px 0 64px rgba(80,50,32,0.24)",
    fieldSurface: "rgba(255,255,255,0.28)",
    uploadSurface: "rgba(255,255,255,0.22)",
    uploadHoverClass: "hover:bg-white/[0.32]",
  },
  dark: {
    shellBackground: "rgba(14,18,29,0.78)",
    shellBorder: "rgba(255,255,255,0.14)",
    shellShadow:
      "0 18px 60px rgba(0,0,0,0.45), inset 0 1px 1px rgba(255,255,255,0.12), inset 0 -1px 1px rgba(0,0,0,0.25)",
    sidebarBackground: (color: string) =>
      `linear-gradient(160deg, rgba(18,24,38,0.78), rgba(10,14,24,0.56)), linear-gradient(180deg, ${withAlpha(color, "24")}, rgba(9,14,25,0.38))`,
    sidebarShadow: "0 18px 48px rgba(0,0,0,0.32)",
    activeMemoryBackground: (color: string) =>
      `linear-gradient(135deg, ${withAlpha(color, "38")}, rgba(255,255,255,0.08))`,
    controlSurface: "rgba(17,22,35,0.66)",
    subtleSurface: "rgba(255,255,255,0.08)",
    cardBorder: "rgba(255,255,255,0.16)",
    border: "rgba(255,255,255,0.14)",
    panelBorder: "rgba(255,255,255,0.14)",
    cardShadow: "0 12px 34px rgba(0,0,0,0.36)",
    textPrimary: "#f4eee8",
    textSecondary: "rgba(229,220,211,0.78)",
    textMuted: "rgba(213,202,193,0.62)",
    textFaint: "rgba(213,202,193,0.32)",
    controlIcon: "rgba(239,232,225,0.76)",
    drawerBackdrop: "rgba(5,8,14,0.42)",
    drawerSurface: "rgba(15,20,33,0.88)",
    drawerShadow: "-24px 0 64px rgba(0,0,0,0.46)",
    fieldSurface: "rgba(255,255,255,0.08)",
    uploadSurface: "rgba(255,255,255,0.07)",
    uploadHoverClass: "hover:bg-white/[0.12]",
  },
};

type UiVisuals = (typeof UI_VISUALS)["light"];

const NEON_GLOBE_HALOS = [
  {
    desktopSize: "min(650px, 76%)",
    mobileSize: "82vmin",
    background:
      "radial-gradient(circle, transparent 56%, rgba(117,244,255,0.46) 66%, rgba(139,102,255,0.24) 76%, transparent 88%)",
    filter: "blur(12px)",
  },
  {
    desktopSize: "min(720px, 84%)",
    mobileSize: "92vmin",
    background:
      "radial-gradient(circle, transparent 50%, rgba(83,131,255,0.24) 64%, rgba(255,80,232,0.18) 78%, transparent 92%)",
    filter: "blur(28px)",
  },
  {
    desktopSize: "min(820px, 96%)",
    mobileSize: "106vmin",
    background:
      "radial-gradient(circle, transparent 44%, rgba(61,232,255,0.16) 62%, rgba(126,86,255,0.18) 78%, transparent 100%)",
    filter: "blur(48px)",
  },
];

type MemoryPoint = MemoryData & { index: number };
/** Globe-only marker for a resolved Places search (draft; not in sidebar list) */
const SEARCH_PLACE_PREVIEW_INDEX = -1;

type MemoryArc = {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string;
  index: number;
};

interface CountryFeature {
  geometry: {
    type: string;
    coordinates: number[];
  };
  properties?: {
    ADMIN?: string;
    ISO_A2?: string;
    REGION_UN?: string;
    SUBREGION?: string;
  };
}

const getRegionColor = (country: CountryFeature, isDark: boolean) => {
  const key =
    country.properties?.REGION_UN ??
    country.properties?.SUBREGION ??
    country.properties?.ISO_A2 ??
    "";
  let hash = 0;
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) % 997;
  const colors = isDark ? DARK_REGION_COLORS : LIGHT_REGION_COLORS;
  return withAlpha(colors[hash % colors.length], isDark ? "52" : "2e");
};

const normalizeCoords = (coords: object): GlobeCoords | null => {
  const candidate = coords as Partial<GlobeCoords>;
  if (!Number.isFinite(candidate.lat) || !Number.isFinite(candidate.lng)) {
    return null;
  }

  return {
    lat: Number(candidate.lat),
    lng: Number(candidate.lng),
    altitude: Number.isFinite(candidate.altitude)
      ? Number(candidate.altitude)
      : undefined,
  };
};

const stopClickPropagation = (event: object | undefined) => {
  const maybeEvent = event as { stopPropagation?: () => void } | undefined;
  maybeEvent?.stopPropagation?.();
};
const stopMarkerEvent = (event: Event) => {
  event.stopPropagation();
};

const createDraftFromCoords = (
  coords: GlobeCoords,
  country?: CountryFeature,
): MemoryFormDraft => {
  const lat = formatCoord(coords.lat);
  const lng = formatCoord(coords.lng);
  const countryName = country?.properties?.ADMIN;
  const location = countryName
    ? `${countryName} · ${lat}, ${lng}`
    : `${lat}, ${lng}`;

  return {
    key: `${lat}:${lng}:${Date.now()}`,
    title: countryName ? `New memory in ${countryName}` : "New map memory",
    location,
    mood: DEFAULT_MOOD,
    lat,
    lng,
    track: "",
    artist: "",
    story: `Pinned from the globe at ${lat}, ${lng}.`,
  };
};

const createDraftFromMemory = (memory: MemoryData): MemoryFormDraft => {
  const lat = formatCoord(memory.lat);
  const lng = formatCoord(memory.lng);

  return {
    key: `${memory.resonanceId ?? memory.title}:${lat}:${lng}`,
    title: memory.title,
    location: `${memory.location} · ${lat}, ${lng}`,
    mood: normalizeMood(memory.mood),
    lat,
    lng,
    track: memory.track,
    artist: memory.artist,
    story: memory.story ?? "",
    resonanceId: memory.resonanceId,
    existingImageUrl: memory.image,
    spotifyTrackId: memory.spotifyTrackId ?? undefined,
    trackImageUrl: memory.trackImageUrl ?? undefined,
  };
};

const createDraftFromSearchPreview = (p: {
  lat: number;
  lng: number;
  locationLabel: string;
}): MemoryFormDraft => {
  const lat = formatCoord(p.lat);
  const lng = formatCoord(p.lng);
  return {
    key: `search-preview:${lat}:${lng}:${Date.now()}`,
    title: "New memory",
    location: p.locationLabel,
    mood: DEFAULT_MOOD,
    lat,
    lng,
    track: "",
    artist: "",
    story: "",
  };
};

/** List rows and detail responses share the fields needed for map markers. */
type ResonanceMapSource = Pick<
  ResonanceResponseDto,
  "id" | "title" | "mood" | "story" | "imageUrl" | "createdAt"
> &
  Pick<Partial<ResonanceResponseDto>, "place" | "track">;

function resonanceRowToMemory(r: ResonanceMapSource, index: number): MemoryData | null {
  const lat =
    r.place?.latitude != null && r.place.latitude !== ""
      ? Number(r.place.latitude)
      : NaN;
  const lng =
    r.place?.longitude != null && r.place.longitude !== ""
      ? Number(r.place.longitude)
      : NaN;
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }
  const color = LIGHT_REGION_COLORS[index % LIGHT_REGION_COLORS.length];
  let timeStr = "";
  if (r.createdAt) {
    try {
      timeStr = new Date(r.createdAt).toLocaleString();
    } catch {
      timeStr = "";
    }
  }
  const moodVal = normalizeMood(r.mood);
  return {
    title: r.title?.trim() || "Untitled",
    location:
      [r.place?.placeName, r.place?.address].filter(Boolean).join(" · ") ||
      `${formatCoord(lat)}, ${formatCoord(lng)}`,
    time: timeStr,
    mood: moodVal,
    track: r.track?.trackName ?? "",
    artist: r.track?.artistNames ?? "",
    lat,
    lng,
    color,
    image: r.imageUrl ?? undefined,
    story: r.story ?? "",
    resonanceId: r.id,
    spotifyTrackId: r.track?.spotifyTrackId ?? null,
    trackImageUrl: r.track?.imageUrl ?? null,
  };
}

/** Merge a `/resonance/detail` payload into sidebar + globe state without reloading the full list. */
function applyDetailToMemoriesState(
  prev: MemoryData[],
  detail: ResonanceResponseDto,
): MemoryData[] {
  const resonanceId = detail.id;
  const idx = prev.findIndex((x) => x.resonanceId === resonanceId);
  const mapped = resonanceRowToMemory(detail as ResonanceMapSource, idx >= 0 ? idx : prev.length);
  if (!mapped) return prev;
  if (idx >= 0) {
    const next = [...prev];
    next[idx] = { ...mapped, color: prev[idx].color };
    return next;
  }
  return [
    ...prev,
    {
      ...mapped,
      color: LIGHT_REGION_COLORS[prev.length % LIGHT_REGION_COLORS.length],
    },
  ];
}

const createPolaroidMarker = (
  memory: MemoryPoint,
  active: boolean,
  isDark: boolean,
  onSelectMemory: (index: number) => void,
) => {
  const marker = document.createElement("button");
  marker.type = "button";
  marker.className = "map-polaroid-marker";
  marker.dataset.active = String(active);
  marker.title = `${memory.title} - ${memory.location}`;
  marker.setAttribute("aria-label", `Open ${memory.title}`);
  marker.style.zIndex = active ? "7" : "4";
  marker.style.setProperty("--marker-color", safeMarkerHex(memory.color));
  marker.style.setProperty(
    "--marker-rotate",
    `${memory.polaroid?.rotate ?? 0}deg`,
  );
  marker.style.setProperty("--marker-scale", active ? "1.13" : "1");
  marker.style.setProperty(
    "--marker-surface",
    isDark ? "#f7f0e2" : "#fffaf0",
  );

  const stem = document.createElement("span");
  stem.className = "map-polaroid-stem";

  const dot = document.createElement("span");
  dot.className = "map-polaroid-dot";

  const card = document.createElement("span");
  card.className = "map-polaroid-card";

  const photo = document.createElement("span");
  photo.className = "map-polaroid-photo";

  if (memory.image) {
    const image = document.createElement("img");
    image.className = "map-polaroid-image";
    image.src = memory.image;
    image.alt = "";
    image.loading = "lazy";
    image.draggable = false;
    photo.appendChild(image);
  } else {
    const icon = document.createElement("span");
    icon.className = "material-symbols-outlined map-photo-fallback-icon";
    icon.textContent = "add_a_photo";
    photo.appendChild(icon);
  }

  const mood = document.createElement("span");
  mood.className = "map-polaroid-mood";
  mood.setAttribute("aria-label", `Mood: ${memory.mood}`);
  mood.title = memory.mood;
  mood.textContent = memory.mood;
  const caption = document.createElement("span");
  caption.className = "map-polaroid-caption";
  caption.textContent = memory.polaroid?.caption ?? memory.location;

  const meta = document.createElement("span");
  meta.className = "map-polaroid-meta";
  meta.append(mood, caption);

  card.append(photo, meta);
  marker.append(stem, dot, card);
  [
    "pointerdown",
    "pointerup",
    "mousedown",
    "mouseup",
    "touchstart",
    "touchend",
  ].forEach((eventName) => {
    marker.addEventListener(eventName, stopMarkerEvent);
  });
  marker.onclick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    onSelectMemory(memory.index);
  };

  return marker;
};

/* ── Props ── */
interface MapModalProps {
  visible: boolean;
  onClose?: () => void;
  userName?: string;
  avatarUrl?: string | null;
}

/* ── Form ── */
function ResonanceForm({
  draft,
  isDark,
  isMobile,
  uiTheme,
  onLibraryTrackPick,
}: {
  draft?: MemoryFormDraft | null;
  isDark: boolean;
  isMobile: boolean;
  uiTheme: UiVisuals;
  /** Pass null to clear selected library track */
  onLibraryTrackPick: (track: SavedTrackResponse | null) => void;
}) {
  const [loc, setLoc] = useState("");
  const [latStr, setLatStr] = useState("");
  const [lngStr, setLngStr] = useState("");
  const [titleStr, setTitleStr] = useState("");
  const [storyStr, setStoryStr] = useState("");
  const [moodStr, setMoodStr] = useState(DEFAULT_MOOD);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [acItems, setAcItems] = useState<{ placeId: string | null; description: string | null }[]>(
    [],
  );
  const [acOpen, setAcOpen] = useState(false);
  const [acLoading, setAcLoading] = useState(false);
  const acTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const locationBoxRef = useRef<HTMLDivElement>(null);
  const [libOpen, setLibOpen] = useState(false);
  const [libTracks, setLibTracks] = useState<SavedTrackResponse[]>([]);
  const [libLoading, setLibLoading] = useState(false);
  const [libFilter, setLibFilter] = useState("");

  const fieldClass =
    "border rounded-[14px] px-3.5 py-2.5 flex items-center gap-2.5 focus-within:ring-1 focus-within:ring-[#e8845a]/45 focus-within:border-[#e8845a]/45 transition-colors";
  const inputClass =
    `bg-transparent border-none focus:ring-0 text-[13px] w-full outline-none ${
      isDark
        ? "text-[#f4eee8] placeholder:text-[#d5cac1]/55"
        : "text-[#2f2723] placeholder:text-[#6f625b]/55"
    }`;
  const coordinateInputClass = `${inputClass} cursor-not-allowed opacity-70`;
  const labelStyle = { color: isDark ? "rgba(213,202,193,0.72)" : "#6f625b" };
  const fieldStyle = {
    background: uiTheme.fieldSurface,
    borderColor: uiTheme.border,
  };

  useEffect(() => {
    setLoc(draft?.location ?? "");
    setLatStr(draft?.lat ?? "");
    setLngStr(draft?.lng ?? "");
    setTitleStr(draft?.title ?? "");
    setStoryStr(draft?.story ?? "");
    setMoodStr(normalizeMood(draft?.mood));
    setPhotoPreview(null);
    setAcItems([]);
    setAcOpen(false);
    setLibOpen(false);
    setLibFilter("");
  }, [draft?.key]);

  useEffect(() => {
    if (!libOpen) return;
    const token = getToken();
    if (!token) return;
    setLibLoading(true);
    libraryApi
      .list(token, { page: 0, size: 100 })
      .then((res) => setLibTracks(res.data.content ?? []))
      .catch(() => setLibTracks([]))
      .finally(() => setLibLoading(false));
  }, [libOpen]);

  const filteredLibTracks = useMemo(() => {
    const q = libFilter.trim().toLowerCase();
    if (!q) return libTracks;
    return libTracks.filter(
      (t) =>
        (t.trackName ?? "").toLowerCase().includes(q) ||
        (t.artistNames ?? "").toLowerCase().includes(q),
    );
  }, [libTracks, libFilter]);

  useEffect(() => {
    return () => {
      if (photoPreview?.startsWith("blob:")) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      const el = locationBoxRef.current;
      if (el && !el.contains(e.target as Node)) setAcOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const runAutocomplete = useCallback(async (input: string) => {
    const token = getToken();
    if (!token || input.trim().length < 2) {
      setAcItems([]);
      return;
    }
    setAcLoading(true);
    try {
      const res = await resonanceApi.autocompletePlace(token, { input: input.trim() });
      setAcItems(res.data ?? []);
      setAcOpen(true);
    } catch {
      setAcItems([]);
    } finally {
      setAcLoading(false);
    }
  }, []);

  const onLocationInput = (value: string) => {
    setLoc(value);
    if (acTimerRef.current) clearTimeout(acTimerRef.current);
    acTimerRef.current = setTimeout(() => {
      void runAutocomplete(value);
    }, 320);
  };

  const pickPlace = async (placeId: string | null, description: string) => {
    if (!placeId) return;
    const token = getToken();
    if (!token) return;
    setAcLoading(true);
    try {
      const res = await resonanceApi.resolvePlace(token, { googlePlaceId: placeId });
      const p = res.data;
      const label = p.placeName ?? p.address ?? description;
      setLoc(label);
      if (p.latitude) setLatStr(String(p.latitude));
      if (p.longitude) setLngStr(String(p.longitude));
      setAcOpen(false);
      setAcItems([]);
    } catch {
      setAcOpen(false);
    } finally {
      setAcLoading(false);
    }
  };

  const displayPhoto = photoPreview ?? draft?.existingImageUrl;

  return (
    <form
      className={`space-y-3 ${isMobile ? "pb-1" : ""}`}
      encType="multipart/form-data"
      id={MEMORY_FORM_ID}
      onSubmit={(e) => e.preventDefault()}
    >
      <div className="space-y-1.5">
        <label
          htmlFor="memory-title"
          className="text-[10px] uppercase tracking-[0.14em] font-bold"
          style={labelStyle}
        >
          Title
        </label>
        <div className={fieldClass} style={fieldStyle}>
          <span className="material-symbols-outlined text-lg text-[#e8845a]">
            title
          </span>
          <input
            className={inputClass}
            id="memory-title"
            name="title"
            onChange={(e) => setTitleStr(e.target.value)}
            placeholder="Name this memory"
            required
            type="text"
            value={titleStr}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="memory-location"
          className="text-[10px] uppercase tracking-[0.14em] font-bold"
          style={labelStyle}
        >
          Location
        </label>
        <div className="relative" ref={locationBoxRef}>
          <div className={fieldClass} style={fieldStyle}>
            <span className="material-symbols-outlined text-lg text-[#e8845a] shrink-0">
              location_on
            </span>
            <input
              autoComplete="off"
              className={inputClass}
              id="memory-location"
              name="location"
              placeholder="Type a query, pick a Google suggestion to fill coordinates"
              required
              type="text"
              value={loc}
              onChange={(e) => onLocationInput(e.target.value)}
              onFocus={() => loc.trim().length >= 2 && void runAutocomplete(loc)}
            />
          </div>
          {acLoading && (
            <p className="absolute right-0 top-full mt-1 text-[10px]" style={{ color: labelStyle.color }}>
              Searching places…
            </p>
          )}
          {acOpen && acItems.length > 0 && (
            <ul
              className="absolute left-0 right-0 top-full z-[70] mt-1 max-h-48 overflow-y-auto rounded-[12px] border py-1 shadow-lg"
              style={{
                background: uiTheme.drawerSurface,
                borderColor: uiTheme.border,
              }}
            >
              {acItems.map((s, idx) => (
                <li key={`${s.placeId ?? "p"}-${idx}`}>
                  <button
                    className="w-full cursor-pointer px-3 py-2 text-left text-[12px] hover:bg-white/10"
                    style={{ color: isDark ? "#f4eee8" : "#2f2723" }}
                    type="button"
                    onClick={() => void pickPlace(s.placeId, s.description ?? "")}
                  >
                    {s.description}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <p className="text-[10px] m-0" style={{ color: uiTheme.textMuted }}>
          Sign-in and Google Places on the server required; coordinates are filled from the picked place.
        </p>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="memory-mood"
          className="text-[10px] uppercase tracking-[0.14em] font-bold"
          style={labelStyle}
        >
          Mood
        </label>
        <div className={fieldClass} style={fieldStyle}>
          <span className="material-symbols-outlined text-lg text-[#e8845a]">
            mood
          </span>
          <select
            className={`${inputClass} appearance-none cursor-pointer`}
            id="memory-mood"
            name="mood"
            onChange={(e) => setMoodStr(e.target.value)}
            value={moodStr}
          >
            {MOOD_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.value} {option.label}
              </option>
            ))}
          </select>
          <span
            className="material-symbols-outlined text-base"
            style={{ color: isDark ? "rgba(213,202,193,0.6)" : "#6f625b" }}
          >
            expand_more
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        <span
          className="text-[10px] uppercase tracking-[0.14em] font-bold"
          style={labelStyle}
        >
          Coordinates
        </span>
        <div className="grid grid-cols-2 gap-2">
          <label className={fieldClass} style={fieldStyle}>
            <span className="material-symbols-outlined text-lg text-[#e8845a]">
              north
            </span>
            <input name="lat" type="hidden" value={latStr} />
            <input
              aria-label="Latitude"
              aria-readonly="true"
              className={coordinateInputClass}
              disabled
              inputMode="decimal"
              max="90"
              min="-90"
              placeholder="Lat"
              readOnly
              step="any"
              type="number"
              value={latStr}
            />
          </label>
          <label className={fieldClass} style={fieldStyle}>
            <span className="material-symbols-outlined text-lg text-[#e8845a]">
              east
            </span>
            <input name="lng" type="hidden" value={lngStr} />
            <input
              aria-label="Longitude"
              aria-readonly="true"
              className={coordinateInputClass}
              disabled
              inputMode="decimal"
              max="180"
              min="-180"
              placeholder="Lng"
              readOnly
              step="any"
              type="number"
              value={lngStr}
            />
          </label>
        </div>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="memory-photo"
          className="text-[10px] uppercase tracking-[0.14em] font-bold"
          style={labelStyle}
        >
          Visual Memory
        </label>
        <label
          className={`relative aspect-video w-full overflow-hidden rounded-[14px] border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer ${uiTheme.uploadHoverClass}`}
          style={{
            background: uiTheme.uploadSurface,
            borderColor: uiTheme.border,
            color: isDark ? "rgba(213,202,193,0.72)" : "#6f625b",
          }}
        >
          {displayPhoto ? (
            <img
              alt=""
              className="absolute inset-0 h-full w-full object-contain"
              src={displayPhoto}
            />
          ) : null}
          {!displayPhoto && (
            <span className="relative z-[1] material-symbols-outlined text-xl text-[#e8845a]">
              add_a_photo
            </span>
          )}
          <span className={`relative z-[1] text-[11px] font-semibold ${displayPhoto ? "text-white drop-shadow" : ""}`}>
            {displayPhoto ? "Tap to replace" : "Upload Photo"}
          </span>
          {!displayPhoto && (
            <span className="relative z-[1] text-[10px] opacity-70">JPG, PNG, or WebP</span>
          )}
          <input
            accept="image/*"
            className="absolute inset-0 z-[2] cursor-pointer opacity-0"
            id="memory-photo"
            name="photo"
            type="file"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (!f) return;
              setPhotoPreview((prev) => {
                if (prev?.startsWith("blob:")) URL.revokeObjectURL(prev);
                return URL.createObjectURL(f);
              });
            }}
          />
        </label>
      </div>

      <div className="space-y-1.5">
        <span
          className="text-[10px] uppercase tracking-[0.14em] font-bold block"
          style={labelStyle}
        >
          Resonating Sound
        </span>
        {draft?.spotifyTrackId ? (
          <div
            className="flex items-center gap-2 rounded-[14px] border px-2.5 py-2"
            style={{ background: uiTheme.fieldSurface, borderColor: uiTheme.border }}
          >
            {draft.trackImageUrl ? (
              <img
                alt=""
                className="h-10 w-10 shrink-0 rounded-md object-cover"
                src={draft.trackImageUrl}
              />
            ) : (
              <span className="material-symbols-outlined text-[#e8845a] shrink-0">album</span>
            )}
            <div className="min-w-0 flex-1">
              <div
                className="text-[12px] font-semibold truncate"
                style={{ color: isDark ? "#f4eee8" : "#2f2723" }}
              >
                {draft.track || "Track"}
              </div>
              <div className="text-[10px] truncate opacity-75">{draft.artist || "Artist"}</div>
            </div>
            <button
              className="shrink-0 rounded-lg border px-2 py-1 text-[10px] cursor-pointer"
              style={{ borderColor: uiTheme.border, color: uiTheme.textMuted }}
              type="button"
              onClick={() => onLibraryTrackPick(null)}
            >
              Clear
            </button>
          </div>
        ) : null}
        <input
          key={`hid-track-${draft?.spotifyTrackId ?? ""}-${draft?.track ?? ""}`}
          defaultValue={draft?.track ?? ""}
          name="track"
          type="hidden"
        />
        <input
          key={`hid-artist-${draft?.spotifyTrackId ?? ""}-${draft?.artist ?? ""}`}
          defaultValue={draft?.artist ?? ""}
          name="artist"
          type="hidden"
        />
        <button
          className="w-full rounded-[14px] border px-3 py-2.5 flex items-center justify-center gap-2 text-[12px] font-semibold cursor-pointer transition-colors"
          style={{
            background: uiTheme.fieldSurface,
            borderColor: uiTheme.border,
            color: isDark ? "#f4eee8" : "#2f2723",
          }}
          type="button"
          onClick={() => setLibOpen((o) => !o)}
        >
          <span className="material-symbols-outlined text-lg text-[#e8845a]">library_music</span>
          {draft?.spotifyTrackId ? "Change track from library" : "Choose from my library"}
        </button>
        {libOpen && (
          <div
            className="rounded-[14px] border overflow-hidden flex flex-col max-h-56"
            style={{ borderColor: uiTheme.border, background: uiTheme.drawerSurface }}
          >
            <input
              aria-label="Filter library"
              className={`${inputClass} px-3 py-2 border-b`}
              placeholder="Filter saved tracks…"
              style={{
                ...fieldStyle,
                borderBottom: `1px solid ${uiTheme.border}`,
                borderRadius: 0,
              }}
              value={libFilter}
              onChange={(e) => setLibFilter(e.target.value)}
            />
            <div className="overflow-y-auto min-h-0 flex-1">
              {libLoading ? (
                <p className="px-3 py-2 text-[11px] m-0" style={{ color: uiTheme.textMuted }}>
                  Loading your library…
                </p>
              ) : filteredLibTracks.length === 0 ? (
                <p className="px-3 py-2 text-[11px] m-0" style={{ color: uiTheme.textMuted }}>
                  No saved tracks yet. Save songs from the music player, then return here.
                </p>
              ) : (
                filteredLibTracks.map((t) => (
                  <button
                    key={t.spotifyTrackId}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-white/10 cursor-pointer border-none"
                    style={{ color: isDark ? "#f4eee8" : "#2f2723" }}
                    type="button"
                    onClick={() => {
                      onLibraryTrackPick(t);
                      setLibOpen(false);
                    }}
                  >
                    {t.imageUrl ? (
                      <img alt="" className="h-8 w-8 rounded object-cover shrink-0" src={t.imageUrl} />
                    ) : (
                      <span className="material-symbols-outlined text-[#e8845a] shrink-0 text-xl">
                        music_note
                      </span>
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block text-[12px] font-medium truncate">{t.trackName}</span>
                      <span className="block text-[10px] opacity-75 truncate">{t.artistNames}</span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="memory-story"
          className="text-[10px] uppercase tracking-[0.14em] font-bold"
          style={labelStyle}
        >
          The Story
        </label>
        <textarea
          className={`w-full border rounded-[14px] p-3 text-[13px] focus:ring-1 focus:ring-[#e8845a]/45 focus:border-[#e8845a]/45 resize-none outline-none ${
            isDark
              ? "text-[#f4eee8] placeholder:text-[#d5cac1]/55"
              : "text-[#2f2723] placeholder:text-[#6f625b]/55"
          }`}
          id="memory-story"
          name="story"
          onChange={(e) => setStoryStr(e.target.value)}
          placeholder="Describe the atmosphere..."
          rows={isMobile ? 3 : 4}
          style={fieldStyle}
          value={storyStr}
        />
      </div>
    </form>
  );
}

function RealisticGlobe({
  activeMemory,
  isDark,
  isMobile,
  memories,
  searchPlaceFocus,
  onAddMemory,
  onSelectMemory,
}: {
  activeMemory: number;
  isDark: boolean;
  isMobile: boolean;
  memories: MemoryPoint[];
  /** While set, camera stays on this lat/lng and auto-rotate pauses (Places search preview). */
  searchPlaceFocus?: { lat: number; lng: number } | null;
  onAddMemory: (coords: GlobeCoords, country?: CountryFeature) => void;
  onSelectMemory: (index: number) => void;
}) {
  const globeRef = useRef<GlobeMethods | undefined>(undefined);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 600 });
  const [countries, setCountries] = useState<CountryFeature[]>([]);
  const mapTheme = MAP_VISUALS[isDark ? "dark" : "light"];
  const globeMaterial = useMemo(
    () =>
      new THREE.MeshPhongMaterial({
        color: mapTheme.globeColor,
        emissive: mapTheme.globeEmissive,
        emissiveIntensity: mapTheme.globeEmissiveIntensity,
        opacity: mapTheme.globeOpacity,
        shininess: mapTheme.globeShininess,
        transparent: true,
      }),
    [mapTheme],
  );

  const savedGlobePoints = useMemo(
    () => memories.filter((m) => m.index >= 0),
    [memories],
  );
  const searchPreviewActive = memories.some(
    (m) => m.index === SEARCH_PLACE_PREVIEW_INDEX,
  );

  const arcs = useMemo(() => {
    if (savedGlobePoints.length < 2) return [];

    return (isDark ? savedGlobePoints : savedGlobePoints.slice(1)).map(
      (memory, index) => {
        const start = isDark ? memory : savedGlobePoints[index];
        const end = isDark
          ? savedGlobePoints[(index + 1) % savedGlobePoints.length]
          : memory;

        return {
          startLat: start.lat,
          startLng: start.lng,
          endLat: end.lat,
          endLng: end.lng,
          color: safeMarkerHex(memory.color),
          index,
        };
      },
    );
  }, [isDark, savedGlobePoints]);
  const ringMemories = isDark
    ? memories
    : memories.filter(
        (memory) =>
          memory.index === activeMemory ||
          (memory.index === SEARCH_PLACE_PREVIEW_INDEX && searchPreviewActive),
      );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resize = () => {
      const rect = container.getBoundingClientRect();
      setSize({
        width: Math.max(320, Math.round(rect.width)),
        height: Math.max(320, Math.round(rect.height)),
      });
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch(COUNTRIES_GEOJSON_URL)
      .then((response) => response.json())
      .then((data: { features?: CountryFeature[] }) => {
        if (cancelled) return;
        setCountries(
          (data.features ?? []).filter(
            (country) => country.properties?.ISO_A2 !== "AQ",
          ),
        );
      })
      .catch(() => {
        if (!cancelled) setCountries([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => () => globeMaterial.dispose(), [globeMaterial]);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;

    const controls = globe.controls();
    controls.autoRotateSpeed = 0.28;
    controls.enablePan = false;
    controls.enableZoom = false;
  }, []);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;
    const controls = globe.controls();
    controls.autoRotate = !searchPlaceFocus;
  }, [searchPlaceFocus]);

  useEffect(() => {
    const globe = globeRef.current;
    if (!globe) return;

    if (searchPlaceFocus) {
      globe.pointOfView(
        {
          lat: searchPlaceFocus.lat,
          lng: searchPlaceFocus.lng,
          altitude: isMobile ? MOBILE_GLOBE_ALTITUDE : DESKTOP_GLOBE_ALTITUDE,
        },
        1200,
      );
      return;
    }

    const memory = memories.find((m) => m.index === activeMemory);
    if (!memory) return;

    globe.pointOfView(
      {
        lat: memory.lat,
        lng: memory.lng,
        altitude: isMobile ? MOBILE_GLOBE_ALTITUDE : DESKTOP_GLOBE_ALTITUDE,
      },
      900,
    );
  }, [activeMemory, isMobile, memories, searchPlaceFocus]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <Globe
        ref={globeRef}
        width={size.width}
        height={size.height}
        globeOffset={isMobile ? [0, 0] : [DESKTOP_GLOBE_OFFSET_X, 0]}
        animateIn={false}
        backgroundColor="rgba(255,255,255,0)"
        globeMaterial={globeMaterial}
        showAtmosphere
        atmosphereColor={mapTheme.atmosphereColor}
        atmosphereAltitude={mapTheme.atmosphereAltitude}
        showGraticules={isDark}
        polygonsData={countries}
        polygonGeoJsonGeometry={(country: object) =>
          (country as CountryFeature).geometry
        }
        polygonCapColor={(country: object) =>
          getRegionColor(country as CountryFeature, isDark)
        }
        polygonSideColor={() => mapTheme.polygonSideColor}
        polygonStrokeColor={() => mapTheme.polygonStrokeColor}
        polygonAltitude={0.006}
        polygonLabel={(country: object) =>
          (country as CountryFeature).properties?.ADMIN ?? ""
        }
        pointsData={memories}
        pointLat={(point: object) => (point as MemoryPoint).lat}
        pointLng={(point: object) => (point as MemoryPoint).lng}
        pointColor={(point: object) => {
          const p = point as MemoryPoint;
          const active =
            p.index === SEARCH_PLACE_PREVIEW_INDEX
              ? searchPreviewActive
              : p.index === activeMemory;
          return isDark && active
            ? "#ffffff"
            : safeMarkerHex(p.color);
        }}
        pointAltitude={(point: object) => {
          const p = point as MemoryPoint;
          const active =
            p.index === SEARCH_PLACE_PREVIEW_INDEX
              ? searchPreviewActive
              : p.index === activeMemory;
          return active
            ? mapTheme.pointActiveAltitude
            : mapTheme.pointAltitude;
        }}
        pointRadius={(point: object) => {
          const p = point as MemoryPoint;
          const active =
            p.index === SEARCH_PLACE_PREVIEW_INDEX
              ? searchPreviewActive
              : p.index === activeMemory;
          return active
            ? mapTheme.pointActiveRadius
            : mapTheme.pointRadius;
        }}
        pointResolution={20}
        pointsTransitionDuration={350}
        pointLabel={(point: object) => {
          const m = point as MemoryPoint;
          if (m.index === SEARCH_PLACE_PREVIEW_INDEX) {
            return `${m.title}<br/>${m.location}<br/>Add photo to save`;
          }
          return `${m.title}<br/>${m.location}<br/>${m.track} · ${m.artist}`;
        }}
        onPointClick={(point: object, event: object) => {
          stopClickPropagation(event);
          onSelectMemory((point as MemoryPoint).index);
        }}
        onPolygonClick={(country: object, event: object, coords: object) => {
          stopClickPropagation(event);
          const normalized = normalizeCoords(coords);
          if (normalized) onAddMemory(normalized, country as CountryFeature);
        }}
        onGlobeClick={(coords: object) => {
          const normalized = normalizeCoords(coords);
          if (normalized) onAddMemory(normalized);
        }}
        htmlElementsData={memories}
        htmlLat={(point: object) => (point as MemoryPoint).lat}
        htmlLng={(point: object) => (point as MemoryPoint).lng}
        htmlAltitude={(point: object) => {
          const p = point as MemoryPoint;
          const active =
            p.index === SEARCH_PLACE_PREVIEW_INDEX
              ? searchPreviewActive
              : p.index === activeMemory;
          return active ? 0.13 : 0.1;
        }}
        htmlElement={(point: object) => {
          const memory = point as MemoryPoint;
          const active =
            memory.index === SEARCH_PLACE_PREVIEW_INDEX
              ? searchPreviewActive
              : memory.index === activeMemory;
          return createPolaroidMarker(
            memory,
            active,
            isDark,
            onSelectMemory,
          );
        }}
        htmlElementVisibilityModifier={(element: HTMLElement, isVisible: boolean) => {
          element.style.opacity = isVisible
            ? element.dataset.active === "true"
              ? "1"
              : "0.9"
            : "0";
          element.style.pointerEvents = isVisible ? "auto" : "none";
        }}
        htmlTransitionDuration={420}
        arcsData={arcs}
        arcColor={(arc: object) => {
          const color = safeMarkerHex((arc as MemoryArc).color);
          return isDark
            ? [withAlpha(color, "22"), withAlpha(color, "ee"), "rgba(255,255,255,0.9)"]
            : mapTheme.arcColor;
        }}
        arcAltitude={0.2}
        arcStroke={mapTheme.arcStroke}
        arcCircularResolution={12}
        arcDashLength={mapTheme.arcDashLength}
        arcDashGap={mapTheme.arcDashGap}
        arcDashInitialGap={(arc: object) =>
          isDark ? ((arc as MemoryArc).index * 0.19) % 1 : 0
        }
        arcDashAnimateTime={3200}
        ringsData={ringMemories}
        ringLat={(point: object) => (point as MemoryPoint).lat}
        ringLng={(point: object) => (point as MemoryPoint).lng}
        ringColor={(point: object) => {
          const color = safeMarkerHex((point as MemoryPoint).color);
          return isDark
            ? [withAlpha(color, "00"), withAlpha(color, "ee"), "rgba(255,255,255,0)"]
            : withAlpha(color, "aa");
        }}
        ringAltitude={0.01}
        ringResolution={96}
        ringMaxRadius={mapTheme.ringMaxRadius}
        ringPropagationSpeed={mapTheme.ringPropagationSpeed}
        ringRepeatPeriod={mapTheme.ringRepeatPeriod}
        rendererConfig={{ antialias: true, alpha: true }}
      />
    </div>
  );
}

/* ── Component ── */
export default function MapModal({ visible, onClose, userName, avatarUrl }: MapModalProps) {
  const [activeMemory, setActiveMemory] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [isDark, setIsDark] = useState(true);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showBottomPanel, setShowBottomPanel] = useState(true);
  const [draftMemory, setDraftMemory] = useState<MemoryFormDraft | null>(null);
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  /** Top-right: Google Places search for any location */
  const [worldSearchText, setWorldSearchText] = useState("");
  const [worldAcItems, setWorldAcItems] = useState<
    { placeId: string | null; description: string | null }[]
  >([]);
  const [worldAcOpen, setWorldAcOpen] = useState(false);
  const [worldAcLoading, setWorldAcLoading] = useState(false);
  /** Resolved Places pick: show polaroid preview until user edits or clicks elsewhere */
  const [searchPlacePreview, setSearchPlacePreview] = useState<{
    lat: number;
    lng: number;
    locationLabel: string;
  } | null>(null);
  /** Desktop sidebar: show read-only memory card (not the edit drawer) */
  const [memoryPeekOpen, setMemoryPeekOpen] = useState(false);
  /** Bottom bar: expand Spotify embed in lower half */
  const [mapBottomPlayerOpen, setMapBottomPlayerOpen] = useState(false);
  const [trashPanelOpen, setTrashPanelOpen] = useState(false);
  const [trashItems, setTrashItems] = useState<ResonanceListItemDto[]>([]);
  const [trashLoading, setTrashLoading] = useState(false);
  const [trashDropActive, setTrashDropActive] = useState(false);
  const dragSourceGlobalIndexRef = useRef<number | null>(null);
  const [dropHighlightGlobalIndex, setDropHighlightGlobalIndex] = useState<number | null>(null);
  const worldSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const worldSearchBoxRef = useRef<HTMLDivElement>(null);
  const historySearchInputRef = useRef<HTMLInputElement>(null);
  const worldSearchInputRef = useRef<HTMLInputElement>(null);
  const [memoriesState, setMemoriesState] = useState<MemoryData[]>([]);
  /** Used so reopening the globe can refresh in the background when we already have list data */
  const memoriesRef = useRef<MemoryData[]>(memoriesState);
  memoriesRef.current = memoriesState;
  const [loadPending, setLoadPending] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isMobile = useIsMobile();

  const refreshMemories = useCallback(async (options?: { background?: boolean }) => {
    const background = options?.background === true;
    const token = getToken();
    if (!token) {
      setMemoriesState([]);
      setLoadError("Please sign in to sync your resonances.");
      return;
    }
    setLoadError(null);
    if (!background) {
      setLoadPending(true);
    }
    try {
      const page = await resonanceApi.list(token, { page: 0, size: 50 });
      const rows = page.data.content;
      const next: MemoryData[] = [];
      rows.forEach((row, i) => {
        const m = resonanceRowToMemory(row, i);
        if (m) next.push(m);
      });
      setMemoriesState(next);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load";
      if (!background) {
        setLoadError(msg);
        setMemoriesState([]);
      }
      /* Background sync failures keep showing cached markers; user can reopen to retry */
    } finally {
      if (!background) {
        setLoadPending(false);
      }
    }
  }, []);

  const loadTrash = useCallback(async () => {
    const token = getToken();
    if (!token) {
      setTrashItems([]);
      return;
    }
    setTrashLoading(true);
    try {
      const res = await resonanceApi.trashList(token);
      setTrashItems(res.data ?? []);
    } catch {
      setTrashItems([]);
    } finally {
      setTrashLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    /** First open or empty cache: blocking fetch. Later opens: sync in background so UI stays responsive */
    void refreshMemories({ background: memoriesRef.current.length > 0 });
  }, [visible, refreshMemories]);

  useEffect(() => {
    if (trashPanelOpen) void loadTrash();
  }, [trashPanelOpen, loadTrash]);

  useEffect(() => {
    if (memoriesState.length === 0) {
      setActiveMemory(0);
      return;
    }
    setActiveMemory((i) => (i >= memoriesState.length ? 0 : i));
  }, [memoriesState]);

  useEffect(() => {
    setMapBottomPlayerOpen(false);
  }, [activeMemory]);

  const memory = memoriesState[activeMemory];
  const sidebarReorderEnabled = historySearchQuery.trim() === "";

  const softDeleteResonance = useCallback(
    async (resonanceId: number) => {
      const token = getToken();
      if (!token) return;
      try {
        await resonanceApi.delete(token, { resonanceId });
        setMemoryPeekOpen(false);
        setMapBottomPlayerOpen(false);
        setShowForm(false);
        setDraftMemory(null);
        setMemoriesState((prev) => prev.filter((m) => m.resonanceId !== resonanceId));
        if (trashPanelOpen) {
          await loadTrash();
        } else {
          void loadTrash();
        }
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Could not move to trash");
      }
    },
    [loadTrash, trashPanelOpen],
  );

  const applySidebarReorder = useCallback(
    async (fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;
      if (historySearchQuery.trim() !== "") return;
      const token = getToken();
      if (!token) return;
      const next = [...memoriesState];
      if (fromIndex < 0 || fromIndex >= next.length || toIndex < 0 || toIndex >= next.length) {
        return;
      }
      const [row] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, row);
      const ids = next.map((x) => x.resonanceId).filter((id): id is number => id != null);
      if (ids.length !== next.length) return;
      setMemoriesState(next);
      try {
        await resonanceApi.reorder(token, { orderedResonanceIds: ids });
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Reorder failed");
        await refreshMemories();
      }
    },
    [memoriesState, refreshMemories, historySearchQuery],
  );

  const restoreFromTrash = useCallback(
    async (resonanceId: number) => {
      const token = getToken();
      if (!token) return;
      try {
        const restored = await resonanceApi.restore(token, { resonanceId });
        setMemoriesState((prev) => applyDetailToMemoriesState(prev, restored.data));
        await loadTrash();
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Restore failed");
      }
    },
    [loadTrash],
  );

  const purgeFromTrash = useCallback(
    async (resonanceId: number) => {
      if (!window.confirm("Permanently delete this memory from the database? This cannot be undone.")) {
        return;
      }
      const token = getToken();
      if (!token) return;
      try {
        await resonanceApi.purge(token, { resonanceId });
        await loadTrash();
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Delete failed");
      }
    },
    [loadTrash],
  );

  const handleLibraryTrackPick = useCallback((track: SavedTrackResponse | null) => {
    setDraftMemory((prev) => {
      const base: MemoryFormDraft =
        prev ??
        ({
          key: `draft-${Date.now()}`,
          title: "",
          location: "",
          mood: DEFAULT_MOOD,
          lat: "",
          lng: "",
          track: "",
          artist: "",
          story: "",
        } satisfies MemoryFormDraft);
      /* Do not change base.key: ResonanceForm is keyed by draftMemory.key; bumping it remounts
       * the whole form and wipes in-progress title/story/location edits and photo preview. */
      if (!track?.spotifyTrackId) {
        return {
          ...base,
          spotifyTrackId: undefined,
          trackImageUrl: undefined,
          track: "",
          artist: "",
        };
      }
      return {
        ...base,
        track: track.trackName ?? "",
        artist: track.artistNames ?? "",
        spotifyTrackId: track.spotifyTrackId,
        trackImageUrl: track.imageUrl ?? undefined,
      };
    });
  }, []);
  /** Avoid reading undefined when empty or index out of range (sidebar chrome still renders) */
  const listAccentColor = memory?.color ?? ACCENT;
  const mode = isDark ? "dark" : "light";
  const mapTheme = MAP_VISUALS[mode];
  const uiTheme = UI_VISUALS[mode];
  const filterMemories = (query: string) => {
    const normalizedSearch = query.trim().toLowerCase();

    return memoriesState.map((item, index) => ({
      ...item,
      index,
    })).filter((item) => {
      if (!normalizedSearch) return true;
      return [
        item.title,
        item.location,
        item.mood,
        item.track,
        item.artist,
      ].some((value) => value.toLowerCase().includes(normalizedSearch));
    });
  };
  /** Globe matches left list: filter saved memories only (not top-right Google search) */
  const visibleMemories = filterMemories(historySearchQuery);
  const visibleHistoryMemories = visibleMemories;

  const globeMemoryPoints = useMemo((): MemoryPoint[] => {
    const base = visibleMemories;
    if (!searchPlacePreview) return base;
    const p = searchPlacePreview;
    const caption =
      p.locationLabel.length > 36
        ? `${p.locationLabel.slice(0, 33)}…`
        : p.locationLabel;
    const previewPoint: MemoryPoint = {
      index: SEARCH_PLACE_PREVIEW_INDEX,
      title: "New place",
      location: p.locationLabel,
      time: "",
      mood: DEFAULT_MOOD,
      track: "",
      artist: "",
      lat: p.lat,
      lng: p.lng,
      color: ACCENT,
      image: undefined,
      polaroid: { caption, rotate: 0 },
    };
    return [...base, previewPoint];
  }, [visibleMemories, searchPlacePreview]);

  const runWorldAutocomplete = useCallback(async (input: string) => {
    const token = getToken();
    if (!token || input.trim().length < 2) {
      setWorldAcItems([]);
      return;
    }
    setWorldAcLoading(true);
    try {
      const res = await resonanceApi.autocompletePlace(token, { input: input.trim() });
      setWorldAcItems(res.data ?? []);
      setWorldAcOpen(true);
    } catch {
      setWorldAcItems([]);
    } finally {
      setWorldAcLoading(false);
    }
  }, []);

  const onWorldSearchChange = (value: string) => {
    setWorldSearchText(value);
    if (worldSearchTimerRef.current) clearTimeout(worldSearchTimerRef.current);
    worldSearchTimerRef.current = setTimeout(() => {
      void runWorldAutocomplete(value);
    }, 320);
  };

  const pickWorldPlace = async (placeId: string | null, description: string) => {
    if (!placeId) return;
    const token = getToken();
    if (!token) return;
    setWorldAcLoading(true);
    try {
      const res = await resonanceApi.resolvePlace(token, { googlePlaceId: placeId });
      const p = res.data;
      const lat = Number(p.latitude);
      const lng = Number(p.longitude);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        setSearchPlacePreview({
          lat,
          lng,
          locationLabel: p.placeName ?? p.address ?? description,
        });
        setWorldSearchText(p.placeName ?? p.address ?? description);
      }
      setWorldAcOpen(false);
      setWorldAcItems([]);
    } catch {
      setWorldAcOpen(false);
    } finally {
      setWorldAcLoading(false);
    }
  };

  useEffect(() => {
    const close = (e: MouseEvent) => {
      const el = worldSearchBoxRef.current;
      if (el && !el.contains(e.target as Node)) setWorldAcOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const handleSealMemory = async () => {
    const token = getToken();
    if (!token) {
      setSubmitError("Please sign in to save.");
      return;
    }
    const form = document.getElementById(MEMORY_FORM_ID) as HTMLFormElement | null;
    if (!form) return;
    setSubmitError(null);
    setSubmitting(true);
    try {
      const fd = new FormData(form);
      const title = String(fd.get("title") ?? "").trim();
      const locationLabel = String(fd.get("location") ?? "").trim();
      const mood = normalizeMood(String(fd.get("mood") ?? ""));
      const story = String(fd.get("story") ?? "").trim();
      const lat = Number(fd.get("lat"));
      const lng = Number(fd.get("lng"));
      const track = String(fd.get("track") ?? "").trim();
      const artist = String(fd.get("artist") ?? "").trim();
      const editingId = draftMemory?.resonanceId;
      const pickedSpotifyId = draftMemory?.spotifyTrackId?.trim();
      const prevSpotifyId =
        editingId != null
          ? memoriesState.find((mm) => mm.resonanceId === editingId)?.spotifyTrackId ?? null
          : null;

      if (!title) {
        throw new Error("Please enter a title");
      }
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new Error("Please enter valid latitude and longitude");
      }

      let imageUrl: string | undefined;
      const photo = fd.get("photo");
      if (photo instanceof File && photo.size > 0) {
        if (photo.size > 1_800_000) {
          throw new Error("Image is too large; choose one under about 1.8 MB");
        }
        imageUrl = await new Promise<string>((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result));
          r.onerror = () => reject(new Error("Failed to read image"));
          r.readAsDataURL(photo);
        });
      }

      if (imageUrl === undefined && editingId != null) {
        imageUrl = memoriesState.find((m) => m.resonanceId === editingId)?.image;
      }

      const committed = await resonanceApi.commitMapMemory(token, {
        title,
        mood,
        ...(editingId != null ? { resonanceId: editingId } : {}),
        ...(editingId != null ? { story } : story ? { story } : {}),
        visibility: "PRIVATE",
        ...(locationLabel ? { placeName: locationLabel } : {}),
        latitude: lat,
        longitude: lng,
        ...(imageUrl !== undefined ? { imageUrl } : {}),
        ...(pickedSpotifyId ? { spotifyTrackId: pickedSpotifyId } : {}),
        ...(pickedSpotifyId || !prevSpotifyId ? {} : { unbindSpotify: true }),
        ...(pickedSpotifyId || prevSpotifyId || !track || !artist
          ? {}
          : { fallbackTrackQuery: `${track} ${artist}` }),
      });

      setShowForm(false);
      setDraftMemory(null);
      setMemoriesState((prev) => applyDetailToMemoriesState(prev, committed.data));
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };
  const mapChromeLeftClass = !isMobile && showLeftPanel
    ? "left-[232px]"
    : "left-4";
  const bottomChromeLeftClass = !isMobile && showLeftPanel
    ? "left-[232px]"
    : !isMobile
      ? "left-[68px]"
      : "left-4";
  const openBlankForm = () => {
    setSubmitError(null);
    setDraftMemory(null);
    setShowForm(true);
  };
  const openDraftForm = (coords: GlobeCoords, country?: CountryFeature) => {
    setSubmitError(null);
    setDraftMemory(createDraftFromCoords(coords, country));
    setShowForm(true);
  };

  const handleAddMemoryFromGlobe = (
    coords: GlobeCoords,
    country?: CountryFeature,
  ) => {
    if (searchPlacePreview) {
      setSearchPlacePreview(null);
      return;
    }
    openDraftForm(coords, country);
  };
  const openActiveMemoryForm = () => {
    if (!memory) return;
    setMemoryPeekOpen(false);
    setSubmitError(null);
    setDraftMemory(createDraftFromMemory(memory));
    setShowForm(true);
  };

  const handleSelectMemoryFromGlobe = useCallback(
    (globalIndex: number) => {
      setMemoryPeekOpen(false);
      if (globalIndex === SEARCH_PLACE_PREVIEW_INDEX) {
        if (!searchPlacePreview) return;
        setSubmitError(null);
        setDraftMemory(createDraftFromSearchPreview(searchPlacePreview));
        setShowForm(true);
        setSearchPlacePreview(null);
        return;
      }
      setSearchPlacePreview(null);
      setActiveMemory(globalIndex);
      const m = memoriesState[globalIndex];
      if (m) {
        setSubmitError(null);
        setDraftMemory(createDraftFromMemory(m));
        setShowForm(true);
      }
    },
    [memoriesState, searchPlacePreview],
  );

  useEffect(() => {
    if (!visible || !onClose) return;

    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose, visible]);

  useEffect(() => {
    if (visible) return;

    const frame = requestAnimationFrame(() => {
      setShowForm(false);
      setSearchPlacePreview(null);
      setMemoryPeekOpen(false);
      setMapBottomPlayerOpen(false);
      setTrashPanelOpen(false);
    });
    return () => cancelAnimationFrame(frame);
  }, [visible]);

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      aria-busy={loadPending || undefined}
      className={`absolute left-1/2 top-1/2 z-10 flex flex-col transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] liquid-glass ${isMobile ? "liquid-glass-mobile h-[94vh] w-[96vw]" : "h-[720px] w-[1120px] max-h-[88vh] max-w-[92vw]"}`}
      style={{
        background: uiTheme.shellBackground,
        border: `1px solid ${uiTheme.shellBorder}`,
        boxShadow: uiTheme.shellShadow,
        transform: `translate(-50%, -50%) ${visible ? "scale(1)" : "scale(0.95)"}`,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      {loadError && (
        <div
          className="shrink-0 px-4 py-2 text-center text-[12px] border-b"
          style={{
            color: "#c44",
            borderColor: uiTheme.border,
            background: uiTheme.subtleSurface,
          }}
        >
          {loadError}
        </div>
      )}
      {/* ── Body: full map + floating sidebar ── */}
      <div className="relative flex-1 min-h-0 overflow-hidden">
        {memoryPeekOpen && memory && (
          <>
            <button
              aria-label="Close memory preview"
              className="absolute inset-0 z-[24] cursor-default bg-black/25"
              type="button"
              onClick={() => setMemoryPeekOpen(false)}
            />
            <div
              className={`absolute z-[25] flex max-h-[min(420px,52vh)] w-[min(300px,88vw)] flex-col gap-2 overflow-hidden rounded-2xl border p-3 shadow-2xl backdrop-blur-xl ${
                isMobile ? "bottom-24 left-4 right-4 top-auto max-h-[48vh] w-auto" : ""
              }`}
              style={{
                background: uiTheme.controlSurface,
                borderColor: uiTheme.cardBorder,
                boxShadow: uiTheme.cardShadow,
                ...(!isMobile
                  ? {
                      left: showLeftPanel ? 228 : 16,
                      top: 72,
                      width: "min(300px, 38vw)",
                    }
                  : {}),
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className="font-[var(--font-headline)] text-base font-semibold leading-tight"
                  style={{ color: uiTheme.textPrimary }}
                >
                  {memory.title}
                </span>
                <button
                  aria-label="Close"
                  className="shrink-0 rounded-full border p-1 cursor-pointer"
                  style={{
                    background: uiTheme.subtleSurface,
                    borderColor: uiTheme.border,
                    color: uiTheme.controlIcon,
                  }}
                  type="button"
                  onClick={() => setMemoryPeekOpen(false)}
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
              <div
                className="max-h-32 w-full overflow-hidden rounded-xl border"
                style={{ borderColor: uiTheme.border, background: uiTheme.subtleSurface }}
              >
                {memory.image ? (
                  <img
                    alt=""
                    className="h-32 w-full object-contain"
                    src={memory.image}
                  />
                ) : (
                  <div
                    className="flex h-32 w-full items-center justify-center"
                    style={{ color: uiTheme.textMuted }}
                  >
                    <span className="material-symbols-outlined text-3xl text-[#e8845a]">
                      add_a_photo
                    </span>
                  </div>
                )}
              </div>
              <div
                className="text-[10px] font-bold uppercase tracking-wider"
                style={{ color: "#e8845a" }}
              >
                {memory.location}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg leading-none">{memory.mood}</span>
                <span className="text-[12px]" style={{ color: uiTheme.textSecondary }}>
                  Mood
                </span>
              </div>
              <div
                className="min-h-0 max-h-28 flex-1 overflow-y-auto text-[12px] leading-snug pr-0.5"
                style={{ color: uiTheme.textPrimary }}
              >
                {memory.story?.trim() ? memory.story : "No story yet."}
              </div>
              <button
                className="mt-1 w-full rounded-xl border py-2 text-[12px] font-semibold cursor-pointer"
                style={{
                  background: uiTheme.subtleSurface,
                  borderColor: uiTheme.border,
                  color: uiTheme.textPrimary,
                }}
                type="button"
                onClick={() => {
                  setMemoryPeekOpen(false);
                  openActiveMemoryForm();
                }}
              >
                Edit in panel
              </button>
            </div>
          </>
        )}
        {/* ── Floating Sidebar (desktop only) ── */}
        {!isMobile && showLeftPanel && (
          <div
            className="absolute left-4 top-4 bottom-4 z-20 w-[200px] rounded-[24px] border border-white/25 py-5 px-4 flex flex-col gap-1.5 shrink-0 shadow-[0_18px_48px_rgba(80,50,32,0.14)] backdrop-blur-[44px]"
            style={{
              background: uiTheme.sidebarBackground(listAccentColor),
              borderColor: uiTheme.panelBorder,
              boxShadow: uiTheme.sidebarShadow,
            }}
          >
            {/* Avatar */}
            <div className="text-center mb-4">
              <div
                className="w-[72px] h-[72px] rounded-full mx-auto mb-2 overflow-hidden border-2"
                style={{ borderColor: uiTheme.panelBorder }}
              >
                <UserAvatar avatarUrl={avatarUrl} name={userName} size={72} />
              </div>
              <div
                className="font-[var(--font-headline)] text-[15px] font-semibold"
                style={{ color: uiTheme.textPrimary }}
              >
                {userName?.trim() || "six cookies"}
              </div>
              <div
                className="text-[11px] mt-0.5"
                style={{ color: uiTheme.textSecondary }}
              >
                Sound · Memory · Map
              </div>
              <label
                className="mt-3 flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-left backdrop-blur-md transition-colors"
                style={{
                  background: uiTheme.controlSurface,
                  borderColor: uiTheme.border,
                }}
              >
                <input
                  aria-label="Search saved resonances and places"
                  className={`w-full min-w-0 bg-transparent border-none outline-none text-[11px] ${
                    isDark
                      ? "text-[#f4eee8] placeholder:text-[#d5cac1]/55"
                      : "text-[#2f2723] placeholder:text-[#4f433d]/60"
                  }`}
                  onChange={(e) => setHistorySearchQuery(e.target.value)}
                  placeholder="Search Memory"
                  type="search"
                  value={historySearchQuery}
                  ref={historySearchInputRef}
                />
                <button
                  aria-label="Search memories"
                  className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full border cursor-pointer"
                  style={{
                    background: uiTheme.subtleSurface,
                    borderColor: uiTheme.border,
                    color: "#e8845a",
                  }}
                  type="button"
                  onClick={() => historySearchInputRef.current?.focus()}
                >
                  <span className="material-symbols-outlined text-base">search</span>
                </button>
              </label>
            </div>

            {/* Nav */}
            <div className="map-sidebar-scroll min-h-0 flex-1 overflow-y-auto -mr-1 pr-1 flex flex-col gap-1.5">
              {visibleHistoryMemories.map((m) => (
                <div
                  key={m.resonanceId != null ? `r-${m.resonanceId}` : `i-${m.index}-${m.title}`}
                  className={`rounded-[14px] ${
                    dropHighlightGlobalIndex === m.index && sidebarReorderEnabled
                      ? "ring-2 ring-[#e8845a]/80"
                      : ""
                  }`}
                  draggable={m.resonanceId != null}
                  onDragStart={(e) => {
                    if (m.resonanceId == null) return;
                    dragSourceGlobalIndexRef.current = m.index;
                    e.dataTransfer.setData("application/x-resonance-id", String(m.resonanceId));
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOver={(e) => {
                    if (!sidebarReorderEnabled) return;
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    setDropHighlightGlobalIndex(m.index);
                  }}
                  onDragLeave={() => setDropHighlightGlobalIndex(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDropHighlightGlobalIndex(null);
                    const from = dragSourceGlobalIndexRef.current;
                    dragSourceGlobalIndexRef.current = null;
                    if (!sidebarReorderEnabled || from == null) return;
                    void applySidebarReorder(from, m.index);
                  }}
                  onDragEnd={() => {
                    dragSourceGlobalIndexRef.current = null;
                    setDropHighlightGlobalIndex(null);
                  }}
                >
                  <button
                    onClick={() => {
                      setSearchPlacePreview(null);
                      setActiveMemory(m.index);
                      setMemoryPeekOpen(true);
                    }}
                    className="flex shrink-0 items-center gap-2.5 py-2.5 px-3.5 rounded-[14px] border-none cursor-pointer text-left w-full transition-colors duration-200 hover:bg-white/[0.12]"
                    style={{
                      background:
                        activeMemory === m.index
                          ? uiTheme.activeMemoryBackground(m.color)
                          : "transparent",
                    }}
                    type="button"
                  >
                    <span
                      className="material-symbols-outlined text-xl shrink-0 cursor-grab active:cursor-grabbing opacity-80"
                      style={{
                        color:
                          activeMemory === m.index
                            ? m.color
                            : uiTheme.controlIcon,
                        fontVariationSettings:
                          activeMemory === m.index ? "'FILL' 1" : "'FILL' 0",
                      }}
                      title="Drag to reorder (clear search) or drop on trash"
                    >
                      drag_indicator
                    </span>
                    <div className="min-w-0">
                      <div
                        className="text-[13px] font-semibold font-[var(--font-body)] truncate"
                        style={{
                          color:
                            activeMemory === m.index
                              ? uiTheme.textPrimary
                              : uiTheme.textSecondary,
                        }}
                      >
                        {m.title}
                      </div>
                      <div
                        className="text-[10px] truncate"
                        style={{ color: uiTheme.textMuted }}
                      >
                        {m.location}
                      </div>
                    </div>
                  </button>
                </div>
              ))}
              {visibleHistoryMemories.length === 0 && (
                <div
                  className="px-3.5 py-3 text-[12px]"
                  style={{ color: uiTheme.textMuted }}
                >
                  No memories found
                </div>
              )}
            </div>

            <div className="shrink-0">
              <button
                aria-label="Collapse left panel"
                className="flex h-9 w-full items-center justify-center rounded-xl border-none bg-transparent cursor-pointer transition-colors duration-150 hover:bg-white/10 active:bg-white/15"
                onClick={() => setShowLeftPanel(false)}
                title="Collapse left panel"
                type="button"
              >
                <span
                  className="material-symbols-outlined text-xl"
                  style={{ color: uiTheme.controlIcon }}
                >
                  chevron_left
                </span>
              </button>
            </div>
          </div>
        )}

        {!isMobile && !showLeftPanel && (
          <button
            aria-label="Expand left panel"
            className="absolute bottom-4 left-4 z-30 flex h-10 w-10 items-center justify-center rounded-full border cursor-pointer backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-transform duration-150 active:scale-95"
            onClick={() => setShowLeftPanel(true)}
            style={{
              background: uiTheme.controlSurface,
              borderColor: uiTheme.border,
            }}
            title="Expand left panel"
            type="button"
          >
            <span
              className="material-symbols-outlined text-xl"
              style={{ color: uiTheme.controlIcon }}
            >
              chevron_right
            </span>
          </button>
        )}

        {/* ── Full Globe ── */}
        <div className="absolute inset-0 overflow-hidden">
          <div
            className="relative h-full min-h-0 overflow-hidden transition-colors duration-300"
            style={{
              background: mapTheme.surfaceBackground,
              boxShadow: mapTheme.surfaceShadow,
            }}
          >
            <div
              className="absolute inset-0 transition-colors duration-300"
              style={{ background: mapTheme.surfaceOverlay }}
            />
            <RealisticGlobe
              activeMemory={activeMemory}
              isDark={isDark}
              isMobile={isMobile}
              memories={globeMemoryPoints}
              searchPlaceFocus={
                searchPlacePreview
                  ? { lat: searchPlacePreview.lat, lng: searchPlacePreview.lng }
                  : null
              }
              onAddMemory={handleAddMemoryFromGlobe}
              onSelectMemory={handleSelectMemoryFromGlobe}
            />
            {isDark && (
              <>
                {NEON_GLOBE_HALOS.map((halo) => (
                  <div
                    key={halo.desktopSize}
                    className="pointer-events-none absolute rounded-full mix-blend-screen"
                    style={{
                      width: isMobile ? halo.mobileSize : halo.desktopSize,
                      aspectRatio: "1",
                      left: isMobile
                        ? "50%"
                        : `calc(50% + ${DESKTOP_HALO_OFFSET_X}px)`,
                      top: HALO_CENTER_Y,
                      transform: "translate(-50%, -50%)",
                      background: halo.background,
                      filter: halo.filter,
                    }}
                  />
                ))}
                <div
                  className="pointer-events-none absolute inset-0 mix-blend-screen"
                  style={{
                    background:
                      "radial-gradient(circle at 52% 46%, rgba(84,240,255,0.22) 0%, transparent 34%), radial-gradient(circle at 47% 43%, rgba(255,72,232,0.14) 0%, transparent 28%), radial-gradient(circle at 56% 57%, rgba(92,117,255,0.14) 0%, transparent 34%)",
                    filter: "blur(10px)",
                  }}
                />
              </>
            )}

            <div
              className={`absolute top-4 right-4 z-10 flex items-center justify-between gap-3 transition-[left] duration-300 ${mapChromeLeftClass}`}
            >
              <div className="relative min-w-[200px] max-w-[min(420px,42vw)]" ref={worldSearchBoxRef}>
                <label
                  className="flex items-center gap-2 min-w-0 rounded-full border px-3.5 py-2 backdrop-blur-md transition-colors"
                  style={{
                    background: uiTheme.controlSurface,
                    borderColor: uiTheme.border,
                  }}
                >
                  <input
                    aria-label="Search any place with Google"
                    autoComplete="off"
                    className={`min-w-0 flex-1 bg-transparent border-none outline-none text-[13px] ${
                      isDark
                        ? "text-[#f4eee8] placeholder:text-[#d5cac1]/55"
                        : "text-[#2f2723] placeholder:text-[#4f433d]/60"
                    }`}
                    placeholder="Search Location"
                    type="search"
                    value={worldSearchText}
                    onChange={(e) => onWorldSearchChange(e.target.value)}
                    onFocus={() =>
                      worldSearchText.trim().length >= 2 &&
                      void runWorldAutocomplete(worldSearchText)
                    }
                    ref={worldSearchInputRef}
                  />
                  <button
                    aria-label="Search locations"
                    className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full border cursor-pointer"
                    style={{
                      background: uiTheme.subtleSurface,
                      borderColor: uiTheme.border,
                      color: "#e8845a",
                    }}
                    type="button"
                    onClick={() => {
                      worldSearchInputRef.current?.focus();
                      if (worldSearchText.trim().length >= 2) void runWorldAutocomplete(worldSearchText);
                    }}
                    title="Search"
                  >
                    <span className="material-symbols-outlined text-lg">search</span>
                  </button>
                </label>
                {worldAcLoading && (
                  <span
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px]"
                    style={{ color: uiTheme.textMuted }}
                  >
                    …
                  </span>
                )}
                {worldAcOpen && worldAcItems.length > 0 && (
                  <ul
                    className="absolute left-0 right-0 top-full z-[80] mt-1 max-h-56 overflow-y-auto rounded-[14px] border py-1 shadow-xl"
                    style={{
                      background: uiTheme.drawerSurface,
                      borderColor: uiTheme.border,
                    }}
                  >
                    {worldAcItems.map((s, idx) => (
                      <li key={`w-${s.placeId ?? "x"}-${idx}`}>
                        <button
                          className="w-full cursor-pointer px-3 py-2.5 text-left text-[12px] leading-snug hover:bg-white/10"
                          style={{ color: isDark ? "#f4eee8" : "#2f2723" }}
                          type="button"
                          onClick={() => void pickWorldPlace(s.placeId, s.description ?? "")}
                        >
                          {s.description}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  aria-label={
                    trashDropActive
                      ? "Release to move to trash"
                      : "Trash — click to open or drag a memory here"
                  }
                  className={`relative w-9 h-9 rounded-full border cursor-pointer flex items-center justify-center backdrop-blur-md transition-[transform,box-shadow] duration-150 active:scale-95 ${
                    trashDropActive ? "scale-110 ring-2 ring-[#e8845a] ring-offset-2" : ""
                  }`}
                  style={{
                    background: trashDropActive ? "rgba(232,132,90,0.22)" : uiTheme.controlSurface,
                    borderColor: uiTheme.border,
                  }}
                  title="Trash"
                  type="button"
                  onClick={() => setTrashPanelOpen(true)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "move";
                    setTrashDropActive(true);
                  }}
                  onDragLeave={() => setTrashDropActive(false)}
                  onDrop={async (e) => {
                    e.preventDefault();
                    setTrashDropActive(false);
                    const raw = e.dataTransfer.getData("application/x-resonance-id");
                    const id = Number(raw);
                    if (!Number.isFinite(id)) return;
                    await softDeleteResonance(id);
                  }}
                >
                  <span
                    className="material-symbols-outlined text-lg"
                    style={{ color: uiTheme.controlIcon }}
                  >
                    delete
                  </span>
                </button>
                <button
                  aria-label={
                    isDark ? "Switch to light mode" : "Switch to dark mode"
                  }
                  className="w-9 h-9 rounded-full border cursor-pointer flex items-center justify-center backdrop-blur-md transition-transform duration-150 active:scale-95"
                  onClick={() => setIsDark((value) => !value)}
                  style={{
                    background: uiTheme.controlSurface,
                    borderColor: uiTheme.border,
                  }}
                  title={isDark ? "Light mode" : "Dark mode"}
                  type="button"
                >
                  <span
                    className="material-symbols-outlined text-lg"
                    style={{
                      color: isDark ? ACCENT : uiTheme.controlIcon,
                      fontVariationSettings: isDark ? "'FILL' 1" : "'FILL' 0",
                    }}
                  >
                    {isDark ? "light_mode" : "dark_mode"}
                  </span>
                </button>
                <button
                  className="w-9 h-9 rounded-full border-none cursor-pointer flex items-center justify-center shadow-[0_4px_16px_rgba(232,132,90,0.35)] transition-transform duration-150 active:scale-95"
                  onClick={openBlankForm}
                  style={{ background: ACCENT }}
                  type="button"
                >
                  <span className="material-symbols-outlined text-lg text-white">
                    add_location_alt
                  </span>
                </button>
                <button
                  className="w-9 h-9 rounded-full border cursor-pointer flex items-center justify-center backdrop-blur-md transition-colors"
                  onClick={onClose}
                  style={{
                    background: uiTheme.controlSurface,
                    borderColor: uiTheme.border,
                  }}
                  type="button"
                >
                  <span
                    className="material-symbols-outlined text-lg"
                    style={{ color: uiTheme.controlIcon }}
                  >
                    close
                  </span>
                </button>
              </div>
            </div>

            <div
              className={`absolute bottom-4 right-4 z-10 transition-[left] duration-300 ${bottomChromeLeftClass}`}
            >
              {showBottomPanel ? (
                <div
                  className="relative rounded-2xl border p-3.5 pr-12 backdrop-blur-xl transition-colors"
                  style={{
                    background: uiTheme.controlSurface,
                    borderColor: uiTheme.cardBorder,
                    boxShadow: uiTheme.cardShadow,
                  }}
                >
                  <button
                    aria-label="Collapse bottom panel"
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border cursor-pointer backdrop-blur-md transition-transform duration-150 active:scale-95"
                    onClick={() => setShowBottomPanel(false)}
                    style={{
                      background: uiTheme.subtleSurface,
                      borderColor: uiTheme.border,
                    }}
                    title="Collapse bottom panel"
                    type="button"
                  >
                    <span
                      className="material-symbols-outlined text-xl"
                      style={{ color: uiTheme.controlIcon }}
                    >
                      keyboard_arrow_down
                    </span>
                  </button>
                  {memory ? (
                    <div className="flex w-[min(92vw,720px)] items-center gap-3">
                      <div className="flex min-w-0 max-w-[min(42vw,260px)] shrink-0 gap-3 sm:max-w-[280px]">
                        <button
                          aria-label={`Update photo for ${memory.title}`}
                          className={`relative h-14 w-14 shrink-0 cursor-pointer overflow-hidden rounded-xl p-0 transition-transform duration-150 active:scale-95 ${memory.image ? "border-0 bg-transparent" : "map-preview-photo-shell"}`}
                          onClick={openActiveMemoryForm}
                          title="Edit memory"
                          type="button"
                        >
                          {memory.image ? (
                            <img
                              src={memory.image}
                              alt={memory.title}
                              className="h-full w-full object-contain"
                            />
                          ) : (
                            <div className="map-preview-photo-fallback flex h-full w-full items-center justify-center">
                              <span className="material-symbols-outlined text-xl text-[#e8845a]">
                                add_a_photo
                              </span>
                            </div>
                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 items-center gap-2">
                            <div
                              className="truncate text-[10px] uppercase tracking-[0.14em] text-[#e8845a] font-bold"
                            >
                              {memory.location}
                            </div>
                            <span
                              aria-label={`Mood: ${memory.mood}`}
                              className="shrink-0 text-[14px] leading-none"
                              title={memory.mood}
                            >
                              {memory.mood}
                            </span>
                          </div>
                          <div
                            className="font-[var(--font-headline)] text-lg font-semibold truncate"
                            style={{ color: uiTheme.textPrimary }}
                          >
                            {memory.title}
                          </div>
                          <div
                            className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs"
                            style={{ color: uiTheme.textMuted }}
                          >
                            <span className="material-symbols-outlined text-sm shrink-0">
                              music_note
                            </span>
                            <span className="min-w-0 flex-1 truncate">
                              {memory.track || "—"} · {memory.artist || "—"}
                            </span>
                            {memory.spotifyTrackId ? (
                              <button
                                className="shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold cursor-pointer"
                                style={{
                                  borderColor: uiTheme.border,
                                  color: ACCENT,
                                  background: uiTheme.subtleSurface,
                                }}
                                type="button"
                                onClick={() =>
                                  setMapBottomPlayerOpen((open) => !open)
                                }
                              >
                                {mapBottomPlayerOpen ? "Hide" : "Play"}
                              </button>
                            ) : null}
                            {isMobile ? (
                              <button
                                aria-label="View story and details"
                                className="shrink-0 rounded-full border px-2 py-0.5 text-[11px] cursor-pointer"
                                style={{
                                  borderColor: uiTheme.border,
                                  color: uiTheme.textSecondary,
                                }}
                                type="button"
                                onClick={() => setMemoryPeekOpen(true)}
                              >
                                Details
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      {/* Spotify embed: same row, fills space between info and collapse — avoids growing panel height */}
                      <div className="flex min-h-[56px] min-w-0 flex-1 items-center justify-stretch">
                        {mapBottomPlayerOpen && memory.spotifyTrackId ? (
                          <div
                            className="relative min-w-0 flex-1 overflow-hidden rounded-xl border shadow-inner"
                            style={{ borderColor: uiTheme.border }}
                          >
                            <iframe
                              title="Spotify"
                              src={`https://open.spotify.com/embed/track/${memory.spotifyTrackId}?utm_source=echo`}
                              width="100%"
                              height={80}
                              className="block max-h-[80px] w-full min-w-[180px]"
                              style={{ border: 0 }}
                              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                              loading="lazy"
                              referrerPolicy="origin-when-cross-origin"
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <p
                      className="m-0 pr-8 text-[13px] leading-snug"
                      style={{ color: uiTheme.textMuted }}
                    >
                      After you sign in, your resonances appear on the globe. Click the globe to add a place, or pick a memory from the left.
                    </p>
                  )}
                </div>
              ) : (
                <button
                  aria-label="Expand bottom panel"
                  className="flex h-10 w-10 items-center justify-center rounded-full border cursor-pointer backdrop-blur-md shadow-[0_8px_24px_rgba(0,0,0,0.2)] transition-transform duration-150 active:scale-95"
                  onClick={() => setShowBottomPanel(true)}
                  style={{
                    background: uiTheme.controlSurface,
                    borderColor: uiTheme.border,
                  }}
                  title="Expand bottom panel"
                  type="button"
                >
                  <span
                    className="material-symbols-outlined text-xl"
                    style={{ color: uiTheme.controlIcon }}
                  >
                    keyboard_arrow_up
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {trashPanelOpen && (
        <div
          className="absolute inset-0 z-[45] flex items-center justify-center p-4"
          onClick={() => setTrashPanelOpen(false)}
        >
          <div
            className="absolute inset-0 bg-black/45"
            aria-hidden
          />
          <div
            className="relative z-10 flex max-h-[min(70vh,520px)] w-[min(400px,94vw)] flex-col overflow-hidden rounded-2xl border p-4 shadow-2xl"
            style={{
              background: uiTheme.drawerSurface,
              borderColor: uiTheme.border,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3
                className="m-0 font-[var(--font-headline)] text-lg font-semibold"
                style={{ color: uiTheme.textPrimary }}
              >
                Trash
              </h3>
              <button
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-full border cursor-pointer"
                style={{
                  background: uiTheme.subtleSurface,
                  borderColor: uiTheme.border,
                  color: uiTheme.controlIcon,
                }}
                type="button"
                onClick={() => setTrashPanelOpen(false)}
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>
            <p className="m-0 mb-3 text-[11px] leading-snug" style={{ color: uiTheme.textMuted }}>
              Restore returns the memory to the sidebar and map. Delete forever removes it from the database.
            </p>
            <div className="map-sidebar-scroll flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
              {trashLoading ? (
                <p className="m-0 text-[12px]" style={{ color: uiTheme.textMuted }}>
                  Loading…
                </p>
              ) : trashItems.length === 0 ? (
                <p className="m-0 text-[12px]" style={{ color: uiTheme.textMuted }}>
                  Trash is empty.
                </p>
              ) : (
                trashItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-wrap items-center gap-2 rounded-xl border p-2.5"
                    style={{ borderColor: uiTheme.border }}
                  >
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-[13px] font-semibold"
                        style={{ color: uiTheme.textPrimary }}
                      >
                        {item.title ?? "Untitled"}
                      </div>
                      <div className="truncate text-[10px]" style={{ color: uiTheme.textMuted }}>
                        {item.placeName ?? "—"}
                      </div>
                    </div>
                    <button
                      className="shrink-0 rounded-lg border px-2 py-1 text-[11px] font-semibold cursor-pointer"
                      style={{
                        borderColor: uiTheme.border,
                        color: uiTheme.textPrimary,
                        background: uiTheme.subtleSurface,
                      }}
                      type="button"
                      onClick={() => void restoreFromTrash(item.id)}
                    >
                      Restore
                    </button>
                    <button
                      className="shrink-0 rounded-lg border px-2 py-1 text-[11px] font-semibold cursor-pointer text-red-400"
                      style={{
                        borderColor: "rgba(248,113,113,0.35)",
                        background: "rgba(248,113,113,0.08)",
                      }}
                      type="button"
                      onClick={() => void purgeFromTrash(item.id)}
                    >
                      Delete forever
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Form Sidebar ── */}
      <div
        className={`absolute inset-0 z-50 overflow-hidden rounded-[inherit] ${showForm ? "pointer-events-auto" : "pointer-events-none"}`}
      >
        <div
          className={`absolute inset-0 rounded-[inherit] ${showForm ? "block" : "hidden"}`}
          onClick={() => setShowForm(false)}
          style={{ background: uiTheme.drawerBackdrop }}
        />
        <aside
          className={`absolute right-0 top-0 bottom-0 z-10 flex min-h-0 w-[min(360px,100%)] flex-col overflow-hidden border-l p-6 backdrop-blur-[56px] transition-transform duration-300 ease-out ${showForm ? "translate-x-0" : "translate-x-full"}`}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: uiTheme.drawerSurface,
            borderColor: uiTheme.border,
            boxShadow: uiTheme.drawerShadow,
          }}
        >
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h3
                className="m-0 font-[var(--font-headline)] text-2xl font-bold"
                style={{ color: uiTheme.textPrimary }}
              >
                Log a Resonance
              </h3>
              <p
                className="mt-1 text-[12px] leading-relaxed"
                style={{ color: uiTheme.textMuted }}
              >
                Capture the sonic imprint of this place.
              </p>
            </div>
            <button
              className="w-9 h-9 rounded-full border cursor-pointer flex items-center justify-center shrink-0 transition-colors"
              onClick={() => setShowForm(false)}
              style={{
                background: uiTheme.subtleSurface,
                borderColor: uiTheme.border,
              }}
              type="button"
            >
              <span
                className="material-symbols-outlined text-lg"
                style={{ color: uiTheme.controlIcon }}
              >
                close
              </span>
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto scrolling-hide px-1">
            <ResonanceForm
              key={draftMemory?.key ?? "blank-memory-form"}
              draft={draftMemory}
              isDark={isDark}
              isMobile={isMobile}
              uiTheme={uiTheme}
              onLibraryTrackPick={handleLibraryTrackPick}
            />
          </div>

          {submitError && (
            <p className="mt-3 mb-0 text-[12px] leading-snug text-red-400 px-0.5">{submitError}</p>
          )}

          <button
            className="mt-5 flex items-center justify-center gap-2 border-none rounded-2xl py-3.5 px-5 text-[13px] font-semibold text-white cursor-pointer shadow-[0_4px_16px_rgba(232,132,90,0.35)] transition-transform duration-150 active:scale-95 disabled:opacity-55 disabled:cursor-not-allowed"
            style={{ background: ACCENT }}
            type="button"
            disabled={submitting}
            onClick={() => void handleSealMemory()}
          >
            <span
              className="material-symbols-outlined text-lg"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              bookmark_add
            </span>
            {submitting ? "Saving…" : "Seal Memory"}
          </button>
        </aside>
      </div>
    </div>
  );
}
