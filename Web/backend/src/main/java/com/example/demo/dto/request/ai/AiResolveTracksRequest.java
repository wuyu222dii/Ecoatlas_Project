package com.example.demo.dto.request.ai;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.util.List;

@Data
public class AiResolveTracksRequest {

    @NotEmpty(message = "items must not be empty")
    @Size(max = 25)
    @Valid
    private List<TitleArtistItem> items;

    @Data
    public static class TitleArtistItem {

        @Size(max = 512)
        private String title;

        @Size(max = 512)
        private String artist;
    }
}
