import { withAuth } from "./client";

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
  list(token: string, body: { page?: number; size?: number; q?: string }) {
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
  trashList(token: string) {
    return withAuth<ResonanceListItemDto[]>("/resonance/trash/list", {}, token);
  },
  restore(token: string, body: { resonanceId: number }) {
    return withAuth<ResonanceResponseDto>("/resonance/restore", body, token);
  },
  purge(token: string, body: { resonanceId: number }) {
    return withAuth<null>("/resonance/purge", body, token);
  },
  reorder(token: string, body: { orderedResonanceIds: number[] }) {
    return withAuth<null>("/resonance/reorder", body, token);
  },
};
