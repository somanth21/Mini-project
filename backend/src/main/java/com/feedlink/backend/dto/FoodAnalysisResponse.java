package com.feedlink.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

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
    private String explanation;
    private List<Map<String, Object>> top3Predictions;
    private double inferenceTime;
    private String imageUrl;
}
