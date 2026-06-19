package com.example.demo.dto.response.resonance;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PlaceAutocompleteSuggestionResponse {

    private String placeId;
    /** Primary line + secondary line joined for dropdown display. */
    private String description;
}
