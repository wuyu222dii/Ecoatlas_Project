package com.example.demo.repository;

import com.example.demo.model.Resonance;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ResonanceRepository extends JpaRepository<Resonance, Long> {

    Optional<Resonance> findByIdAndUserId(Long id, Long userId);

    Page<Resonance> findByUserIdAndDeletedAtIsNullOrderByListOrderAscIdDesc(
            Long userId, Pageable pageable);

    @Query("""
            select r from Resonance r
            where r.userId = :userId
              and r.deletedAt is null
              and (
                lower(coalesce(r.title, '')) like lower(concat('%', :q, '%'))
                or lower(coalesce(r.story, '')) like lower(concat('%', :q, '%'))
                or lower(coalesce(r.mood, '')) like lower(concat('%', :q, '%'))
              )
            order by r.listOrder asc, r.id desc
            """)
    Page<Resonance> searchActiveByUser(@Param("userId") Long userId, @Param("q") String q, Pageable pageable);

    List<Resonance> findByUserIdAndDeletedAtIsNotNullOrderByDeletedAtDesc(Long userId);

    @Query("select coalesce(max(r.listOrder), -1) from Resonance r where r.userId = :userId and r.deletedAt is null")
    int findMaxListOrderForActiveUser(@Param("userId") Long userId);

    @Query("select r from Resonance r where r.userId = :userId and r.deletedAt is null order by r.listOrder asc, r.id desc")
    List<Resonance> findAllActiveByUserIdOrderByListOrder(@Param("userId") Long userId);

    @Query("""
            select r.id as id, r.title as title, r.mood as mood, r.story as story, r.imageUrl as imageUrl,
                   r.visibility as visibility, r.createdAt as createdAt
            from Resonance r
            where r.userId = :userId and r.deletedAt is null
            order by r.listOrder asc, r.id desc
            """)
    Page<ResonanceListSummaryProjection> findActiveListSummaryByUser(@Param("userId") Long userId, Pageable pageable);

    @Query("""
            select r.id as id, r.title as title, r.mood as mood, r.story as story, r.imageUrl as imageUrl,
                   r.visibility as visibility, r.createdAt as createdAt
            from Resonance r
            where r.userId = :userId and r.deletedAt is null
              and (
                lower(coalesce(r.title, '')) like lower(concat('%', :q, '%'))
                or lower(coalesce(r.story, '')) like lower(concat('%', :q, '%'))
                or lower(coalesce(r.mood, '')) like lower(concat('%', :q, '%'))
              )
            order by r.listOrder asc, r.id desc
            """)
    Page<ResonanceListSummaryProjection> searchActiveListSummaryByUser(
            @Param("userId") Long userId, @Param("q") String q, Pageable pageable);

    @Query("""
            select r.id as id, r.title as title, r.mood as mood, r.story as story, r.imageUrl as imageUrl,
                   r.visibility as visibility, r.createdAt as createdAt
            from Resonance r
            where r.userId = :userId and r.deletedAt is not null
            order by r.deletedAt desc
            """)
    List<ResonanceListSummaryProjection> findTrashListSummaryByUser(@Param("userId") Long userId);
}
