package com.example.demo.dto.request.spotify;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SpotifySearchRequest {

    @NotBlank(message = "query is required")
    @Size(max = 500)
    private String query;

    /** Optional; Spotify Search only allows 1–10. */
    @Min(1)
    @Max(10)
    private Integer limit;

    /** Resolved limit for Spotify Search, always in [1,10] (Spotify max 10), default 10. */
    public int resolveLimit() {
        if (limit == null) {
            return 10;
        }
        return Math.min(10, Math.max(1, limit));
    }
}
