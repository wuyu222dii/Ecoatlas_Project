import { withAuth } from "./client";

export type SpotifyTrackSummary = {
  id: string;
  name: string;
  uri: string | null;
  previewUrl: string | null;
  durationMs: number | null;
  albumName: string | null;
  albumImageUrl: string | null;
  artistsDisplay: string | null;
};

export const spotifyApi = {
  authorizeUrl(
    token: string,
    body: { redirectUri: string; codeChallenge: string; codeChallengeMethod?: string },
  ) {
    return withAuth<{ authorizeUrl: string; state: string }>(
      "/spotify/oauth/authorize-url",
      body,
      token,
    );
  },
  exchange(
    token: string,
    body: { code: string; state: string; codeVerifier: string; redirectUri?: string },
  ) {
    return withAuth<{ connected: boolean }>("/spotify/oauth/exchange", body, token);
  },
  search(token: string, body: { query: string; limit?: number }) {
    return withAuth<{ tracks: SpotifyTrackSummary[] }>("/spotify/search", body, token);
  },
  trackDetail(token: string, body: { trackId: string }) {
    return withAuth<SpotifyTrackSummary>("/spotify/track/detail", body, token);
  },
  tracksByIds(token: string, body: { ids: string[] }) {
    return withAuth<{ tracks: SpotifyTrackSummary[] }>("/spotify/tracks/by-ids", body, token);
  },
};
