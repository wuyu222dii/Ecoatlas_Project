package com.example.demo.dto.request.library;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SavedTrackSaveRequest {

    @NotBlank
    @Size(max = 32)
    private String spotifyTrackId;

    /** e.g. AI, SEARCH, MANUAL */
    @Size(max = 32)
    @Pattern(regexp = "^[A-Z0-9_]+$", message = "source must be uppercase letters, digits, underscore")
    private String source = "SEARCH";
}
