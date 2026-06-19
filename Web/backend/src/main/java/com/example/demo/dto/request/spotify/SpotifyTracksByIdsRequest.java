package com.example.demo.dto.request.spotify;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class SpotifyTracksByIdsRequest {

    /** Spotify track ids, at most 50, same as GET /v1/tracks?ids=. */
    @NotEmpty(message = "ids is required")
    @Size(max = 50, message = "at most 50 track ids")
    private List<String> ids;
}
