package com.example.demo.dto.request;

import com.example.demo.model.ai.AiRecommendMode;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AiRecommendRequest {

    /**
     * What the user wants: mood, activity, era, genre, similar-to-X, specific artists, etc.
     */
    @NotBlank(message = "userMessage is required")
    @Size(max = 4000, message = "userMessage must be at most 4000 characters")
    private String userMessage;

    /**
     * Shapes the output. MIXED is default (tracks + optional artists + optional playlist idea).
     */
    private AiRecommendMode mode = AiRecommendMode.MIXED;

    @Min(value = 1, message = "maxItems must be at least 1")
    @Max(value = 25, message = "maxItems must be at most 25")
    private int maxItems = 12;

    /**
     * Optional: which desk object / page the user came from (e.g. STUDY, WORKOUT, PARTY).
     * Does NOT restrict the AI: only used as soft context unless the user asks to align with it.
     */
    @Size(max = 120, message = "pageScene must be at most 120 characters")
    private String pageScene;

    /**
     * Language for {@code summary} and human-readable {@code note} fields: {@code en} or {@code zh}.
     */
    @Size(max = 16)
    private String locale = "en";
}
