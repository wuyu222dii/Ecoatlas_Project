package com.example.demo.repository;

import com.example.demo.model.ResonanceSpotify;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ResonanceSpotifyRepository extends JpaRepository<ResonanceSpotify, Long> {

    Optional<ResonanceSpotify> findByResonanceId(Long resonanceId);

    List<ResonanceSpotify> findAllByResonanceIdIn(Collection<Long> resonanceIds);
}
