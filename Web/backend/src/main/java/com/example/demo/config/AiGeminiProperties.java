package com.example.demo.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;

@Data
@ConfigurationProperties(prefix = "ai.gemini")
public class AiGeminiProperties {

    /**
     * Google AI Studio / Gemini API key. TODO: move to environment variables before production.
     */
    private String apiKey = "";

    private String model = "gemini-2.0-flash";

    private String baseUrl = "https://generativelanguage.googleapis.com/v1beta";

    /** Lower = more deterministic JSON; raise slightly if results feel too repetitive. */
    private double temperature = 0.45;

    private int maxOutputTokens = 8192;

    /** HTTP timeout for Gemini (seconds). */
    private int requestTimeoutSeconds = 90;
}
