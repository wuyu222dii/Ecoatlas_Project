package com.example.demo.service.spotify;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.config.SpotifyProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class SpotifyClient {

    private final SpotifyProperties properties;
    private final HttpClient spotifyHttpClient;
    private final ObjectMapper objectMapper;

    public JsonNode exchangeAuthorizationCode(String code, String redirectUri, String codeVerifier) {
        String body = "grant_type=authorization_code"
                + "&code=" + url(code)
                + "&redirect_uri=" + url(redirectUri)
                + "&code_verifier=" + url(codeVerifier);

        return postToken(body);
    }

    public JsonNode refreshAccessToken(String refreshToken) {
        String body = "grant_type=refresh_token&refresh_token=" + url(refreshToken);
        return postToken(body);
    }

    private JsonNode postToken(String formBody) {
        String auth = Base64.getEncoder().encodeToString(
                (properties.getClientId() + ":" + properties.getClientSecret()).getBytes(StandardCharsets.UTF_8));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(properties.getTokenUrl()))
                .timeout(Duration.ofSeconds(properties.getHttpTimeoutSeconds()))
                .header("Authorization", "Basic " + auth)
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(formBody, StandardCharsets.UTF_8))
                .build();

        return sendJson(request, "token");
    }

    public JsonNode getCurrentUserProfile(String accessToken) {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(properties.getApiBaseUrl() + "/me"))
                .timeout(Duration.ofSeconds(properties.getHttpTimeoutSeconds()))
                .header("Authorization", "Bearer " + accessToken)
                .GET()
                .build();
        return sendJson(request, "me");
    }

    /**
     * GET /v1/search — Spotify allows limit 1–10, offset 0–1000.
     */
    public JsonNode searchTracks(String accessToken, String query, int limit, int offset) {
        int safeLimit = Math.min(10, Math.max(1, limit));
        int safeOffset = Math.min(1000, Math.max(0, offset));
        String base = properties.getApiBaseUrl().trim();
        String uriStr = base + "/search?q=" + url(query)
                + "&type=track"
                + "&market=from_token"
                + "&limit=" + safeLimit
                + "&offset=" + safeOffset;
        if (safeOffset == 0) {
            log.info("Spotify search GET (no token in log): {}", uriStr);
        } else {
            log.debug("Spotify search GET offset={}: {}", safeOffset, uriStr);
        }
        URI uri = URI.create(uriStr);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(uri)
                .timeout(Duration.ofSeconds(properties.getHttpTimeoutSeconds()))
                .header("Authorization", "Bearer " + accessToken)
                .GET()
                .build();
        return sendJson(request, "search");
    }

    public JsonNode getTrack(String accessToken, String trackId) {
        String base = properties.getApiBaseUrl().trim();
        String uriStr = base + "/tracks/" + urlPathSegment(trackId) + "?market=from_token";
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(uriStr))
                .timeout(Duration.ofSeconds(properties.getHttpTimeoutSeconds()))
                .header("Authorization", "Bearer " + accessToken)
                .GET()
                .build();
        return sendJson(request, "track");
    }

    /** GET /v1/tracks?ids= — at most 50 ids, comma-separated. */
    public JsonNode getTracks(String accessToken, List<String> rawIds) {
        if (rawIds == null || rawIds.isEmpty()) {
            throw new BusinessException(400, "track ids required");
        }
        String idsParam = rawIds.stream()
                .map(SpotifyClient::urlPathSegment)
                .filter(s -> !s.isEmpty())
                .distinct()
                .limit(50)
                .collect(Collectors.joining(","));
        if (idsParam.isEmpty()) {
            throw new BusinessException(400, "no valid track ids");
        }
        String uriStr = properties.getApiBaseUrl().trim() + "/tracks?ids=" + idsParam + "&market=from_token";
        log.debug("Spotify tracks batch GET (no token): {}", uriStr);
        URI uri = URI.create(uriStr);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(uri)
                .timeout(Duration.ofSeconds(properties.getHttpTimeoutSeconds()))
                .header("Authorization", "Bearer " + accessToken)
                .GET()
                .build();
        return sendJson(request, "tracks-batch");
    }

    private static String urlPathSegment(String id) {
        return id.replaceAll("[^a-zA-Z0-9]", "");
    }

    private JsonNode sendJson(HttpRequest request, String label) {
        try {
            HttpResponse<String> response = spotifyHttpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                String body = truncate(response.body(), 500);
                log.warn("Spotify {} HTTP {}: {}", label, response.statusCode(), body);
                String msg = "Spotify API error: HTTP " + response.statusCode() + " (" + label + ")";
                if (body != null && !body.isBlank()) {
                    msg += ": " + body;
                }
                throw new BusinessException(502, msg);
            }
            return objectMapper.readTree(response.body());
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Spotify {} request failed", label, e);
            throw new BusinessException(502, "Spotify request failed: " + e.getMessage());
        }
    }

    private static String url(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8);
    }

    private static String truncate(String s, int max) {
        if (s == null) {
            return "";
        }
        return s.length() <= max ? s : s.substring(0, max) + "…";
    }
}
