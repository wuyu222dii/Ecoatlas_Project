package com.example.demo.dto.request.resonance;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResonanceTrackBindRequest {

    @NotNull
    private Long resonanceId;

    @NotBlank
    @Size(max = 32)
    private String spotifyTrackId;
}
