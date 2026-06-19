package com.example.demo.dto.response.resonance;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResonancePageResponse {
    private List<ResonanceListItemResponse> content;
    private long totalElements;
    private int totalPages;
    private int page;
    private int size;
}
