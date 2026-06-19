package com.example.demo.dto.request.resonance;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ResonanceIdRequest {

    @NotNull
    private Long resonanceId;
}
