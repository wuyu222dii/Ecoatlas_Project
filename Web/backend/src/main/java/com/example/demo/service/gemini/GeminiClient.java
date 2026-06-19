package com.example.demo.service.gemini;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.config.AiGeminiProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class GeminiClient {

    private final AiGeminiProperties properties;
    private final HttpClient geminiHttpClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Calls Gemini generateContent and returns the first text part (expected JSON when responseMimeType is set).
     */
    public String generateJson(String systemInstruction, String userText) {
        if (properties.getApiKey() == null || properties.getApiKey().isBlank()) {
            throw new BusinessException(503, "AI is not configured (missing ai.gemini.api-key)");
        }

        String base = properties.getBaseUrl().replaceAll("/+$", "");
        String modelId = properties.getModel();
        String url = base + "/models/" + modelId + ":generateContent?key="
                + URLEncoder.encode(properties.getApiKey(), StandardCharsets.UTF_8);

        try {
            Map<String, Object> generationConfig = Map.of(
                    "temperature", properties.getTemperature(),
                    "maxOutputTokens", properties.getMaxOutputTokens(),
                    "responseMimeType", "application/json");

            Map<String, Object> body = Map.of(
                    "systemInstruction", Map.of("parts", new Object[] { Map.of("text", systemInstruction) }),
                    "contents", new Object[] {
                        Map.of("role", "user", "parts", new Object[] { Map.of("text", userText) })
                    },
                    "generationConfig", generationConfig);

            String jsonBody = objectMapper.writeValueAsString(body);

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(properties.getRequestTimeoutSeconds()))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = geminiHttpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));

            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.warn("Gemini HTTP {} body (truncated): {}", response.statusCode(),
                        truncate(response.body(), 800));
                throw new BusinessException(502, "AI provider returned HTTP " + response.statusCode());
            }

            JsonNode root = objectMapper.readTree(response.body());
            if (root.has("error")) {
                String msg = root.path("error").path("message").asText("Unknown Gemini error");
                log.warn("Gemini error payload: {}", truncate(response.body(), 1200));
                throw new BusinessException(502, "AI provider error: " + msg);
            }

            JsonNode candidates = root.path("candidates");
            if (!candidates.isArray() || candidates.isEmpty()) {
                throw new BusinessException(502, "AI returned no candidates");
            }

            JsonNode parts = candidates.get(0).path("content").path("parts");
            if (!parts.isArray() || parts.isEmpty()) {
                throw new BusinessException(502, "AI returned empty content");
            }

            String text = parts.get(0).path("text").asText("");
            if (text.isBlank()) {
                throw new BusinessException(502, "AI returned empty text");
            }
            return text;
        } catch (BusinessException e) {
            throw e;
        } catch (Exception e) {
            log.error("Gemini request failed", e);
            throw new BusinessException(502, "AI request failed: " + e.getMessage());
        }
    }

    private static String truncate(String s, int max) {
        if (s == null) {
            return "";
        }
        return s.length() <= max ? s : s.substring(0, max) + "…";
    }
}
