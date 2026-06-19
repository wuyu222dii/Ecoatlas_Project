package com.example.demo.dto.request.resonance;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResonancePlaceResolveRequest {

    @NotBlank
    @Size(max = 512)
    private String googlePlaceId;
}
