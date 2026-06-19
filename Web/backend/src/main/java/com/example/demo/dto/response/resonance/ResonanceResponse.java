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
public class ResonanceResponse {
    private Long id;
    private String title;
    private String mood;
    private String story;
    private String imageUrl;
    private String visibility;
    private String createdAt;
    private String updatedAt;
    private ResonancePlaceResponse place;
    private ResonanceTrackResponse track;
}
