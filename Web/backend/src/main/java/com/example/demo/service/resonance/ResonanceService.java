package com.example.demo.service.resonance;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.dto.request.resonance.*;
import com.example.demo.dto.request.spotify.SpotifySearchRequest;
import com.example.demo.dto.request.spotify.SpotifyTrackDetailRequest;
import com.example.demo.dto.response.resonance.*;
import com.example.demo.dto.response.spotify.SpotifyTrackSummary;
import com.example.demo.model.Resonance;
import com.example.demo.model.ResonancePlace;
import com.example.demo.model.ResonanceSpotify;
import com.example.demo.cache.ResonanceListCacheEvictor;
import com.example.demo.repository.ResonanceListSummaryProjection;
import com.example.demo.repository.ResonancePlaceRepository;
import com.example.demo.repository.ResonanceRepository;
import com.example.demo.repository.ResonanceSpotifyRepository;
import com.example.demo.service.maps.GooglePlacesService;
import com.example.demo.service.spotify.SpotifyAccountService;
import com.example.demo.service.spotify.SpotifyCatalogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ResonanceService {

    private final ResonanceRepository resonanceRepository;
    private final ResonancePlaceRepository resonancePlaceRepository;
    private final ResonanceSpotifyRepository resonanceSpotifyRepository;
    private final SpotifyAccountService spotifyAccountService;
    private final SpotifyCatalogService spotifyCatalogService;
    private final GooglePlacesService googlePlacesService;
    private final ResonanceListCacheEvictor resonanceListCacheEvictor;

    @Transactional
    public ResonanceResponse create(Long userId, ResonanceCreateRequest request) {
        int nextOrder = resonanceRepository.findMaxListOrderForActiveUser(userId) + 1;
        Resonance resonance = Resonance.builder()
                .userId(userId)
                .title(request.getTitle())
                .mood(request.getMood())
                .story(request.getStory())
                .imageUrl(request.getImageUrl())
                .visibility(request.getVisibility() != null ? request.getVisibility() : "PRIVATE")
                .listOrder(nextOrder)
                .build();
        resonanceRepository.save(resonance);
        resonanceListCacheEvictor.evictAllPagesForUser(userId);
        return toResponse(resonance, null, null);
    }

    public ResonanceResponse detail(Long userId, ResonanceIdRequest request) {
        Resonance resonance = requireActiveResonance(userId, request.getResonanceId());
        ResonancePlace place = resonancePlaceRepository.findByResonanceId(resonance.getId()).orElse(null);
        ResonanceSpotify track = resonanceSpotifyRepository.findByResonanceId(resonance.getId()).orElse(null);
        return toResponse(resonance, place, track);
    }

    @Cacheable(
            cacheNames = ResonanceListCacheEvictor.CACHE_ACTIVE_LISTS,
            keyGenerator = "resonanceListKeyGenerator",
            sync = true)
    public ResonancePageResponse list(Long userId, ResonanceListRequest request) {
        PageRequest pageRequest = PageRequest.of(request.getPage(), request.getSize());
        Page<ResonanceListSummaryProjection> page;
        if (request.getQ() == null || request.getQ().isBlank()) {
            page = resonanceRepository.findActiveListSummaryByUser(userId, pageRequest);
        } else {
            page = resonanceRepository.searchActiveListSummaryByUser(userId, request.getQ().trim(), pageRequest);
        }
        List<ResonanceListSummaryProjection> content = page.getContent();
        List<Long> ids = content.stream().map(ResonanceListSummaryProjection::getId).toList();
        Map<Long, ResonancePlace> placeByResonance = loadPlacesByResonanceIds(ids);
        Map<Long, ResonanceSpotify> trackByResonance = loadTracksByResonanceIds(ids);
        List<ResonanceListItemResponse> items = content.stream()
                .map(r -> toListItemForActiveList(r, placeByResonance.get(r.getId()), trackByResonance.get(r.getId())))
                .toList();
        return ResonancePageResponse.builder()
                .content(items)
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .page(request.getPage())
                .size(request.getSize())
                .build();
    }

    @Transactional
    public ResonanceResponse update(Long userId, ResonanceUpdateRequest request) {
        Resonance resonance = requireActiveResonance(userId, request.getResonanceId());
        /*
         * Partial update: JSON omitted fields deserialize as null in Jackson; setting those on the
         * entity would clear DB columns. Clients often omit optional strings (e.g. empty story).
         */
        if (request.getTitle() != null) {
            resonance.setTitle(request.getTitle());
        }
        if (request.getMood() != null) {
            resonance.setMood(request.getMood());
        }
        if (request.getStory() != null) {
            resonance.setStory(request.getStory());
        }
        if (request.getImageUrl() != null) {
            resonance.setImageUrl(request.getImageUrl());
        }
        if (request.getVisibility() != null) {
            resonance.setVisibility(request.getVisibility());
        }
        resonanceRepository.save(resonance);
        resonanceListCacheEvictor.evictAllPagesForUser(userId);
        ResonancePlace place = resonancePlaceRepository.findByResonanceId(resonance.getId()).orElse(null);
        ResonanceSpotify track = resonanceSpotifyRepository.findByResonanceId(resonance.getId()).orElse(null);
        return toResponse(resonance, place, track);
    }

    /**
     * Map UI: one request — save resonance + place + best-effort Spotify (same failure tolerance as the old
     * multi-step client flow). Returns the same shape as {@link #detail}.
     */
    @Transactional
    public ResonanceResponse commitMapMemory(Long userId, ResonanceMapCommitRequest request) {
        final Long resonanceId;
        if (request.getResonanceId() == null) {
            int nextOrder = resonanceRepository.findMaxListOrderForActiveUser(userId) + 1;
            Resonance resonance = Resonance.builder()
                    .userId(userId)
                    .title(request.getTitle())
                    .mood(request.getMood())
                    .story(request.getStory())
                    .imageUrl(request.getImageUrl())
                    .visibility(request.getVisibility() != null ? request.getVisibility() : "PRIVATE")
                    .listOrder(nextOrder)
                    .build();
            resonanceRepository.save(resonance);
            resonanceListCacheEvictor.evictAllPagesForUser(userId);
            resonanceId = resonance.getId();
        } else {
            Resonance resonance = requireActiveResonance(userId, request.getResonanceId());
            resonanceId = resonance.getId();
            if (request.getTitle() != null) {
                resonance.setTitle(request.getTitle());
            }
            if (request.getMood() != null) {
                resonance.setMood(request.getMood());
            }
            if (request.getStory() != null) {
                resonance.setStory(request.getStory());
            }
            if (request.getImageUrl() != null) {
                resonance.setImageUrl(request.getImageUrl());
            }
            if (request.getVisibility() != null) {
                resonance.setVisibility(request.getVisibility());
            }
            resonanceRepository.save(resonance);
            resonanceListCacheEvictor.evictAllPagesForUser(userId);
        }

        ResonancePlaceUpsertRequest placeUpsert = new ResonancePlaceUpsertRequest();
        placeUpsert.setResonanceId(resonanceId);
        placeUpsert.setPlaceName(request.getPlaceName());
        placeUpsert.setLatitude(request.getLatitude());
        placeUpsert.setLongitude(request.getLongitude());
        upsertPlace(userId, placeUpsert);

        syncSpotifyForMapCommitBestEffort(userId, resonanceId, request);

        ResonanceIdRequest idReq = new ResonanceIdRequest();
        idReq.setResonanceId(resonanceId);
        return detail(userId, idReq);
    }

    private void syncSpotifyForMapCommitBestEffort(
            Long userId, Long resonanceId, ResonanceMapCommitRequest request) {
        String pickedId = request.getSpotifyTrackId();
        if (pickedId != null && !pickedId.isBlank()) {
            try {
                ResonanceTrackBindRequest bind = new ResonanceTrackBindRequest();
                bind.setResonanceId(resonanceId);
                bind.setSpotifyTrackId(pickedId.trim());
                bindTrack(userId, bind);
            } catch (Exception ex) {
                log.debug("Map commit: Spotify bind skipped: {}", ex.getMessage());
            }
            return;
        }
        if (Boolean.TRUE.equals(request.getUnbindSpotify())) {
            try {
                ResonanceIdRequest idReq = new ResonanceIdRequest();
                idReq.setResonanceId(resonanceId);
                unbindTrack(userId, idReq);
            } catch (Exception ex) {
                log.debug("Map commit: Spotify unbind skipped: {}", ex.getMessage());
            }
            return;
        }
        String q = request.getFallbackTrackQuery();
        if (q == null || q.isBlank()) {
            return;
        }
        try {
            SpotifySearchRequest sr = new SpotifySearchRequest();
            sr.setQuery(q.trim());
            sr.setLimit(1);
            var search = spotifyCatalogService.searchTracks(userId, sr);
            if (search.getTracks() == null || search.getTracks().isEmpty()) {
                return;
            }
            String id = search.getTracks().get(0).getId();
            if (id == null || id.isBlank()) {
                return;
            }
            ResonanceTrackBindRequest bind = new ResonanceTrackBindRequest();
            bind.setResonanceId(resonanceId);
            bind.setSpotifyTrackId(id);
            bindTrack(userId, bind);
        } catch (Exception ex) {
            log.debug("Map commit: Spotify search/bind skipped: {}", ex.getMessage());
        }
    }

    /**
     * Move to recycle bin (soft delete).
     */
    @Transactional
    public void delete(Long userId, ResonanceIdRequest request) {
        Resonance resonance = requireActiveResonance(userId, request.getResonanceId());
        resonance.setDeletedAt(Instant.now());
        resonanceRepository.save(resonance);
        resonanceListCacheEvictor.evictAllPagesForUser(userId);
    }

    public List<ResonanceListItemResponse> listTrash(Long userId) {
        List<ResonanceListSummaryProjection> rows = resonanceRepository.findTrashListSummaryByUser(userId);
        List<Long> ids = rows.stream().map(ResonanceListSummaryProjection::getId).toList();
        Map<Long, ResonancePlace> placeByResonance = loadPlacesByResonanceIds(ids);
        Map<Long, ResonanceSpotify> trackByResonance = loadTracksByResonanceIds(ids);
        return rows.stream()
                .map(r -> toListItemForTrash(r, placeByResonance.get(r.getId()), trackByResonance.get(r.getId())))
                .toList();
    }

    @Transactional
    public ResonanceResponse restore(Long userId, ResonanceIdRequest request) {
        Resonance resonance = requireOwnedResonance(userId, request.getResonanceId());
        if (resonance.getDeletedAt() == null) {
            throw new BusinessException(400, "Resonance is not in trash");
        }
        resonance.setDeletedAt(null);
        int nextOrder = resonanceRepository.findMaxListOrderForActiveUser(userId) + 1;
        resonance.setListOrder(nextOrder);
        resonanceRepository.save(resonance);
        resonanceListCacheEvictor.evictAllPagesForUser(userId);
        ResonancePlace place = resonancePlaceRepository.findByResonanceId(resonance.getId()).orElse(null);
        ResonanceSpotify track = resonanceSpotifyRepository.findByResonanceId(resonance.getId()).orElse(null);
        return toResponse(resonance, place, track);
    }

    @Transactional
    public void purge(Long userId, ResonanceIdRequest request) {
        Resonance resonance = requireOwnedResonance(userId, request.getResonanceId());
        if (resonance.getDeletedAt() == null) {
            throw new BusinessException(400, "Move to trash before permanent delete");
        }
        resonanceRepository.delete(resonance);
        resonanceListCacheEvictor.evictAllPagesForUser(userId);
    }

    @Transactional
    public void reorder(Long userId, ResonanceReorderRequest request) {
        List<Long> orderedIds = request.getOrderedResonanceIds();
        List<Resonance> active = resonanceRepository.findAllActiveByUserIdOrderByListOrder(userId);
        Set<Long> expected = new HashSet<>();
        for (Resonance r : active) {
            expected.add(r.getId());
        }
        if (orderedIds.size() != expected.size() || !expected.equals(new HashSet<>(orderedIds))) {
            throw new BusinessException(400, "Reorder list must include every active resonance exactly once");
        }
        for (int i = 0; i < orderedIds.size(); i++) {
            Long id = orderedIds.get(i);
            Resonance r = requireActiveResonance(userId, id);
            r.setListOrder(i);
            resonanceRepository.save(r);
        }
        resonanceListCacheEvictor.evictAllPagesForUser(userId);
    }

    public ResonancePlaceResponse resolvePlaceFromGoogle(Long userId, ResonancePlaceResolveRequest request) {
        if (userId == null) {
            throw new BusinessException(401, "Unauthorized");
        }
        GooglePlacesService.ResolvedGooglePlace resolved = googlePlacesService.resolveByPlaceId(request.getGooglePlaceId());
        return ResonancePlaceResponse.builder()
                .placeName(resolved.placeName())
                .address(resolved.formattedAddress())
                .latitude(resolved.latitude().toPlainString())
                .longitude(resolved.longitude().toPlainString())
                .googlePlaceId(resolved.googlePlaceId())
                .build();
    }

    public List<PlaceAutocompleteSuggestionResponse> autocompletePlaces(
            Long userId, ResonancePlaceAutocompleteRequest request) {
        if (userId == null) {
            throw new BusinessException(401, "Unauthorized");
        }
        return googlePlacesService.autocompletePredictions(request.getInput()).stream()
                .map(item -> PlaceAutocompleteSuggestionResponse.builder()
                        .placeId(item.placeId())
                        .description(item.description())
                        .build())
                .toList();
    }

    @Transactional
    public ResonancePlaceResponse upsertPlace(Long userId, ResonancePlaceUpsertRequest request) {
        Resonance resonance = requireActiveResonance(userId, request.getResonanceId());
        BigDecimal lat = request.getLatitude();
        BigDecimal lng = request.getLongitude();
        String placeId = request.getGooglePlaceId();
        String placeName = request.getPlaceName();
        String address = request.getAddress();

        if (Boolean.TRUE.equals(request.getResolveFromGooglePlaceId())) {
            if (placeId == null || placeId.isBlank()) {
                throw new BusinessException(400, "googlePlaceId is required when resolveFromGooglePlaceId is true");
            }
            GooglePlacesService.ResolvedGooglePlace resolved = googlePlacesService.resolveByPlaceId(placeId);
            lat = resolved.latitude();
            lng = resolved.longitude();
            if (placeName == null || placeName.isBlank()) {
                placeName = resolved.placeName();
            }
            if (address == null || address.isBlank()) {
                address = resolved.formattedAddress();
            }
            placeId = resolved.googlePlaceId();
        } else {
            if (lat == null || lng == null) {
                throw new BusinessException(400, "latitude and longitude are required unless resolveFromGooglePlaceId is true");
            }
        }

        ResonancePlace place = resonancePlaceRepository.findByResonanceId(resonance.getId())
                .orElseGet(() -> ResonancePlace.builder().resonanceId(resonance.getId()).build());
        place.setPlaceName(placeName);
        place.setAddress(address);
        place.setLatitude(lat);
        place.setLongitude(lng);
        place.setGooglePlaceId(placeId);
        resonancePlaceRepository.save(place);
        resonanceListCacheEvictor.evictAllPagesForUser(userId);
        return toPlaceResponse(place);
    }

    @Transactional
    public ResonanceTrackResponse bindTrack(Long userId, ResonanceTrackBindRequest request) {
        Resonance resonance = requireActiveResonance(userId, request.getResonanceId());
        spotifyAccountService.requireConnection(userId);

        SpotifyTrackDetailRequest detailRequest = new SpotifyTrackDetailRequest();
        detailRequest.setTrackId(request.getSpotifyTrackId());
        SpotifyTrackSummary trackMeta = spotifyCatalogService.getTrack(userId, detailRequest);

        ResonanceSpotify track = resonanceSpotifyRepository.findByResonanceId(resonance.getId())
                .orElseGet(() -> ResonanceSpotify.builder().resonanceId(resonance.getId()).build());
        track.setSpotifyTrackId(request.getSpotifyTrackId());
        track.setSpotifyUri(trackMeta.getUri());
        track.setTrackName(trackMeta.getName());
        track.setArtistNames(trackMeta.getArtistsDisplay());
        track.setAlbumName(trackMeta.getAlbumName());
        track.setImageUrl(trackMeta.getAlbumImageUrl());
        resonanceSpotifyRepository.save(track);
        resonanceListCacheEvictor.evictAllPagesForUser(userId);
        return toTrackResponse(track);
    }

    @Transactional
    public void unbindTrack(Long userId, ResonanceIdRequest request) {
        Resonance resonance = requireActiveResonance(userId, request.getResonanceId());
        resonanceSpotifyRepository.findByResonanceId(resonance.getId())
                .ifPresent(resonanceSpotifyRepository::delete);
        resonanceListCacheEvictor.evictAllPagesForUser(userId);
    }

    private Resonance requireOwnedResonance(Long userId, Long resonanceId) {
        return resonanceRepository.findByIdAndUserId(resonanceId, userId)
                .orElseThrow(() -> new BusinessException(404, "Resonance not found"));
    }

    private Resonance requireActiveResonance(Long userId, Long resonanceId) {
        Resonance r = requireOwnedResonance(userId, resonanceId);
        if (r.getDeletedAt() != null) {
            throw new BusinessException(404, "Resonance not found");
        }
        return r;
    }

    private ResonanceResponse toResponse(Resonance resonance, ResonancePlace place, ResonanceSpotify track) {
        return ResonanceResponse.builder()
                .id(resonance.getId())
                .title(resonance.getTitle())
                .mood(resonance.getMood())
                .story(resonance.getStory())
                .imageUrl(resonance.getImageUrl())
                .visibility(resonance.getVisibility())
                .createdAt(resonance.getCreatedAt().atOffset(ZoneOffset.UTC).toString())
                .updatedAt(resonance.getUpdatedAt().atOffset(ZoneOffset.UTC).toString())
                .place(toPlaceResponse(place))
                .track(toTrackResponse(track))
                .build();
    }

    private Map<Long, ResonancePlace> loadPlacesByResonanceIds(List<Long> resonanceIds) {
        if (resonanceIds.isEmpty()) {
            return Map.of();
        }
        return resonancePlaceRepository.findAllByResonanceIdIn(resonanceIds).stream()
                .collect(Collectors.toMap(ResonancePlace::getResonanceId, Function.identity(), (a, b) -> a));
    }

    private Map<Long, ResonanceSpotify> loadTracksByResonanceIds(List<Long> resonanceIds) {
        if (resonanceIds.isEmpty()) {
            return Map.of();
        }
        return resonanceSpotifyRepository.findAllByResonanceIdIn(resonanceIds).stream()
                .collect(Collectors.toMap(ResonanceSpotify::getResonanceId, Function.identity(), (a, b) -> a));
    }

    /** Active list: full fields expected by map client (same JSON shape as before perf work). */
    private ResonanceListItemResponse toListItemForActiveList(
            ResonanceListSummaryProjection row, ResonancePlace place, ResonanceSpotify track) {
        return ResonanceListItemResponse.builder()
                .id(row.getId())
                .title(row.getTitle())
                .mood(row.getMood())
                .story(row.getStory())
                .imageUrl(row.getImageUrl())
                .visibility(row.getVisibility())
                .placeName(place != null ? place.getPlaceName() : null)
                .trackName(track != null ? track.getTrackName() : null)
                .createdAt(row.getCreatedAt().atOffset(ZoneOffset.UTC).toString())
                .place(toPlaceResponse(place))
                .track(toTrackResponse(track))
                .build();
    }

    /** Trash sidebar: title + place line only; omit heavy fields and nested objects. */
    private ResonanceListItemResponse toListItemForTrash(
            ResonanceListSummaryProjection row, ResonancePlace place, ResonanceSpotify track) {
        return ResonanceListItemResponse.builder()
                .id(row.getId())
                .title(row.getTitle())
                .mood(row.getMood())
                .visibility(row.getVisibility())
                .placeName(place != null ? place.getPlaceName() : null)
                .trackName(track != null ? track.getTrackName() : null)
                .createdAt(row.getCreatedAt().atOffset(ZoneOffset.UTC).toString())
                .build();
    }

    private ResonancePlaceResponse toPlaceResponse(ResonancePlace place) {
        if (place == null) {
            return null;
        }
        return ResonancePlaceResponse.builder()
                .placeName(place.getPlaceName())
                .address(place.getAddress())
                .latitude(place.getLatitude() != null ? place.getLatitude().toPlainString() : null)
                .longitude(place.getLongitude() != null ? place.getLongitude().toPlainString() : null)
                .googlePlaceId(place.getGooglePlaceId())
                .build();
    }

    private ResonanceTrackResponse toTrackResponse(ResonanceSpotify track) {
        if (track == null) {
            return null;
        }
        return ResonanceTrackResponse.builder()
                .spotifyTrackId(track.getSpotifyTrackId())
                .spotifyUri(track.getSpotifyUri())
                .trackName(track.getTrackName())
                .artistNames(track.getArtistNames())
                .albumName(track.getAlbumName())
                .imageUrl(track.getImageUrl())
                .build();
    }
}
