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
public class ResonanceListItemResponse {
    private Long id;
    private String title;
    private String mood;
    private String story;
    private String imageUrl;
    private String visibility;
    private String placeName;
    private String trackName;
    private String createdAt;
    /** Full place payload for map clients (avoids N detail calls). */
    private ResonancePlaceResponse place;
    private ResonanceTrackResponse track;
}
