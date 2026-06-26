package com.feedlink.backend.controller;

import com.feedlink.backend.dto.*;
import com.feedlink.backend.entity.User;
import com.feedlink.backend.service.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AiController {

    private final AiService aiService;

    @PostMapping("/analyze-food")
    public ResponseEntity<FoodAnalysisResponse> analyzeFood(
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal User user
    ) {
        try {
            String userEmail = user != null ? user.getEmail() : "anonymous";
            return ResponseEntity.ok(aiService.analyzeFood(file, userEmail));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/estimate-servings")
    public ResponseEntity<ServingEstimationResponse> estimateServings(
            @RequestParam("file") MultipartFile file,
            @RequestParam("quantity") String quantity,
            @RequestParam("foodType") String foodType
    ) {
        try {
            return ResponseEntity.ok(aiService.estimateServings(file, quantity, foodType));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/recommend-ngos")
    public ResponseEntity<Map<String, Object>> recommendNgos(
            @RequestBody NgoRecommendationRequest request
    ) {
        return ResponseEntity.ok(aiService.recommendNgos(request));
    }

    @GetMapping("/analytics")
    public ResponseEntity<Map<String, Object>> getAnalytics() {
        return ResponseEntity.ok(aiService.getAnalytics());
    }

    @GetMapping("/demand-forecast")
    public ResponseEntity<Map<String, Object>> getDemandForecast() {
        return ResponseEntity.ok(aiService.getDemandForecast());
    }

    @PostMapping("/feedback")
    public ResponseEntity<Void> submitFeedback(@RequestBody Map<String, Object> feedback) {
        aiService.submitFeedback(feedback);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/dataset-stats")
    public ResponseEntity<Map<String, Object>> getDatasetStats() {
        return ResponseEntity.ok(aiService.getDatasetStats());
    }

    @GetMapping("/model-version")
    public ResponseEntity<Map<String, Object>> getModelVersion() {
        return ResponseEntity.ok(aiService.getModelVersion());
    }

    @GetMapping("/predictions")
    public ResponseEntity<Map<String, Object>> getPredictions(
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "limit", defaultValue = "10") int limit,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "foodType", required = false) String foodType,
            @RequestParam(value = "category", required = false) String category,
            @RequestParam(value = "userEmail", required = false) String userEmail
    ) {
        return ResponseEntity.ok(aiService.getPredictions(page, limit, search, foodType, category, userEmail));
    }

    @GetMapping("/ai-health")
    public ResponseEntity<Map<String, Object>> getAiHealth() {
        return ResponseEntity.ok(aiService.getAiHealth());
    }

    @GetMapping("/feedback-stats")
    public ResponseEntity<Map<String, Object>> getFeedbackStats() {
        return ResponseEntity.ok(aiService.getFeedbackStats());
    }
}
