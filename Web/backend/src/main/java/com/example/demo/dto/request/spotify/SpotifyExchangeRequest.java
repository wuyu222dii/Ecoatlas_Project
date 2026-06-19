package com.example.demo.dto.request.spotify;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SpotifyExchangeRequest {

    @NotBlank(message = "code is required")
    @Size(max = 2048)
    private String code;

    @NotBlank(message = "codeVerifier is required")
    @Size(max = 2048)
    private String codeVerifier;

    @NotBlank(message = "state is required")
    @Size(max = 128)
    private String state;

    @Size(max = 1024)
    private String redirectUri;
}
