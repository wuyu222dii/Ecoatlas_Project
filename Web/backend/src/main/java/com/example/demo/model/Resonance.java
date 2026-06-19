package com.example.demo.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;

@Entity
@Table(name = "resonance")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Resonance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(length = 255)
    private String title;

    @Column(length = 64)
    private String mood;

    @Column(columnDefinition = "TEXT")
    private String story;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    @Column(nullable = false, length = 16)
    @Builder.Default
    private String visibility = "PRIVATE";

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /** Non-null means moved to recycle bin (soft delete). */
    @Column(name = "deleted_at")
    private Instant deletedAt;

    /** Lower values appear first in the sidebar (user drag order). */
    @Column(name = "list_order", nullable = false)
    @Builder.Default
    private Integer listOrder = 0;

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
