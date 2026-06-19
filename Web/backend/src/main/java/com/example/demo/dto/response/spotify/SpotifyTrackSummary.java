package com.example.demo.dto.response.spotify;

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
public class SpotifyTrackSummary {
    private String id;
    private String name;
    private String uri;
    private String previewUrl;
    private Integer durationMs;
    private String albumName;
    private String albumImageUrl;
    private String artistsDisplay;
}
