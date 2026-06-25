package com.feedlink.backend.controller;

import com.feedlink.backend.entity.Donation;
import com.feedlink.backend.entity.DonationStatus;
import com.feedlink.backend.entity.Role;
import com.feedlink.backend.entity.User;
import com.feedlink.backend.repository.DonationRepository;
import com.feedlink.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/impact")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ImpactController {

    private final DonationRepository donationRepository;
    private final UserRepository userRepository;

    @GetMapping("/metrics")
    public ResponseEntity<Map<String, Object>> getImpactMetrics(@RequestParam(defaultValue = "month") String timeFilter) {
        List<Donation> allDonations = donationRepository.findAll();
        List<User> allUsers = userRepository.findAll();

        LocalDateTime threshold = getThresholdDateTime(timeFilter);

        // Filter donations by threshold
        List<Donation> filteredDonations = allDonations.stream()
                .filter(d -> d.getCreatedAt() != null && d.getCreatedAt().isAfter(threshold))
                .collect(Collectors.toList());

        long completedDonations = filteredDonations.stream()
                .filter(d -> d.getStatus() == DonationStatus.DELIVERED)
                .count();

        int totalMealsSaved = filteredDonations.stream()
                .filter(d -> d.getStatus() == DonationStatus.DELIVERED)
                .mapToInt(d -> d.getQuantity() != null ? d.getQuantity() : 0)
                .sum();

        double totalFoodRescuedKg = totalMealsSaved * 0.5;
        int totalPeopleFed = totalMealsSaved; // 1 meal feeds 1 person
        double co2SavedKg = totalFoodRescuedKg * 2.5;

        long activeNgos = allUsers.stream()
                .filter(u -> u.getRole() == Role.NGO && "ACTIVE".equalsIgnoreCase(u.getAccountStatus()))
                .count();

        long activeHotels = allUsers.stream()
                .filter(u -> u.getRole() == Role.HOTEL && "ACTIVE".equalsIgnoreCase(u.getAccountStatus()))
                .count();

        long totalFilteredCount = filteredDonations.size();
        double successRate = totalFilteredCount > 0 ? ((double) completedDonations / totalFilteredCount) * 100.0 : 0.0;

        // Generate trend data based on filter
        Map<String, Integer> trendMap = new TreeMap<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern(timeFilter.equalsIgnoreCase("year") ? "yyyy-MM" : "yyyy-MM-dd");

        filteredDonations.stream()
                .filter(d -> d.getStatus() == DonationStatus.DELIVERED)
                .forEach(d -> {
                    String dateKey = d.getCreatedAt().format(formatter);
                    trendMap.put(dateKey, trendMap.getOrDefault(dateKey, 0) + (d.getQuantity() != null ? d.getQuantity() : 0));
                });

        List<Map<String, Object>> trendList = new ArrayList<>();
        trendMap.forEach((k, v) -> {
            Map<String, Object> point = new HashMap<>();
            point.put("date", k);
            point.put("meals", v);
            trendList.add(point);
        });

        Map<String, Object> response = new HashMap<>();
        response.put("mealsSaved", totalMealsSaved);
        response.put("foodRescuedKg", totalFoodRescuedKg);
        response.put("peopleFed", totalPeopleFed);
        response.put("co2SavedKg", co2SavedKg);
        response.put("completedDonations", completedDonations);
        response.put("activeNgos", activeNgos);
        response.put("activeHotels", activeHotels);
        response.put("successRate", Math.round(successRate * 10.0) / 10.0);
        response.put("trends", trendList);

        return ResponseEntity.ok(response);
    }

    private LocalDateTime getThresholdDateTime(String filter) {
        LocalDateTime now = LocalDateTime.now();
        switch (filter.toLowerCase()) {
            case "today":
                return now.minusHours(24);
            case "week":
                return now.minusWeeks(1);
            case "year":
                return now.minusYears(1);
            case "month":
            default:
                return now.minusMonths(1);
        }
    }
}
