package com.example.demo.controller;

import com.example.demo.common.config.JwtAuthentication;
import com.example.demo.dto.request.AiRecommendRequest;
import com.example.demo.dto.request.ai.AiResolveTracksRequest;
import com.example.demo.dto.response.AiRecommendResponse;
import com.example.demo.dto.response.ai.AiResolveTracksResponse;
import com.example.demo.dto.response.ApiResponse;
import com.example.demo.service.ai.AiMusicService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
public class AiMusicController {

    private final AiMusicService aiMusicService;

    /**
     * AI-assisted music recommendations from natural language (not tied to desk scene).
     */
    @PostMapping("/recommend")
    public ResponseEntity<ApiResponse<AiRecommendResponse>> recommend(
            @AuthenticationPrincipal JwtAuthentication auth,
            @Valid @RequestBody AiRecommendRequest request) {
        if (auth == null) {
            return ResponseEntity.ok(ApiResponse.fail(401, "Unauthorized or invalid token"));
        }
        AiRecommendResponse data = aiMusicService.recommend(request);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    /**
     * Resolve title/artist hints to Spotify tracks (requires Spotify OAuth linked).
     */
    @PostMapping("/resolve-tracks")
    public ResponseEntity<ApiResponse<AiResolveTracksResponse>> resolveTracks(
            @AuthenticationPrincipal JwtAuthentication auth,
            @Valid @RequestBody AiResolveTracksRequest request) {
        if (auth == null) {
            return ResponseEntity.ok(ApiResponse.fail(401, "Unauthorized or invalid token"));
        }
        AiResolveTracksResponse data = aiMusicService.resolveToSpotify(auth.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(data));
    }
}
