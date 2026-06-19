package com.example.demo.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "spotify")
public class SpotifyProperties {

    private String clientId = "";

    private String clientSecret = "";

    /** Must match a Spotify App Redirect URI exactly (page that receives ?code=). */
    private String defaultRedirectUri = "http://localhost:5173/spotify-callback";

    private String authorizationUrl = "https://accounts.spotify.com/authorize";

    private String tokenUrl = "https://accounts.spotify.com/api/token";

    private String apiBaseUrl = "https://api.spotify.com/v1";

    /** Space-separated scopes for the authorize URL. */
    private String scopes = "user-read-email user-read-private user-library-read user-library-modify";

    /** PKCE state row TTL in minutes. */
    private int stateTtlMinutes = 10;

    private int httpTimeoutSeconds = 30;
}
