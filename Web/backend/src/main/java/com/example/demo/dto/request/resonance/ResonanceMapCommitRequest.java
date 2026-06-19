package com.example.demo.dto.request.resonance;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

/**
 * Single round-trip for map sidebar: upsert resonance body, place coordinates, and optional Spotify.
 * When {@link #resonanceId} is null, creates a new active resonance (same semantics as POST /create).
 */
@Data
public class ResonanceMapCommitRequest {

    /** Null/absent ⇒ create new row; otherwise update that resonance (partial fields like {@link ResonanceUpdateRequest}). */
    private Long resonanceId;

    @NotBlank
    @Size(max = 255)
    private String title;

    @Size(max = 64)
    private String mood;

    @Size(max = 10000)
    private String story;

    @Size(max = 2_000_000)
    private String imageUrl;

    @Pattern(regexp = "^(PRIVATE|PUBLIC)$", message = "visibility must be PRIVATE or PUBLIC")
    private String visibility = "PRIVATE";

    @Size(max = 255)
    private String placeName;

    @NotNull
    @DecimalMin(value = "-90.0", message = "latitude must be >= -90")
    @DecimalMax(value = "90.0", message = "latitude must be <= 90")
    private BigDecimal latitude;

    @NotNull
    @DecimalMin(value = "-180.0", message = "longitude must be >= -180")
    @DecimalMax(value = "180.0", message = "longitude must be <= 180")
    private BigDecimal longitude;

    @Size(max = 64)
    private String spotifyTrackId;

    /** When true, detach Spotify from this resonance (same as POST /track/unbind). Ignored when spotifyTrackId is set. */
    private Boolean unbindSpotify = Boolean.FALSE;

    /** When no explicit spotifyTrackId and not unbinding, searched server-side against Spotify Catalog (limit 1). */
    /** Example: "Song Title Artist Name" for server-side search when library id is not used. */
    @Size(max = 500)
    private String fallbackTrackQuery;
}
