package com.feedlink.backend.service;

import com.feedlink.backend.repository.DonationRepository;
import com.feedlink.backend.entity.DonationStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ImpactService {

    private final DonationRepository donationRepository;

    public Map<String, Object> calculateGlobalImpact() {
        long totalMealsSaved = donationRepository.findByStatus(DonationStatus.DELIVERED)
                .stream()
                .mapToLong(d -> d.getQuantity())
                .sum();

        double foodSavedKg = totalMealsSaved * 0.5; // Assume 0.5kg per serving
        double co2ReducedKg = foodSavedKg * 2.5; // Assume 2.5kg CO2 per kg food waste

        Map<String, Object> impact = new HashMap<>();
        impact.put("mealsSaved", totalMealsSaved);
        impact.put("foodSavedKg", foodSavedKg);
        impact.put("co2ReducedKg", co2ReducedKg);
        impact.put("peopleFed", totalMealsSaved); // Simple 1:1 for now

        return impact;
    }
}
