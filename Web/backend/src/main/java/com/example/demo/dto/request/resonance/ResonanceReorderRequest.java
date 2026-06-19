package com.example.demo.dto.request.resonance;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class ResonanceReorderRequest {

    /** All active (non-deleted) resonance ids for this user, in desired sidebar order (top first). */
    @NotEmpty
    private List<Long> orderedResonanceIds;
}
