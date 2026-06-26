package com.feedlink.backend.service;

import com.feedlink.backend.dto.*;
import com.feedlink.backend.entity.Ngo;
import com.feedlink.backend.entity.User;
import com.feedlink.backend.entity.AIPredictionLog;
import com.feedlink.backend.repository.NgoRepository;
import com.feedlink.backend.repository.AIPredictionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.util.UriComponentsBuilder;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class AiService {

    private final NgoRepository ngoRepository;
    private final AIPredictionRepository aiPredictionRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final String FASTAPI_URL = "http://localhost:8000";

    public FoodAnalysisResponse analyzeFood(MultipartFile file, String userEmail) throws IOException {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        if (userEmail != null) {
            headers.set("X-User-Email", userEmail);
        }

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return file.getOriginalFilename();
            }
        };
        body.add("file", fileResource);

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        ResponseEntity<FoodAnalysisResponse> response = restTemplate.postForEntity(
                FASTAPI_URL + "/analyze",
                requestEntity,
                FoodAnalysisResponse.class
        );

        FoodAnalysisResponse responseBody = response.getBody();
        if (responseBody != null) {
            AIPredictionLog log = AIPredictionLog.builder()
                    .foodType(responseBody.getFoodType())
                    .category(responseBody.getCategory())
                    .confidence(responseBody.getConfidence())
                    .freshnessScore(responseBody.getFreshnessScore())
                    .imageUrl(responseBody.getImageUrl())
                    .userEmail(userEmail != null ? userEmail : "anonymous")
                    .predictionRaw(responseBody.getExplanation())
                    .timestamp(LocalDateTime.now())
                    .build();
            aiPredictionRepository.save(log);
        }

        return responseBody;
    }

    public ServingEstimationResponse estimateServings(MultipartFile file, String quantity, String foodType) throws IOException {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
            @Override
            public String getFilename() {
                return file.getOriginalFilename();
            }
        };
        body.add("file", fileResource);
        body.add("quantity", quantity);
        body.add("foodType", foodType);

        HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

        ResponseEntity<ServingEstimationResponse> response = restTemplate.postForEntity(
                FASTAPI_URL + "/estimate-servings",
                requestEntity,
                ServingEstimationResponse.class
        );

        return response.getBody();
    }

    public Map<String, Object> recommendNgos(NgoRecommendationRequest request) {
        // Fetch all active NGOs
        List<Ngo> activeNgos = ngoRepository.findAll();
        List<Map<String, Object>> ngoPayload = new ArrayList<>();

        for (Ngo ngo : activeNgos) {
            if ("APPROVED".equalsIgnoreCase(ngo.getApprovalStatus()) && ngo.getUser() != null) {
                User user = ngo.getUser();
                Map<String, Object> map = new HashMap<>();
                map.put("id", ngo.getId());
                map.put("name", ngo.getNgoName());
                map.put("latitude", user.getLatitude() != null ? user.getLatitude() : 0.0);
                map.put("longitude", user.getLongitude() != null ? user.getLongitude() : 0.0);
                map.put("capacity", servingsToCapacity(request.getEstimatedServings()));
                map.put("acceptanceRate", 0.88 + (ngo.getId() % 10) * 0.01);
                map.put("responseTimeHours", 0.5 + (ngo.getId() % 5) * 0.3);
                ngoPayload.add(map);
            }
        }

        // Call FastAPI /recommend
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("latitude", request.getLatitude());
        requestBody.put("longitude", request.getLongitude());
        requestBody.put("foodType", request.getFoodType());
        requestBody.put("estimatedServings", request.getEstimatedServings());
        requestBody.put("ngos", ngoPayload);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(requestBody, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(
                FASTAPI_URL + "/recommend",
                requestEntity,
                Map.class
        );

        return response.getBody();
    }

    public Map<String, Object> getAnalytics() {
        ResponseEntity<Map> response = restTemplate.getForEntity(
                FASTAPI_URL + "/analytics",
                Map.class
        );
        return response.getBody();
    }

    private String servingsToCapacity(int servings) {
        if (servings > 50) return "HIGH";
        if (servings > 20) return "MEDIUM";
        return "LOW";
    }

    public Map<String, Object> chatbotMessage(Map<String, Object> payload) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(payload, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(
                FASTAPI_URL + "/chat",
                requestEntity,
                Map.class
        );
        return response.getBody();
    }

    public Map<String, Object> getDemandForecast() {
        ResponseEntity<Map> response = restTemplate.getForEntity(
                FASTAPI_URL + "/forecast",
                Map.class
        );
        return response.getBody();
    }

    public void submitFeedback(Map<String, Object> feedback) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> requestEntity = new HttpEntity<>(feedback, headers);

        restTemplate.postForEntity(
                FASTAPI_URL + "/feedback",
                requestEntity,
                Void.class
        );
    }

    public Map<String, Object> getDatasetStats() {
        ResponseEntity<Map> response = restTemplate.getForEntity(
                FASTAPI_URL + "/dataset-stats",
                Map.class
        );
        return response.getBody();
    }

    public Map<String, Object> getModelVersion() {
        ResponseEntity<Map> response = restTemplate.getForEntity(
                FASTAPI_URL + "/model-version",
                Map.class
        );
        return response.getBody();
    }

    public Map<String, Object> getAiHealth() {
        ResponseEntity<Map> response = restTemplate.getForEntity(
                FASTAPI_URL + "/ai-health",
                Map.class
        );
        return response.getBody();
    }

    public Map<String, Object> getFeedbackStats() {
        ResponseEntity<Map> response = restTemplate.getForEntity(
                FASTAPI_URL + "/feedback-stats",
                Map.class
        );
        return response.getBody();
    }

    public Map<String, Object> getPredictions(int page, int limit, String search, String foodType, String category, String userEmail) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromHttpUrl(FASTAPI_URL + "/predictions")
                .queryParam("page", page)
                .queryParam("limit", limit);
        if (search != null && !search.trim().isEmpty()) builder.queryParam("search", search.trim());
        if (foodType != null && !foodType.trim().isEmpty()) builder.queryParam("foodType", foodType.trim());
        if (category != null && !category.trim().isEmpty()) builder.queryParam("category", category.trim());
        if (userEmail != null && !userEmail.trim().isEmpty()) builder.queryParam("userEmail", userEmail.trim());

        ResponseEntity<Map> response = restTemplate.getForEntity(
                builder.toUriString(),
                Map.class
        );
        return response.getBody();
    }
}
