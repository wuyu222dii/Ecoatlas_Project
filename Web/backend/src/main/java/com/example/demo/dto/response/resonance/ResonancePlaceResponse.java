package com.example.demo.dto.response.resonance;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ResonancePlaceResponse {
    private String placeName;
    private String address;
    private String latitude;
    private String longitude;
    private String googlePlaceId;
}
