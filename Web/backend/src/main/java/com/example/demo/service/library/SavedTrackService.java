package com.example.demo.service.library;

import com.example.demo.common.exception.BusinessException;
import com.example.demo.dto.request.library.SavedTrackListRequest;
import com.example.demo.dto.request.library.SavedTrackRemoveRequest;
import com.example.demo.dto.request.library.SavedTrackSaveRequest;
import com.example.demo.dto.request.library.SavedTrackSearchRequest;
import com.example.demo.dto.response.library.SavedTrackPageResponse;
import com.example.demo.dto.response.library.SavedTrackResponse;
import com.example.demo.dto.request.spotify.SpotifyTrackDetailRequest;
import com.example.demo.dto.response.spotify.SpotifyTrackSummary;
import com.example.demo.model.SavedTrack;
import com.example.demo.repository.SavedTrackRepository;
import com.example.demo.service.spotify.SpotifyAccountService;
import com.example.demo.service.spotify.SpotifyCatalogService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.ZoneOffset;

@Service
@RequiredArgsConstructor
public class SavedTrackService {

    private final SavedTrackRepository savedTrackRepository;
    private final SpotifyAccountService spotifyAccountService;
    private final SpotifyCatalogService spotifyCatalogService;

    @Transactional
    public SavedTrackResponse save(Long userId, SavedTrackSaveRequest request) {
        spotifyAccountService.requireConnection(userId);
        if (savedTrackRepository.existsByUserIdAndSpotifyTrackId(userId, request.getSpotifyTrackId())) {
            throw new BusinessException(409, "Track already saved");
        }
        SpotifyTrackDetailRequest detailReq = new SpotifyTrackDetailRequest();
        detailReq.setTrackId(request.getSpotifyTrackId());
        SpotifyTrackSummary meta = spotifyCatalogService.getTrack(userId, detailReq);

        SavedTrack entity = SavedTrack.builder()
                .userId(userId)
                .spotifyTrackId(request.getSpotifyTrackId())
                .source(request.getSource() != null ? request.getSource() : "SEARCH")
                .trackName(meta.getName())
                .artistNames(meta.getArtistsDisplay())
                .albumName(meta.getAlbumName())
                .imageUrl(meta.getAlbumImageUrl())
                .previewUrl(meta.getPreviewUrl())
                .durationMs(meta.getDurationMs())
                .spotifyUri(meta.getUri())
                .build();
        savedTrackRepository.save(entity);
        return toResponse(entity);
    }

    @Transactional
    public void remove(Long userId, SavedTrackRemoveRequest request) {
        SavedTrack st = savedTrackRepository.findByUserIdAndSpotifyTrackId(userId, request.getSpotifyTrackId())
                .orElseThrow(() -> new BusinessException(404, "Saved track not found"));
        savedTrackRepository.delete(st);
    }

    public SavedTrackPageResponse list(Long userId, SavedTrackListRequest request) {
        Page<SavedTrack> page = savedTrackRepository.findByUserIdOrderByCreatedAtDesc(
                userId, PageRequest.of(request.getPage(), request.getSize()));
        return toPage(page, request.getPage(), request.getSize());
    }

    public SavedTrackPageResponse search(Long userId, SavedTrackSearchRequest request) {
        Page<SavedTrack> page = savedTrackRepository.searchByUser(
                userId, request.getQ().trim(), PageRequest.of(request.getPage(), request.getSize()));
        return toPage(page, request.getPage(), request.getSize());
    }

    private SavedTrackPageResponse toPage(Page<SavedTrack> page, int pageNum, int size) {
        return SavedTrackPageResponse.builder()
                .content(page.getContent().stream().map(this::toResponse).toList())
                .totalElements(page.getTotalElements())
                .totalPages(page.getTotalPages())
                .page(pageNum)
                .size(size)
                .build();
    }

    private SavedTrackResponse toResponse(SavedTrack s) {
        return SavedTrackResponse.builder()
                .id(s.getId())
                .spotifyTrackId(s.getSpotifyTrackId())
                .source(s.getSource())
                .trackName(s.getTrackName())
                .artistNames(s.getArtistNames())
                .albumName(s.getAlbumName())
                .imageUrl(s.getImageUrl())
                .previewUrl(s.getPreviewUrl())
                .durationMs(s.getDurationMs())
                .spotifyUri(s.getSpotifyUri())
                .createdAt(s.getCreatedAt().atOffset(ZoneOffset.UTC).toString())
                .build();
    }
}
