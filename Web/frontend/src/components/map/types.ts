import type { ResonanceResponseDto } from "@/lib/api";
import { UI_VISUALS } from "./constants";

export type PolaroidMeta = {
  caption: string;
  rotate: number;
};

export type MemoryData = {
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

export type GlobeCoords = {
  lat: number;
  lng: number;
  altitude?: number;
};

export type MemoryFormDraft = {
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

export type UiVisuals = (typeof UI_VISUALS)["light"];

export type MemoryPoint = MemoryData & { index: number };

export type MemoryArc = {
  startLat: number;
  startLng: number;
  endLat: number;
  endLng: number;
  color: string;
  index: number;
};

export interface CountryFeature {
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

/** List rows and detail responses share the fields needed for map markers. */
export type ResonanceMapSource = Pick<
  ResonanceResponseDto,
  "id" | "title" | "mood" | "story" | "imageUrl" | "createdAt"
> &
  Pick<Partial<ResonanceResponseDto>, "place" | "track">;

export interface MapModalProps {
  visible: boolean;
  onClose?: () => void;
  userName?: string;
  avatarUrl?: string | null;
}
