package com.example.demo.controller;

import com.example.demo.common.config.JwtAuthentication;
import com.example.demo.dto.request.spotify.SpotifyAuthorizeUrlRequest;
import com.example.demo.dto.request.spotify.SpotifyExchangeRequest;
import com.example.demo.dto.request.spotify.SpotifySearchRequest;
import com.example.demo.dto.request.spotify.SpotifyTrackDetailRequest;
import com.example.demo.dto.request.spotify.SpotifyTracksByIdsRequest;
import com.example.demo.dto.response.ApiResponse;
import com.example.demo.dto.response.spotify.SpotifyAuthorizeUrlResponse;
import com.example.demo.dto.response.spotify.SpotifyExchangeResponse;
import com.example.demo.dto.response.spotify.SpotifySearchResponse;
import com.example.demo.dto.response.spotify.SpotifyTrackSummary;
import com.example.demo.service.spotify.SpotifyCatalogService;
import com.example.demo.service.spotify.SpotifyOAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/spotify")
@RequiredArgsConstructor
public class SpotifyController {

    private final SpotifyOAuthService spotifyOAuthService;
    private final SpotifyCatalogService spotifyCatalogService;

    @PostMapping("/oauth/authorize-url")
    public ResponseEntity<ApiResponse<SpotifyAuthorizeUrlResponse>> authorizeUrl(
            @AuthenticationPrincipal JwtAuthentication auth,
            @Valid @RequestBody SpotifyAuthorizeUrlRequest request) {
        if (auth == null) {
            return ResponseEntity.ok(ApiResponse.fail(401, "Unauthorized or invalid token"));
        }
        SpotifyAuthorizeUrlResponse data = spotifyOAuthService.buildAuthorizeUrl(
                auth.getUserId(),
                request.getRedirectUri(),
                request.getCodeChallenge(),
                request.getCodeChallengeMethod());
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PostMapping("/oauth/exchange")
    public ResponseEntity<ApiResponse<SpotifyExchangeResponse>> exchange(
            @AuthenticationPrincipal JwtAuthentication auth,
            @Valid @RequestBody SpotifyExchangeRequest request) {
        if (auth == null) {
            return ResponseEntity.ok(ApiResponse.fail(401, "Unauthorized or invalid token"));
        }
        SpotifyExchangeResponse data = spotifyOAuthService.exchangeCode(
                auth.getUserId(),
                request.getCode(),
                request.getRedirectUri(),
                request.getCodeVerifier(),
                request.getState());
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PostMapping("/search")
    public ResponseEntity<ApiResponse<SpotifySearchResponse>> search(
            @AuthenticationPrincipal JwtAuthentication auth,
            @Valid @RequestBody SpotifySearchRequest request) {
        if (auth == null) {
            return ResponseEntity.ok(ApiResponse.fail(401, "Unauthorized or invalid token"));
        }
        SpotifySearchResponse data = spotifyCatalogService.searchTracks(auth.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PostMapping("/track/detail")
    public ResponseEntity<ApiResponse<SpotifyTrackSummary>> trackDetail(
            @AuthenticationPrincipal JwtAuthentication auth,
            @Valid @RequestBody SpotifyTrackDetailRequest request) {
        if (auth == null) {
            return ResponseEntity.ok(ApiResponse.fail(401, "Unauthorized or invalid token"));
        }
        SpotifyTrackSummary data = spotifyCatalogService.getTrack(auth.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PostMapping("/tracks/by-ids")
    public ResponseEntity<ApiResponse<SpotifySearchResponse>> tracksByIds(
            @AuthenticationPrincipal JwtAuthentication auth,
            @Valid @RequestBody SpotifyTracksByIdsRequest request) {
        if (auth == null) {
            return ResponseEntity.ok(ApiResponse.fail(401, "Unauthorized or invalid token"));
        }
        SpotifySearchResponse data = spotifyCatalogService.getTracksByIds(auth.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(data));
    }
}
