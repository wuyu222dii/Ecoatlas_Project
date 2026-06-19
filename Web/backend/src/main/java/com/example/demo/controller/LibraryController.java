package com.example.demo.controller;

import com.example.demo.common.config.JwtAuthentication;
import com.example.demo.dto.request.library.SavedTrackListRequest;
import com.example.demo.dto.request.library.SavedTrackRemoveRequest;
import com.example.demo.dto.request.library.SavedTrackSaveRequest;
import com.example.demo.dto.request.library.SavedTrackSearchRequest;
import com.example.demo.dto.response.ApiResponse;
import com.example.demo.dto.response.library.SavedTrackPageResponse;
import com.example.demo.dto.response.library.SavedTrackResponse;
import com.example.demo.service.library.SavedTrackService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/library")
@RequiredArgsConstructor
public class LibraryController {

    private final SavedTrackService savedTrackService;

    @PostMapping("/tracks/save")
    public ResponseEntity<ApiResponse<SavedTrackResponse>> save(
            @AuthenticationPrincipal JwtAuthentication auth,
            @Valid @RequestBody SavedTrackSaveRequest request) {
        if (auth == null) {
            return ResponseEntity.ok(ApiResponse.fail(401, "Unauthorized or invalid token"));
        }
        SavedTrackResponse data = savedTrackService.save(auth.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PostMapping("/tracks/remove")
    public ResponseEntity<ApiResponse<Void>> remove(
            @AuthenticationPrincipal JwtAuthentication auth,
            @Valid @RequestBody SavedTrackRemoveRequest request) {
        if (auth == null) {
            return ResponseEntity.ok(ApiResponse.fail(401, "Unauthorized or invalid token"));
        }
        savedTrackService.remove(auth.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success("Removed", null));
    }

    @PostMapping("/tracks/list")
    public ResponseEntity<ApiResponse<SavedTrackPageResponse>> list(
            @AuthenticationPrincipal JwtAuthentication auth,
            @Valid @RequestBody SavedTrackListRequest request) {
        if (auth == null) {
            return ResponseEntity.ok(ApiResponse.fail(401, "Unauthorized or invalid token"));
        }
        SavedTrackPageResponse data = savedTrackService.list(auth.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PostMapping("/tracks/search")
    public ResponseEntity<ApiResponse<SavedTrackPageResponse>> search(
            @AuthenticationPrincipal JwtAuthentication auth,
            @Valid @RequestBody SavedTrackSearchRequest request) {
        if (auth == null) {
            return ResponseEntity.ok(ApiResponse.fail(401, "Unauthorized or invalid token"));
        }
        SavedTrackPageResponse data = savedTrackService.search(auth.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(data));
    }
}
