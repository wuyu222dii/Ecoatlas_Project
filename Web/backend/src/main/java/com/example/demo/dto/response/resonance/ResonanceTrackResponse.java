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
public class ResonanceTrackResponse {
    private String spotifyTrackId;
    private String spotifyUri;
    private String trackName;
    private String artistNames;
    private String albumName;
    private String imageUrl;
}
