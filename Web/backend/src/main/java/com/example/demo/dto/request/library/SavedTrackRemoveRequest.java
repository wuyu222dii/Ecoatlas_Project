package com.example.demo.dto.request.library;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SavedTrackRemoveRequest {

    @NotBlank
    @Size(max = 32)
    private String spotifyTrackId;
}
