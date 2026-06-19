package com.example.demo.dto.response.spotify;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpotifyExchangeResponse {
    private String spotifyUserId;
    private boolean connected;
}
