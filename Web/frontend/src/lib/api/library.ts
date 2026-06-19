import { withAuth } from "./client";

export type SavedTrackResponse = {
  id: number;
  spotifyTrackId: string;
  source: string | null;
  trackName: string | null;
  artistNames: string | null;
  albumName: string | null;
  imageUrl: string | null;
  previewUrl: string | null;
  durationMs: number | null;
  spotifyUri: string | null;
  createdAt: string | null;
};

export const libraryApi = {
  save(token: string, body: { spotifyTrackId: string; source?: string }) {
    return withAuth<SavedTrackResponse>("/library/tracks/save", body, token);
  },
  remove(token: string, body: { spotifyTrackId: string }) {
    return withAuth<null>("/library/tracks/remove", body, token);
  },
  list(token: string, body: { page?: number; size?: number }) {
    return withAuth<{
      content: SavedTrackResponse[];
      totalElements: number;
      totalPages: number;
      page: number;
      size: number;
    }>("/library/tracks/list", body, token);
  },
};
