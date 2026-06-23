package com.feedlink.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class FoodAnalysisResponse {
    private String category;
    private String foodType;
    private double confidence;
    private double freshnessScore;
    private String recommendation;
}
