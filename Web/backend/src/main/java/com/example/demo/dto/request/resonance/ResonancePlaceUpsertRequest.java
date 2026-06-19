package com.example.demo.dto.request.resonance;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ResonancePlaceUpsertRequest {

    @NotNull
    private Long resonanceId;

    /** When true, resolves lat/lng (and optionally name/address) from {@link #googlePlaceId} via Google Places API. */
    private Boolean resolveFromGooglePlaceId = false;

    @Size(max = 255)
    private String placeName;

    @Size(max = 512)
    private String address;

    /** Required unless {@link #resolveFromGooglePlaceId} is true. */
    @DecimalMin(value = "-90.0", message = "latitude must be >= -90")
    @DecimalMax(value = "90.0", message = "latitude must be <= 90")
    private BigDecimal latitude;

    /** Required unless {@link #resolveFromGooglePlaceId} is true. */
    @DecimalMin(value = "-180.0", message = "longitude must be >= -180")
    @DecimalMax(value = "180.0", message = "longitude must be <= 180")
    private BigDecimal longitude;

    @Size(max = 512)
    private String googlePlaceId;
}
