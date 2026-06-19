package com.example.demo.service.spotify;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.config.SpotifyProperties;
import com.example.demo.model.SpotifyConnection;
import com.example.demo.repository.SpotifyConnectionRepository;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
@RequiredArgsConstructor
public class SpotifyAccountService {

    private final SpotifyConnectionRepository connectionRepository;
    private final SpotifyClient spotifyClient;
    private final SpotifyProperties properties;

    public SpotifyConnection requireConnection(Long userId) {
        return connectionRepository.findByUserId(userId)
                .orElseThrow(() -> new BusinessException(400, "Spotify account not linked. Complete OAuth flow first."));
    }

    @Transactional
    public String getValidAccessToken(Long userId) {
        SpotifyConnection c = requireConnection(userId);
        if (c.getAccessToken() != null && c.getAccessTokenExpiresAt() != null
                && c.getAccessTokenExpiresAt().isAfter(Instant.now().plusSeconds(45))) {
            return c.getAccessToken();
        }
        JsonNode tokenJson = spotifyClient.refreshAccessToken(c.getRefreshToken());
        applyTokenResponse(c, tokenJson);
        connectionRepository.save(c);
        return c.getAccessToken();
    }

    public void applyTokenResponse(SpotifyConnection c, JsonNode tokenJson) {
        String access = textOrNull(tokenJson, "access_token");
        if (access == null || access.isBlank()) {
            throw new BusinessException(502, "Spotify token response missing access_token");
        }
        c.setAccessToken(access);
        int expiresIn = tokenJson.path("expires_in").asInt(3600);
        c.setAccessTokenExpiresAt(Instant.now().plusSeconds(expiresIn));
        if (tokenJson.has("refresh_token") && !tokenJson.get("refresh_token").isNull()) {
            String rt = tokenJson.get("refresh_token").asText();
            if (!rt.isBlank()) {
                c.setRefreshToken(rt);
            }
        }
        if (tokenJson.has("scope") && !tokenJson.get("scope").isNull()) {
            c.setScope(tokenJson.get("scope").asText());
        }
    }

    private static String textOrNull(JsonNode n, String field) {
        if (!n.has(field) || n.get(field).isNull()) {
            return null;
        }
        String t = n.get(field).asText();
        return t.isBlank() ? null : t;
    }
}
