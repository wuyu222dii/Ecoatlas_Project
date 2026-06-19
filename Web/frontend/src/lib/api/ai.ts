import { withAuth } from "./client";
import type { SpotifyTrackSummary } from "./spotify";

export type AiRecommendTrackDto = {
  title: string | null;
  artist: string | null;
  album: string | null;
  note: string | null;
};

export type AiRecommendResponse = {
  summary: string | null;
  tracks: AiRecommendTrackDto[];
  artists: { name?: string; note?: string }[];
  playlistTitle: string | null;
  playlistDescription: string | null;
};

export type AiResolvedTrackItem = {
  requestedTitle: string | null;
  requestedArtist: string | null;
  matched: boolean | null;
  matchNote: string | null;
  spotify: SpotifyTrackSummary | null;
};

export const aiApi = {
  recommend(
    token: string,
    body: {
      userMessage: string;
      mode?: "TRACKS" | "ARTISTS" | "PLAYLIST_IDEA" | "MIXED";
      maxItems?: number;
      pageScene?: string;
      locale?: string;
    },
  ) {
    return withAuth<AiRecommendResponse>("/ai/recommend", body, token);
  },
  resolveTracks(token: string, body: { items: { title?: string; artist?: string }[] }) {
    return withAuth<{ items: AiResolvedTrackItem[] }>("/ai/resolve-tracks", body, token);
  },
};
