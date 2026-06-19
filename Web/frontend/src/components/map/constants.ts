export const MOOD_OPTIONS = [
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
export const DEFAULT_MOOD = MOOD_OPTIONS[0].value;
export const LEGACY_MOOD_MAP: Record<string, string> = {
  "🌙": "😌",
  "🌅": "😊",
  "🌧️": "☹️",
  "🕹️": "😄",
  "🌊": "😌",
  "🔥": "😠",
  "✨": "🥹",
};
export function normalizeMood(mood?: string | null) {
  const value = mood?.trim();
  if (!value) return DEFAULT_MOOD;
  if (MOOD_OPTIONS.some((option) => option.value === value)) return value;
  return LEGACY_MOOD_MAP[value] ?? DEFAULT_MOOD;
};


export const ACCENT = "#e8845a";
const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;
/** Invalid colors from react-globe / three become null and crash opacity animation */
export function safeMarkerHex(c: string | undefined): string {
  return typeof c === "string" && HEX_COLOR_RE.test(c.trim()) ? c.trim() : ACCENT;
}
export const MEMORY_FORM_ID = "map-resonance-form";
export const COUNTRIES_GEOJSON_URL =
  "https://cdn.jsdelivr.net/npm/three-globe/example/country-polygons/ne_110m_admin_0_countries.geojson";
export const DESKTOP_GLOBE_OFFSET_X = 72;
export const DESKTOP_HALO_OFFSET_X = 54;
export const HALO_CENTER_Y = "49%";
export const DESKTOP_GLOBE_ALTITUDE = 1.95;
export const MOBILE_GLOBE_ALTITUDE = 3.25;

export const withAlpha = (color: string, alpha: string) => `${safeMarkerHex(color)}${alpha}`;
export const LIGHT_REGION_COLORS = [
  "#e8845a",
  "#6fa18f",
  "#8a7fd0",
  "#d9a441",
  "#6796be",
];
export const DARK_REGION_COLORS = [
  "#ff5ce0",
  "#3ce8ff",
  "#9f6dff",
  "#ffd670",
  "#3a8eff",
];
export const MAP_VISUALS = {
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
export const UI_VISUALS = {
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

export const NEON_GLOBE_HALOS = [
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

export const SEARCH_PLACE_PREVIEW_INDEX = -1;
