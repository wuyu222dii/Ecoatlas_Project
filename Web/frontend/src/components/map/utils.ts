import type { ResonanceResponseDto } from "@/lib/api";
import {
  DEFAULT_MOOD,
  DARK_REGION_COLORS,
  LIGHT_REGION_COLORS,
  normalizeMood,
  safeMarkerHex,
  withAlpha,
} from "./constants";
import type {
  CountryFeature,
  GlobeCoords,
  MemoryData,
  MemoryFormDraft,
  MemoryPoint,
  ResonanceMapSource,
} from "./types";

const formatCoord = (value: number) => value.toFixed(4);

export const getRegionColor = (country: CountryFeature, isDark: boolean) => {
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

export const normalizeCoords = (coords: object): GlobeCoords | null => {
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

export const stopClickPropagation = (event: object | undefined) => {
  const maybeEvent = event as { stopPropagation?: () => void } | undefined;
  maybeEvent?.stopPropagation?.();
};
export const stopMarkerEvent = (event: Event) => {
  event.stopPropagation();
};

export const createDraftFromCoords = (
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

export const createDraftFromMemory = (memory: MemoryData): MemoryFormDraft => {
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

export const createDraftFromSearchPreview = (p: {
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

export function resonanceRowToMemory(r: ResonanceMapSource, index: number): MemoryData | null {
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
export function applyDetailToMemoriesState(
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

export const createPolaroidMarker = (
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
