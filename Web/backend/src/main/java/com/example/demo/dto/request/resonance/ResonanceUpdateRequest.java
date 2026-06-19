package com.example.demo.dto.request.resonance;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResonanceUpdateRequest {

    @NotNull
    private Long resonanceId;

    @Size(max = 255)
    private String title;

    @Size(max = 64)
    private String mood;

    @Size(max = 10000)
    private String story;

    @Size(max = 2_000_000)
    private String imageUrl;

    @Pattern(regexp = "^(PRIVATE|PUBLIC)$", message = "visibility must be PRIVATE or PUBLIC")
    private String visibility;
}
