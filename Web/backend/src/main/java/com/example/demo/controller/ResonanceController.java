package com.example.demo.controller;

import com.example.demo.common.config.JwtAuthentication;
import com.example.demo.dto.request.resonance.*;
import com.example.demo.dto.response.ApiResponse;
import com.example.demo.dto.response.resonance.PlaceAutocompleteSuggestionResponse;
import com.example.demo.dto.response.resonance.ResonancePageResponse;
import com.example.demo.dto.response.resonance.ResonancePlaceResponse;
import com.example.demo.dto.response.resonance.ResonanceResponse;
import com.example.demo.dto.response.resonance.ResonanceListItemResponse;
import com.example.demo.dto.response.resonance.ResonanceTrackResponse;
import com.example.demo.service.resonance.ResonanceService;
import com.example.demo.dto.request.resonance.ResonanceReorderRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/resonance")
@RequiredArgsConstructor
public class ResonanceController {

    private final ResonanceService resonanceService;

    @PostMapping("/create")
    public ResponseEntity<ApiResponse<ResonanceResponse>> create(
            @AuthenticationPrincipal JwtAuthentication auth,
            @Valid @RequestBody ResonanceCreateRequest request) {
        if (auth == null) {
            return ResponseEntity.ok(ApiResponse.fail(401, "Unauthorized or invalid token"));
        }
        ResonanceResponse data = resonanceService.create(auth.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PostMapping("/detail")
    public ResponseEntity<ApiResponse<ResonanceResponse>> detail(
            @AuthenticationPrincipal JwtAuthentication auth,
            @Valid @RequestBody ResonanceIdRequest request) {
        if (auth == null) {
            return ResponseEntity.ok(ApiResponse.fail(401, "Unauthorized or invalid token"));
        }
        ResonanceResponse data = resonanceService.detail(auth.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PostMapping("/list")
    public ResponseEntity<ApiResponse<ResonancePageResponse>> list(
            @AuthenticationPrincipal JwtAuthentication auth,
            @Valid @RequestBody ResonanceListRequest request) {
        if (auth == null) {
            return ResponseEntity.ok(ApiResponse.fail(401, "Unauthorized or invalid token"));
        }
        ResonancePageResponse data = resonanceService.list(auth.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PostMapping("/update")
    public ResponseEntity<ApiResponse<ResonanceResponse>> update(
            @AuthenticationPrincipal JwtAuthentication auth,
            @Valid @RequestBody ResonanceUpdateRequest request) {
        if (auth == null) {
            return ResponseEntity.ok(ApiResponse.fail(401, "Unauthorized or invalid token"));
        }
        ResonanceResponse data = resonanceService.update(auth.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    /** Map drawer: atomic-ish save for resonance body + geo + Spotify in one round-trip. */
    @PostMapping("/map/commit")
    public ResponseEntity<ApiResponse<ResonanceResponse>> commitMapMemory(
            @AuthenticationPrincipal JwtAuthentication auth,
            @Valid @RequestBody ResonanceMapCommitRequest request) {
        if (auth == null) {
            return ResponseEntity.ok(ApiResponse.fail(401, "Unauthorized or invalid token"));
        }
        ResonanceResponse data = resonanceService.commitMapMemory(auth.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PostMapping("/delete")
    public ResponseEntity<ApiResponse<Void>> delete(
            @AuthenticationPrincipal JwtAuthentication auth,
            @Valid @RequestBody ResonanceIdRequest request) {
        if (auth == null) {
            return ResponseEntity.ok(ApiResponse.fail(401, "Unauthorized or invalid token"));
        }
        resonanceService.delete(auth.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success("Moved to trash", null));
    }

    @PostMapping("/trash/list")
    public ResponseEntity<ApiResponse<List<ResonanceListItemResponse>>> trashList(
            @AuthenticationPrincipal JwtAuthentication auth) {
        if (auth == null) {
            return ResponseEntity.ok(ApiResponse.fail(401, "Unauthorized or invalid token"));
        }
        List<ResonanceListItemResponse> data = resonanceService.listTrash(auth.getUserId());
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PostMapping("/restore")
    public ResponseEntity<ApiResponse<ResonanceResponse>> restore(
            @AuthenticationPrincipal JwtAuthentication auth,
            @Valid @RequestBody ResonanceIdRequest request) {
        if (auth == null) {
            return ResponseEntity.ok(ApiResponse.fail(401, "Unauthorized or invalid token"));
        }
        ResonanceResponse data = resonanceService.restore(auth.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PostMapping("/purge")
    public ResponseEntity<ApiResponse<Void>> purge(
            @AuthenticationPrincipal JwtAuthentication auth,
            @Valid @RequestBody ResonanceIdRequest request) {
        if (auth == null) {
            return ResponseEntity.ok(ApiResponse.fail(401, "Unauthorized or invalid token"));
        }
        resonanceService.purge(auth.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success("Permanently deleted", null));
    }

    @PostMapping("/reorder")
    public ResponseEntity<ApiResponse<Void>> reorder(
            @AuthenticationPrincipal JwtAuthentication auth,
            @Valid @RequestBody ResonanceReorderRequest request) {
        if (auth == null) {
            return ResponseEntity.ok(ApiResponse.fail(401, "Unauthorized or invalid token"));
        }
        resonanceService.reorder(auth.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success("OK", null));
    }

    @PostMapping("/place/upsert")
    public ResponseEntity<ApiResponse<ResonancePlaceResponse>> upsertPlace(
            @AuthenticationPrincipal JwtAuthentication auth,
            @Valid @RequestBody ResonancePlaceUpsertRequest request) {
        if (auth == null) {
            return ResponseEntity.ok(ApiResponse.fail(401, "Unauthorized or invalid token"));
        }
        ResonancePlaceResponse data = resonanceService.upsertPlace(auth.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PostMapping("/place/resolve")
    public ResponseEntity<ApiResponse<ResonancePlaceResponse>> resolvePlace(
            @AuthenticationPrincipal JwtAuthentication auth,
            @Valid @RequestBody ResonancePlaceResolveRequest request) {
        if (auth == null) {
            return ResponseEntity.ok(ApiResponse.fail(401, "Unauthorized or invalid token"));
        }
        ResonancePlaceResponse data = resonanceService.resolvePlaceFromGoogle(auth.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PostMapping("/place/autocomplete")
    public ResponseEntity<ApiResponse<List<PlaceAutocompleteSuggestionResponse>>> autocompletePlace(
            @AuthenticationPrincipal JwtAuthentication auth,
            @Valid @RequestBody ResonancePlaceAutocompleteRequest request) {
        if (auth == null) {
            return ResponseEntity.ok(ApiResponse.fail(401, "Unauthorized or invalid token"));
        }
        List<PlaceAutocompleteSuggestionResponse> data =
                resonanceService.autocompletePlaces(auth.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PostMapping("/track/bind")
    public ResponseEntity<ApiResponse<ResonanceTrackResponse>> bindTrack(
            @AuthenticationPrincipal JwtAuthentication auth,
            @Valid @RequestBody ResonanceTrackBindRequest request) {
        if (auth == null) {
            return ResponseEntity.ok(ApiResponse.fail(401, "Unauthorized or invalid token"));
        }
        ResonanceTrackResponse data = resonanceService.bindTrack(auth.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(data));
    }

    @PostMapping("/track/unbind")
    public ResponseEntity<ApiResponse<Void>> unbindTrack(
            @AuthenticationPrincipal JwtAuthentication auth,
            @Valid @RequestBody ResonanceIdRequest request) {
        if (auth == null) {
            return ResponseEntity.ok(ApiResponse.fail(401, "Unauthorized or invalid token"));
        }
        resonanceService.unbindTrack(auth.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success("Unbound", null));
    }
}
