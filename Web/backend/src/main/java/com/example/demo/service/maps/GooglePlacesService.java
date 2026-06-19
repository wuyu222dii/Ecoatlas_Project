package com.example.demo.service.maps;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.config.GoogleMapsProperties;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

/**
 * Google Places API (New) — place details + Autocomplete (proxy for the app).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class GooglePlacesService {

    private final GoogleMapsProperties properties;
    private final HttpClient googlePlacesHttpClient;
    private final ObjectMapper objectMapper;

    public ResolvedGooglePlace resolveByPlaceId(String placeId) {
        if (placeId == null || placeId.isBlank()) {
            throw new BusinessException(400, "googlePlaceId is required");
        }
        if (properties.getApiKey() == null || properties.getApiKey().isBlank()) {
            throw new BusinessException(503,
                    "Google Maps API key not configured (google.maps.api-key or GOOGLE_MAPS_API_KEY)");
        }
        String trimmed = placeId.trim();
        String encoded = URLEncoder.encode(trimmed, StandardCharsets.UTF_8).replace("+", "%20");
        String base = properties.getBaseUrl().replaceAll("/+$", "");
        String url = base + "/places/" + encoded;

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(Math.max(1, properties.getRequestTimeoutSeconds())))
                .header("X-Goog-Api-Key", properties.getApiKey())
                .header("X-Goog-FieldMask", "id,displayName,formattedAddress,location")
                .GET()
                .build();

        String body;
        int status;
        try {
            HttpResponse<String> response = googlePlacesHttpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            status = response.statusCode();
            body = response.body();
        } catch (IOException e) {
            log.warn("Google Places request failed: {}", e.getMessage());
            throw new BusinessException(502, "Google Places request failed");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BusinessException(502, "Google Places request interrupted");
        }

        if (status == 404) {
            throw new BusinessException(404, "Google place not found");
        }
        if (status < 200 || status >= 300) {
            log.warn("Google Places HTTP {}: {}", status, body != null && body.length() > 300 ? body.substring(0, 300) : body);
            throw new BusinessException(502, "Google Places error (HTTP " + status + ")");
        }

        JsonNode root;
        try {
            root = objectMapper.readTree(body);
        } catch (IOException e) {
            throw new BusinessException(502, "Invalid Google Places response");
        }

        JsonNode error = root.get("error");
        if (error != null && !error.isNull()) {
            throw new BusinessException(502, "Google Places: " + error.path("message").asText("unknown"));
        }

        String fullResourceId = text(root, "id");
        String canonicalPlaceId = fullResourceId;
        if (canonicalPlaceId != null && canonicalPlaceId.startsWith("places/")) {
            canonicalPlaceId = canonicalPlaceId.substring("places/".length());
        }

        String placeName = text(root.path("displayName"), "text");
        String formattedAddress = text(root, "formattedAddress");

        JsonNode loc = root.get("location");
        if (loc == null || loc.isNull() || !loc.hasNonNull("latitude") || !loc.hasNonNull("longitude")) {
            throw new BusinessException(502, "Google Places response missing location");
        }
        BigDecimal lat = loc.get("latitude").decimalValue();
        BigDecimal lng = loc.get("longitude").decimalValue();

        return new ResolvedGooglePlace(canonicalPlaceId, placeName, formattedAddress, lat, lng);
    }

    /**
     * POST places:autocomplete — returns up to five place predictions.
     */
    public List<AutocompleteItem> autocompletePredictions(String rawInput) {
        if (rawInput == null || rawInput.isBlank()) {
            throw new BusinessException(400, "input is required");
        }
        if (properties.getApiKey() == null || properties.getApiKey().isBlank()) {
            throw new BusinessException(503,
                    "Google Maps API key not configured (google.maps.api-key or GOOGLE_MAPS_API_KEY)");
        }
        String trimmed = rawInput.trim();
        String base = properties.getBaseUrl().replaceAll("/+$", "");
        String url = base + "/places:autocomplete";

        String jsonBody = objectMapper.createObjectNode().put("input", trimmed).toString();

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(Math.max(1, properties.getRequestTimeoutSeconds())))
                .header("Content-Type", "application/json; charset=utf-8")
                .header("X-Goog-Api-Key", properties.getApiKey())
                .header(
                        "X-Goog-FieldMask",
                        "suggestions.placePrediction.placeId,"
                                + "suggestions.placePrediction.text,"
                                + "suggestions.placePrediction.structuredFormat")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                .build();

        String body;
        int status;
        try {
            HttpResponse<String> response = googlePlacesHttpClient.send(
                    request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            status = response.statusCode();
            body = response.body();
        } catch (IOException e) {
            log.warn("Google Places Autocomplete failed: {}", e.getMessage());
            throw new BusinessException(502, "Google Places Autocomplete request failed");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new BusinessException(502, "Google Places Autocomplete interrupted");
        }

        if (status < 200 || status >= 300) {
            log.warn("Places Autocomplete HTTP {}: {}",
                    status, body != null && body.length() > 350 ? body.substring(0, 350) : body);
            throw new BusinessException(502, "Google Places Autocomplete error (HTTP " + status + ")");
        }

        JsonNode root;
        try {
            root = objectMapper.readTree(body);
        } catch (IOException e) {
            throw new BusinessException(502, "Invalid Google Places Autocomplete response");
        }

        JsonNode error = root.get("error");
        if (error != null && !error.isNull()) {
            throw new BusinessException(502, "Google Places Autocomplete: " + error.path("message").asText("unknown"));
        }

        JsonNode suggestions = root.get("suggestions");
        if (suggestions == null || !suggestions.isArray()) {
            return List.of();
        }

        List<AutocompleteItem> out = new ArrayList<>();
        for (JsonNode row : suggestions) {
            JsonNode pp = row.get("placePrediction");
            if (pp == null || pp.isNull()) {
                continue;
            }
            String placeId = text(pp, "placeId");
            if (placeId == null || placeId.isBlank()) {
                JsonNode placeNode = pp.get("place");
                if (placeNode != null && placeNode.isTextual()) {
                    String p = placeNode.asText();
                    if (p.startsWith("places/")) {
                        placeId = p.substring("places/".length());
                    }
                }
            }
            if (placeId == null || placeId.isBlank()) {
                continue;
            }
            String fullText = text(pp.path("text"), "text");
            JsonNode sf = pp.get("structuredFormat");
            String main = text(sf != null ? sf.path("mainText") : null, "text");
            String secondary = text(sf != null ? sf.path("secondaryText") : null, "text");
            String description;
            if (main != null && secondary != null) {
                description = main + ", " + secondary;
            } else if (main != null) {
                description = main;
            } else {
                description = fullText != null ? fullText : placeId;
            }
            out.add(new AutocompleteItem(placeId, description));
        }
        return out;
    }

    public record AutocompleteItem(String placeId, String description) {}

    private static String text(JsonNode n, String field) {
        if (n == null || n.isMissingNode() || n.isNull()) {
            return null;
        }
        JsonNode v = n.get(field);
        if (v == null || v.isNull()) {
            return null;
        }
        String s = v.asText();
        return s.isBlank() ? null : s;
    }

    public record ResolvedGooglePlace(
            String googlePlaceId,
            String placeName,
            String formattedAddress,
            BigDecimal latitude,
            BigDecimal longitude
    ) {}
}
