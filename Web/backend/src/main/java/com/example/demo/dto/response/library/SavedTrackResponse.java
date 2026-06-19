package com.example.demo.dto.response.library;

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
public class SavedTrackResponse {
    private Long id;
    private String spotifyTrackId;
    private String source;
    private String trackName;
    private String artistNames;
    private String albumName;
    private String imageUrl;
    private String previewUrl;
    private Integer durationMs;
    private String spotifyUri;
    private String createdAt;
}
