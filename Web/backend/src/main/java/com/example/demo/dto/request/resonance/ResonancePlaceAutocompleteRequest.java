package com.example.demo.dto.request.resonance;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResonancePlaceAutocompleteRequest {

    /** User-typed fragment (city, POI, address). */
    @NotBlank(message = "input is required")
    @Size(min = 1, max = 200)
    private String input;
}
