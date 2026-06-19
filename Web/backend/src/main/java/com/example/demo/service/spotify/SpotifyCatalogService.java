package com.example.demo.service.spotify;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.dto.request.spotify.SpotifySearchRequest;
import com.example.demo.dto.request.spotify.SpotifyTrackDetailRequest;
import com.example.demo.dto.request.spotify.SpotifyTracksByIdsRequest;
import com.example.demo.dto.response.spotify.SpotifySearchResponse;
import com.example.demo.dto.response.spotify.SpotifyTrackSummary;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.StreamSupport;

@Slf4j
@Service
@RequiredArgsConstructor
public class SpotifyCatalogService {

    private final SpotifyClient spotifyClient;
    private final SpotifyAccountService spotifyAccountService;

    public SpotifySearchResponse searchTracks(Long userId, SpotifySearchRequest request) {
        String access = spotifyAccountService.getValidAccessToken(userId);
        int want = request.resolveLimit();
        /*
         * One page often returns only preview_url=null (many Spotify tracks no longer expose 30s previews).
         * Fetch multiple pages, dedupe, and rank tracks with previews first for better in-browser playback.
         */
        Map<String, SpotifyTrackSummary> byId = new LinkedHashMap<>();
        int maxOffset = 80;
        for (int offset = 0; offset < maxOffset && byId.size() < maxOffset; offset += 10) {
            JsonNode root = spotifyClient.searchTracks(access, request.getQuery(), 10, offset);
            JsonNode items = root.path("tracks").path("items");
            if (!items.isArray() || items.size() == 0) {
                break;
            }
            for (JsonNode item : items) {
                SpotifyTrackSummary m = mapTrackNode(item);
                if (m != null && m.getId() != null && !byId.containsKey(m.getId())) {
                    byId.put(m.getId(), m);
                }
            }
            long withPreview = byId.values().stream().filter(t -> t.getPreviewUrl() != null).count();
            if (withPreview >= want) {
                break;
            }
        }
        List<SpotifyTrackSummary> withPreview = new ArrayList<>();
        List<SpotifyTrackSummary> noPreview = new ArrayList<>();
        for (SpotifyTrackSummary t : byId.values()) {
            if (t.getPreviewUrl() != null) {
                withPreview.add(t);
            } else {
                noPreview.add(t);
            }
        }
        List<SpotifyTrackSummary> out = new ArrayList<>();
        out.addAll(withPreview);
        out.addAll(noPreview);
        if (out.size() > want) {
            out = new ArrayList<>(out.subList(0, want));
        }
        return SpotifySearchResponse.builder().tracks(out).build();
    }

    public SpotifyTrackSummary getTrack(Long userId, SpotifyTrackDetailRequest request) {
        String access = spotifyAccountService.getValidAccessToken(userId);
        JsonNode track = spotifyClient.getTrack(access, request.getTrackId());
        return mapTrackNode(track);
    }

    /**
     * Batch-fetch tracks by id (demo playlists use fixed ids to avoid search-only null previews).
     * Tracks with previews first, same ordering policy as searchTracks.
     * Batch GET may return 403 for some apps; fall back to GET /tracks/{id} per id.
     */
    public SpotifySearchResponse getTracksByIds(Long userId, SpotifyTracksByIdsRequest request) {
        String access = spotifyAccountService.getValidAccessToken(userId);
        try {
            JsonNode root = spotifyClient.getTracks(access, request.getIds());
            JsonNode arr = root.path("tracks");
            List<SpotifyTrackSummary> parsed = new ArrayList<>();
            if (arr.isArray()) {
                for (JsonNode item : arr) {
                    if (item == null || item.isNull() || item.isMissingNode()) {
                        continue;
                    }
                    SpotifyTrackSummary m = mapTrackNode(item);
                    if (m != null && m.getId() != null) {
                        parsed.add(m);
                    }
                }
            }
            return orderTracksPreviewFirst(parsed);
        } catch (BusinessException ex) {
            log.warn("Spotify batch tracks failed: {}", ex.getMessage());
            List<SpotifyTrackSummary> parsed = new ArrayList<>();
            for (String rawId : request.getIds()) {
                if (rawId == null || rawId.isBlank()) {
                    continue;
                }
                try {
                    JsonNode track = spotifyClient.getTrack(access, rawId.trim());
                    SpotifyTrackSummary m = mapTrackNode(track);
                    if (m != null && m.getId() != null) {
                        parsed.add(m);
                    }
                } catch (BusinessException oneEx) {
                    log.debug("Single track fetch failed for {}: {}", rawId, oneEx.getMessage());
                }
            }
            return orderTracksPreviewFirst(parsed);
        }
    }

    private static SpotifySearchResponse orderTracksPreviewFirst(List<SpotifyTrackSummary> items) {
        List<SpotifyTrackSummary> withPreview = new ArrayList<>();
        List<SpotifyTrackSummary> noPreview = new ArrayList<>();
        for (SpotifyTrackSummary m : items) {
            if (m == null || m.getId() == null) {
                continue;
            }
            if (m.getPreviewUrl() != null) {
                withPreview.add(m);
            } else {
                noPreview.add(m);
            }
        }
        List<SpotifyTrackSummary> out = new ArrayList<>();
        out.addAll(withPreview);
        out.addAll(noPreview);
        return SpotifySearchResponse.builder().tracks(out).build();
    }

    /** Spotify search: take the first hit (caller uses small limit). */
    public SpotifyTrackSummary searchFirstHit(Long userId, String q, int limit) {
        SpotifySearchRequest req = new SpotifySearchRequest();
        req.setQuery(q);
        req.setLimit(Math.min(Math.max(limit, 1), 10));
        SpotifySearchResponse resp = searchTracks(userId, req);
        if (resp.getTracks() == null || resp.getTracks().isEmpty()) {
            return null;
        }
        return resp.getTracks().get(0);
    }

    public SpotifyTrackSummary mapTrackNode(JsonNode track) {
        if (track == null || track.isNull() || track.isMissingNode()) {
            return null;
        }
        String id = text(track, "id");
        String name = text(track, "name");
        String uri = text(track, "uri");
        String preview = text(track, "preview_url");
        int durationMs = track.path("duration_ms").asInt(0);
        JsonNode album = track.path("album");
        String albumName = text(album, "name");
        String imageUrl = null;
        JsonNode images = album.path("images");
        if (images.isArray() && images.size() > 0) {
            imageUrl = text(images.get(0), "url");
        }
        String artistsDisplay = StreamSupport.stream(track.path("artists").spliterator(), false)
                .map(a -> text(a, "name"))
                .filter(s -> s != null && !s.isBlank())
                .collect(Collectors.joining(", "));
        return SpotifyTrackSummary.builder()
                .id(id)
                .name(name)
                .uri(uri)
                .previewUrl(preview)
                .durationMs(durationMs > 0 ? durationMs : null)
                .albumName(albumName)
                .albumImageUrl(imageUrl)
                .artistsDisplay(artistsDisplay.isBlank() ? null : artistsDisplay)
                .build();
    }

    private static String text(JsonNode n, String field) {
        if (n == null || n.isMissingNode() || n.isNull()) {
            return null;
        }
        JsonNode v = n.get(field);
        if (v == null || v.isNull()) {
            return null;
        }
        String s = v.asText();
        return s.isBlank() ? null : s;
    }
}
