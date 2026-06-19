package com.example.demo.repository;

import com.example.demo.model.SavedTrack;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface SavedTrackRepository extends JpaRepository<SavedTrack, Long> {

    boolean existsByUserIdAndSpotifyTrackId(Long userId, String spotifyTrackId);

    Optional<SavedTrack> findByUserIdAndSpotifyTrackId(Long userId, String spotifyTrackId);

    Page<SavedTrack> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    @Query("""
            select s from SavedTrack s
            where s.userId = :userId
              and (
                lower(coalesce(s.trackName, '')) like lower(concat('%', :q, '%'))
                or lower(coalesce(s.artistNames, '')) like lower(concat('%', :q, '%'))
                or lower(coalesce(s.albumName, '')) like lower(concat('%', :q, '%'))
              )
            order by s.createdAt desc
            """)
    Page<SavedTrack> searchByUser(@Param("userId") Long userId, @Param("q") String q, Pageable pageable);
}
