package com.example.demo.dto.request.spotify;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SpotifyTrackDetailRequest {

    @NotBlank(message = "trackId is required")
    @Size(max = 32)
    private String trackId;
}
