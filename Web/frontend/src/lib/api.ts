const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

type LoginData = {
  token: string;
  user: AuthUser;
};

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  avatarUrl: string | null;
  emailVerified: boolean;
};

async function request<T>(path: string, body?: unknown, token?: string): Promise<ApiResponse<T>> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new Error(
      `Cannot reach API at ${API_BASE_URL}. Start the Spring Boot backend (e.g. mvn spring-boot:run from Web/backend) and check VITE_API_BASE_URL in .env.`,
    );
  }

  const json = (await res.json()) as ApiResponse<T>;
  if (json.code !== 200) {
    throw new Error(json.message || "Request failed");
  }
  return json;
}

export function saveToken(token: string) {
  localStorage.setItem("auth_token", token);
}

export function getToken() {
  return localStorage.getItem("auth_token");
}

export function clearToken() {
  localStorage.removeItem("auth_token");
}

const AUTH_USER_KEY = "auth_user";

export function saveAuthUser(user: AuthUser) {
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
}

export function getAuthUser(): AuthUser | null {
  const raw = localStorage.getItem(AUTH_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function clearAuthUser() {
  localStorage.removeItem(AUTH_USER_KEY);
}

export const authApi = {
  sendRegisterCode(email: string) {
    return request<null>("/auth/register/send-code", { email });
  },
  register(email: string, password: string, name: string, code: string) {
    return request<LoginData>("/auth/register", { email, password, name, code });
  },
  login(email: string, password: string) {
    return request<LoginData>("/auth/login", { email, password });
  },
  googleLogin(idToken: string) {
    return request<LoginData>("/auth/google", { idToken });
  },
  me(token: string) {
    return withAuth<AuthUser>("/auth/me", {}, token);
  },
  updateName(token: string, body: { name: string }) {
    return withAuth<AuthUser>("/auth/profile/name", body, token);
  },
  updateAvatar(token: string, body: { avatarUrl: string }) {
    return withAuth<AuthUser>("/auth/profile/avatar", body, token);
  },
  sendForgotCode(email: string) {
    return request<null>("/auth/forgot-password/send-code", { email });
  },
  resetPassword(email: string, code: string, newPassword: string) {
    return request<null>("/auth/forgot-password/reset", { email, code, newPassword });
  },
};

// --- Spotify / Library / AI (EchoAtlas backend; all POST + JWT) ---

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

function withAuth<T>(path: string, body: unknown, token: string) {
  return request<T>(path, body, token);
}

export const spotifyApi = {
  authorizeUrl(
    token: string,
    body: { redirectUri: string; codeChallenge: string; codeChallengeMethod?: string },
  ) {
    return withAuth<{ authorizeUrl: string; state: string }>("/spotify/oauth/authorize-url", body, token);
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
  /** Batch fetch by Spotify track id (max 50); used for the demo playlists. */
  tracksByIds(token: string, body: { ids: string[] }) {
    return withAuth<{ tracks: SpotifyTrackSummary[] }>("/spotify/tracks/by-ids", body, token);
  },
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
  resolveTracks(
    token: string,
    body: { items: { title?: string; artist?: string }[] },
  ) {
    return withAuth<{ items: AiResolvedTrackItem[] }>("/ai/resolve-tracks", body, token);
  },
};

// --- Resonance / map (EchoAtlas backend; POST + JWT) ---

export type ResonancePlaceDto = {
  placeName: string | null;
  address: string | null;
  latitude: string | null;
  longitude: string | null;
  googlePlaceId: string | null;
};

export type ResonanceTrackDto = {
  spotifyTrackId: string | null;
  spotifyUri: string | null;
  trackName: string | null;
  artistNames: string | null;
  albumName: string | null;
  imageUrl: string | null;
};

export type ResonanceResponseDto = {
  id: number;
  title: string | null;
  mood: string | null;
  story: string | null;
  imageUrl: string | null;
  visibility: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  place: ResonancePlaceDto | null;
  track: ResonanceTrackDto | null;
};

export type ResonanceListItemDto = {
  id: number;
  title: string | null;
  mood: string | null;
  story: string | null;
  imageUrl: string | null;
  visibility: string | null;
  placeName: string | null;
  trackName: string | null;
  createdAt: string | null;
  /** Backend includes these on `/resonance/list` so the map avoids N× `/resonance/detail`. */
  place?: ResonancePlaceDto | null;
  track?: ResonanceTrackDto | null;
};

export type ResonancePageDto = {
  content: ResonanceListItemDto[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
};

export type PlaceAutocompleteSuggestionDto = {
  placeId: string | null;
  description: string | null;
};

export const resonanceApi = {
  create(
    token: string,
    body: {
      title?: string;
      mood?: string;
      story?: string;
      imageUrl?: string;
      visibility?: string;
    },
  ) {
    return withAuth<ResonanceResponseDto>("/resonance/create", body, token);
  },
  detail(token: string, body: { resonanceId: number }) {
    return withAuth<ResonanceResponseDto>("/resonance/detail", body, token);
  },
  list(
    token: string,
    body: { page?: number; size?: number; q?: string },
  ) {
    return withAuth<ResonancePageDto>("/resonance/list", body, token);
  },
  update(
    token: string,
    body: {
      resonanceId: number;
      title?: string;
      mood?: string;
      story?: string;
      imageUrl?: string;
      visibility?: string;
    },
  ) {
    return withAuth<ResonanceResponseDto>("/resonance/update", body, token);
  },
  /** Map modal: create/update + place + Spotify in one request; response matches detail. */
  commitMapMemory(
    token: string,
    body: {
      resonanceId?: number;
      title: string;
      mood: string;
      story?: string;
      imageUrl?: string;
      visibility?: string;
      placeName?: string;
      latitude: number;
      longitude: number;
      spotifyTrackId?: string;
      unbindSpotify?: boolean;
      fallbackTrackQuery?: string;
    },
  ) {
    return withAuth<ResonanceResponseDto>("/resonance/map/commit", body, token);
  },
  delete(token: string, body: { resonanceId: number }) {
    return withAuth<null>("/resonance/delete", body, token);
  },
  upsertPlace(
    token: string,
    body: {
      resonanceId: number;
      resolveFromGooglePlaceId?: boolean;
      placeName?: string;
      address?: string;
      latitude?: number;
      longitude?: number;
      googlePlaceId?: string;
    },
  ) {
    return withAuth<ResonancePlaceDto>("/resonance/place/upsert", body, token);
  },
  resolvePlace(token: string, body: { googlePlaceId: string }) {
    return withAuth<ResonancePlaceDto>("/resonance/place/resolve", body, token);
  },
  autocompletePlace(token: string, body: { input: string }) {
    return withAuth<PlaceAutocompleteSuggestionDto[]>(
      "/resonance/place/autocomplete",
      body,
      token,
    );
  },
  bindTrack(token: string, body: { resonanceId: number; spotifyTrackId: string }) {
    return withAuth<ResonanceTrackDto>("/resonance/track/bind", body, token);
  },
  unbindTrack(token: string, body: { resonanceId: number }) {
    return withAuth<null>("/resonance/track/unbind", body, token);
  },
  /** Recycle bin listing (soft-deleted resonances) */
  trashList(token: string) {
    return withAuth<ResonanceListItemDto[]>("/resonance/trash/list", {}, token);
  },
  restore(token: string, body: { resonanceId: number }) {
    return withAuth<ResonanceResponseDto>("/resonance/restore", body, token);
  },
  /** Permanent delete (must be in trash first) */
  purge(token: string, body: { resonanceId: number }) {
    return withAuth<null>("/resonance/purge", body, token);
  },
  reorder(token: string, body: { orderedResonanceIds: number[] }) {
    return withAuth<null>("/resonance/reorder", body, token);
  },
};
