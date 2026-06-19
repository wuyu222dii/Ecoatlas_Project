package com.example.demo.dto.response;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
@JsonIgnoreProperties(ignoreUnknown = true)
public class AiRecommendResponse {

    /** Short natural-language summary of how you interpreted the request. */
    private String summary;

    @Builder.Default
    private List<AiRecommendTrackDto> tracks = new ArrayList<>();

    @Builder.Default
    private List<AiRecommendArtistDto> artists = new ArrayList<>();

    /** When the user asked for a playlist-style outcome or mode is PLAYLIST_IDEA / MIXED. */
    private String playlistTitle;

    private String playlistDescription;
}
