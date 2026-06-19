package com.example.demo.dto.request.spotify;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class SpotifyAuthorizeUrlRequest {

    /** If empty, server default-redirect-uri is used. */
    @Size(max = 1024)
    private String redirectUri;

    @NotBlank(message = "codeChallenge is required")
    @Size(max = 2048)
    private String codeChallenge;

    /** Use S256; may pass S256 explicitly. */
    @Size(max = 16)
    private String codeChallengeMethod = "S256";
}
