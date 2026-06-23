package com.feedlink.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class NgoRecommendationRequest {
    private double latitude;
    private double longitude;
    private String foodType;
    private int estimatedServings;
}
