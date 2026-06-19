import type { AiRecommendTrackDto } from "@/lib/api";

export type PlayerType = "study" | "party" | "sports" | "headphones";


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

export type RepeatMode = "none" | "all" | "one";
export type Msg = { role: "user" | "ai"; text: string };
export type TabKey = "favorites" | "main" | "ai";

export type HeadphonesListeningMode = "late_night_radio" | "warm_cafe_jazz" | "cinematic_ambient";

export type CuratedCacheEntry = {
  at: number;
  tracks: UiTrack[];
  /** True after user clicks Refresh picks; list stays until the next refresh. */
  refreshPinned?: boolean;
  /** Which headphone Listening style produced this list (headphones player only). */
  headphonesListeningMode?: HeadphonesListeningMode;
};

export type AiSessionState = {
  msgs: Msg[];
  lastItems: AiRecommendTrackDto[];
  input: string;
};
