package com.example.demo.repository;

import com.example.demo.model.SpotifyOAuthState;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

public interface SpotifyOAuthStateRepository extends JpaRepository<SpotifyOAuthState, String> {

    @Modifying
    @Transactional
    @Query("delete from SpotifyOAuthState s where s.expiresAt < :now")
    int deleteExpired(@Param("now") Instant now);
}
