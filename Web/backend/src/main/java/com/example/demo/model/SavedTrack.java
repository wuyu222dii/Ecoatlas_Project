package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "saved_track")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SavedTrack {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "spotify_track_id", nullable = false, length = 32)
    private String spotifyTrackId;

    @Column(nullable = false, length = 32)
    @Builder.Default
    private String source = "SEARCH";

    @Column(name = "track_name", length = 512)
    private String trackName;

    @Column(name = "artist_names", columnDefinition = "TEXT")
    private String artistNames;

    @Column(name = "album_name", length = 512)
    private String albumName;

    @Column(name = "image_url", length = 1024)
    private String imageUrl;

    @Column(name = "preview_url", length = 1024)
    private String previewUrl;

    @Column(name = "duration_ms")
    private Integer durationMs;

    @Column(name = "spotify_uri", length = 256)
    private String spotifyUri;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @PrePersist
    void prePersist() {
        createdAt = Instant.now();
    }
}
