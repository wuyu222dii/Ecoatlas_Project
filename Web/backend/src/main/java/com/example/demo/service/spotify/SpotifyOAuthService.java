package com.example.demo.service.spotify;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.config.SpotifyProperties;
import com.example.demo.model.SpotifyConnection;
import com.example.demo.model.SpotifyOAuthState;
import com.example.demo.repository.SpotifyConnectionRepository;
import com.example.demo.repository.SpotifyOAuthStateRepository;
import com.example.demo.dto.response.spotify.SpotifyAuthorizeUrlResponse;
import com.example.demo.dto.response.spotify.SpotifyExchangeResponse;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class SpotifyOAuthService {

    private final SpotifyProperties properties;
    private final SpotifyOAuthStateRepository oauthStateRepository;
    private final SpotifyConnectionRepository connectionRepository;
    private final SpotifyClient spotifyClient;
    private final SpotifyAccountService spotifyAccountService;

    @Transactional
    public SpotifyAuthorizeUrlResponse buildAuthorizeUrl(Long userId, String redirectUri, String codeChallenge,
            String codeChallengeMethod) {
        oauthStateRepository.deleteExpired(Instant.now());

        if (properties.getClientId() == null || properties.getClientId().isBlank()) {
            throw new BusinessException(503, "Spotify client-id is not configured");
        }
        if (codeChallenge == null || codeChallenge.isBlank()) {
            throw new BusinessException(400, "codeChallenge is required (PKCE)");
        }
        String method = (codeChallengeMethod == null || codeChallengeMethod.isBlank())
                ? "S256"
                : codeChallengeMethod.trim();
        if (!"S256".equalsIgnoreCase(method)) {
            throw new BusinessException(400, "Only S256 code_challenge_method is supported");
        }

        String redirect = redirectUri != null && !redirectUri.isBlank()
                ? redirectUri.trim()
                : properties.getDefaultRedirectUri();

        String state = UUID.randomUUID().toString();
        Instant expiresAt = Instant.now().plusSeconds(properties.getStateTtlMinutes() * 60L);
        oauthStateRepository.save(SpotifyOAuthState.builder()
                .state(state)
                .userId(userId)
                .createdAt(Instant.now())
                .expiresAt(expiresAt)
                .build());

        String scopes = properties.getScopes().trim().replaceAll("\\s+", " ");
        String authorizeUrl = properties.getAuthorizationUrl()
                + "?response_type=code"
                + "&client_id=" + enc(properties.getClientId())
                + "&scope=" + enc(scopes)
                + "&redirect_uri=" + enc(redirect)
                + "&code_challenge_method=" + enc(method)
                + "&code_challenge=" + enc(codeChallenge)
                + "&state=" + enc(state);

        return SpotifyAuthorizeUrlResponse.builder()
                .authorizeUrl(authorizeUrl)
                .state(state)
                .build();
    }

    @Transactional
    public SpotifyExchangeResponse exchangeCode(Long userId, String code, String redirectUri, String codeVerifier,
            String state) {
        oauthStateRepository.deleteExpired(Instant.now());

        if (code == null || code.isBlank()) {
            throw new BusinessException(400, "code is required");
        }
        if (codeVerifier == null || codeVerifier.isBlank()) {
            throw new BusinessException(400, "codeVerifier is required");
        }
        if (state == null || state.isBlank()) {
            throw new BusinessException(400, "state is required");
        }

        SpotifyOAuthState pending = oauthStateRepository.findById(state)
                .orElseThrow(() -> new BusinessException(400, "Invalid or expired state"));
        if (pending.getExpiresAt().isBefore(Instant.now())) {
            oauthStateRepository.delete(pending);
            throw new BusinessException(400, "OAuth state expired; request a new authorize URL");
        }
        if (!pending.getUserId().equals(userId)) {
            throw new BusinessException(403, "state does not match the current user");
        }

        String redirect = redirectUri != null && !redirectUri.isBlank()
                ? redirectUri.trim()
                : properties.getDefaultRedirectUri();

        JsonNode tokenJson = spotifyClient.exchangeAuthorizationCode(code, redirect, codeVerifier);
        if (!tokenJson.has("refresh_token") || tokenJson.get("refresh_token").isNull()
                || tokenJson.get("refresh_token").asText().isBlank()) {
            throw new BusinessException(502, "Spotify did not return refresh_token; revoke app access and retry");
        }
        SpotifyConnection conn = connectionRepository.findByUserId(userId).orElseGet(() ->
                SpotifyConnection.builder().userId(userId).build());
        spotifyAccountService.applyTokenResponse(conn, tokenJson);

        String access = conn.getAccessToken();
        JsonNode me = fetchSpotifyProfileOrExplainDevelopmentAllowlist(access);
        String spotifyUserId = me.path("id").asText(null);
        conn.setSpotifyUserId(spotifyUserId);

        connectionRepository.save(conn);
        oauthStateRepository.delete(pending);

        return SpotifyExchangeResponse.builder()
                .spotifyUserId(spotifyUserId)
                .connected(true)
                .build();
    }

    /**
     * GET /v1/me after token exchange. Spotify returns 403 with "not registered for this application"
     * when the app is in Development mode and the Spotify login used for OAuth is not on the app's user list.
     */
    private JsonNode fetchSpotifyProfileOrExplainDevelopmentAllowlist(String accessToken) {
        try {
            return spotifyClient.getCurrentUserProfile(accessToken);
        } catch (BusinessException e) {
            String msg = e.getMessage();
            if (msg != null && msg.contains("not registered for this application")) {
                throw new BusinessException(403,
                        "Spotify Development mode: the Spotify account you used on the consent screen is not on this "
                                + "app's allowlist. Add it under developer.spotify.com/dashboard → your app → Settings → "
                                + "User management (not your EchoAtlas email unless it matches). Original error: " + msg);
            }
            throw e;
        }
    }

    private static String enc(String s) {
        return URLEncoder.encode(s, StandardCharsets.UTF_8);
    }
}
