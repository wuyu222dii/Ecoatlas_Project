export { API_BASE_URL, request, withAuth, type ApiResponse } from "./client";

export {
  authApi,
  clearAuthUser,
  clearToken,
  getAuthUser,
  getToken,
  saveAuthUser,
  saveToken,
  type AuthUser,
} from "./auth";

export { spotifyApi, type SpotifyTrackSummary } from "./spotify";

export { libraryApi, type SavedTrackResponse } from "./library";

export {
  aiApi,
  type AiRecommendResponse,
  type AiRecommendTrackDto,
  type AiResolvedTrackItem,
} from "./ai";

export {
  resonanceApi,
  type PlaceAutocompleteSuggestionDto,
  type ResonanceListItemDto,
  type ResonancePageDto,
  type ResonancePlaceDto,
  type ResonanceResponseDto,
  type ResonanceTrackDto,
} from "./resonance";
