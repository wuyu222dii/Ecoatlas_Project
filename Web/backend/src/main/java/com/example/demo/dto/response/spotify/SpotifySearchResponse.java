package com.example.demo.dto.response.spotify;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpotifySearchResponse {
    private List<SpotifyTrackSummary> tracks;
}
