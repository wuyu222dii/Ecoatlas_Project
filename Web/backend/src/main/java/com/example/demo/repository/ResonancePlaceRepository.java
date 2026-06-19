package com.example.demo.repository;

import com.example.demo.model.ResonancePlace;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ResonancePlaceRepository extends JpaRepository<ResonancePlace, Long> {

    Optional<ResonancePlace> findByResonanceId(Long resonanceId);

    List<ResonancePlace> findAllByResonanceIdIn(Collection<Long> resonanceIds);
}
