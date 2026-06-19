package com.example.demo.dto.response.ai;

import com.example.demo.dto.response.spotify.SpotifyTrackSummary;
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
public class AiResolvedTrackItem {
    private String requestedTitle;
    private String requestedArtist;
    private Boolean matched;
    private String matchNote;
    private SpotifyTrackSummary spotify;
}
