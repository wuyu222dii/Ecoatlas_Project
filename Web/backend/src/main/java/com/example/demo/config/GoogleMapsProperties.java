package com.example.demo.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "google.maps")
public class GoogleMapsProperties {

    /**
     * Server key with Places API (New) enabled. Use env {@code GOOGLE_MAPS_API_KEY}.
     */
    private String apiKey = "";

    private String baseUrl = "https://places.googleapis.com/v1";

    private int requestTimeoutSeconds = 15;
}
