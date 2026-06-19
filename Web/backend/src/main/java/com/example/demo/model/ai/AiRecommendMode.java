package com.example.demo.model.ai;

/**
 * Controls what the model should emphasise in the JSON response.
 */
public enum AiRecommendMode {
    /** Song-level recommendations (title + artist, optional album). */
    TRACKS,
    /** Artist-level recommendations (name + short note). */
    ARTISTS,
    /** A coherent playlist title + description + representative tracks. */
    PLAYLIST_IDEA,
    /** Balanced: tracks as primary, optional artists and optional playlist framing. */
    MIXED
}
