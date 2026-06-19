package com.example.demo.repository;

import java.time.Instant;

/**
 * Columns for /resonance/list page (DTO projection: one query + batch place/track).
 */
public interface ResonanceListSummaryProjection {

    Long getId();

    String getTitle();

    String getMood();

    String getStory();

    String getImageUrl();

    String getVisibility();

    Instant getCreatedAt();
}
