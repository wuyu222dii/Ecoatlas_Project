package com.example.demo.service.ai;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.dto.request.AiRecommendRequest;
import com.example.demo.dto.request.ai.AiResolveTracksRequest;
import com.example.demo.dto.response.AiRecommendArtistDto;
import com.example.demo.dto.response.AiRecommendResponse;
import com.example.demo.dto.response.AiRecommendTrackDto;
import com.example.demo.dto.response.ai.AiResolvedTrackItem;
import com.example.demo.dto.response.ai.AiResolveTracksResponse;
import com.example.demo.dto.response.spotify.SpotifyTrackSummary;
import com.example.demo.model.ai.AiRecommendMode;
import com.example.demo.service.gemini.GeminiClient;
import com.example.demo.service.spotify.SpotifyCatalogService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiMusicService {

    private final GeminiClient geminiClient;
    private final ObjectMapper objectMapper;
    private final SpotifyCatalogService spotifyCatalogService;

    public AiRecommendResponse recommend(AiRecommendRequest request) {
        if (request.getMode() == null) {
            request.setMode(AiRecommendMode.MIXED);
        }
        if (request.getLocale() == null || request.getLocale().isBlank()) {
            request.setLocale("en");
        }

        String locale = AiMusicPrompts.normalizeLocale(request.getLocale());
        String system = AiMusicPrompts.systemInstructions();
        String user = AiMusicPrompts.buildUserPayload(request, locale);

        String raw = geminiClient.generateJson(system, user).trim();
        raw = stripMarkdownCodeFence(raw);

        AiRecommendResponse parsed;
        try {
            parsed = objectMapper.readValue(raw, AiRecommendResponse.class);
        } catch (Exception e) {
            log.warn("Invalid AI JSON (first 400 chars): {}", raw.length() > 400 ? raw.substring(0, 400) : raw, e);
            throw new BusinessException(502, "AI returned invalid JSON. Try again or shorten the request.");
        }

        normalizeAndClamp(parsed, request.getMaxItems());
        return parsed;
    }

    /**
     * Map title/artist hints to Spotify catalog via Search (requires linked Spotify account).
     */
    public AiResolveTracksResponse resolveToSpotify(Long userId, AiResolveTracksRequest request) {
        List<AiResolvedTrackItem> out = new ArrayList<>();
        for (AiResolveTracksRequest.TitleArtistItem item : request.getItems()) {
            String title = item.getTitle() != null ? item.getTitle().trim() : "";
            String artist = item.getArtist() != null ? item.getArtist().trim() : "";
            if (title.isEmpty() && artist.isEmpty()) {
                out.add(AiResolvedTrackItem.builder()
                        .requestedTitle(item.getTitle())
                        .requestedArtist(item.getArtist())
                        .matched(false)
                        .matchNote("Skip: empty title and artist")
                        .spotify(null)
                        .build());
                continue;
            }
            String q = (title + " " + artist).trim();
            SpotifyTrackSummary hit = spotifyCatalogService.searchFirstHit(userId, q, 5);
            if (hit == null) {
                out.add(AiResolvedTrackItem.builder()
                        .requestedTitle(title.isEmpty() ? null : title)
                        .requestedArtist(artist.isEmpty() ? null : artist)
                        .matched(false)
                        .matchNote("No Spotify search results for query")
                        .spotify(null)
                        .build());
            } else {
                out.add(AiResolvedTrackItem.builder()
                        .requestedTitle(title.isEmpty() ? null : title)
                        .requestedArtist(artist.isEmpty() ? null : artist)
                        .matched(true)
                        .matchNote("First hit for constructed search query")
                        .spotify(hit)
                        .build());
            }
        }
        return AiResolveTracksResponse.builder().items(out).build();
    }

    private static String stripMarkdownCodeFence(String raw) {
        String t = raw.trim();
        if (t.startsWith("```")) {
            t = t.replaceFirst("^```(?:json)?\\s*", "");
            int end = t.lastIndexOf("```");
            if (end > 0) {
                t = t.substring(0, end).trim();
            }
        }
        return t;
    }

    private void normalizeAndClamp(AiRecommendResponse r, int maxItems) {
        if (r.getSummary() == null) {
            r.setSummary("");
        }
        if (r.getTracks() == null) {
            r.setTracks(new ArrayList<>());
        }
        if (r.getArtists() == null) {
            r.setArtists(new ArrayList<>());
        }

        List<AiRecommendTrackDto> cleanTracks = r.getTracks().stream()
                .filter(t -> t != null && StringUtils.hasText(t.getTitle()) && StringUtils.hasText(t.getArtist()))
                .collect(Collectors.toCollection(ArrayList::new));

        List<AiRecommendArtistDto> cleanArtists = r.getArtists().stream()
                .filter(a -> a != null && StringUtils.hasText(a.getName()))
                .collect(Collectors.toCollection(ArrayList::new));

        if (cleanTracks.size() > maxItems) {
            cleanTracks = new ArrayList<>(cleanTracks.subList(0, maxItems));
        }
        if (cleanArtists.size() > maxItems) {
            cleanArtists = new ArrayList<>(cleanArtists.subList(0, maxItems));
        }

        r.setTracks(cleanTracks);
        r.setArtists(cleanArtists);

        if (!StringUtils.hasText(r.getPlaylistTitle())) {
            r.setPlaylistTitle(null);
        }
        if (!StringUtils.hasText(r.getPlaylistDescription())) {
            r.setPlaylistDescription(null);
        }
    }
}
