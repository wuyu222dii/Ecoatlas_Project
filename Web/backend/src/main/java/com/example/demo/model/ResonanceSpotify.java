package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "resonance_spotify")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ResonanceSpotify {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "resonance_id", nullable = false, unique = true)
    private Long resonanceId;

    @Column(name = "spotify_track_id", nullable = false, length = 32)
    private String spotifyTrackId;

    @Column(name = "spotify_uri", length = 256)
    private String spotifyUri;

    @Column(name = "track_name", length = 512)
    private String trackName;

    @Column(name = "artist_names", columnDefinition = "TEXT")
    private String artistNames;

    @Column(name = "album_name", length = 512)
    private String albumName;

    @Column(name = "image_url", length = 1024)
    private String imageUrl;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }
}
