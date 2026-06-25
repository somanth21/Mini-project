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
import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/analytics")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AnalyticsController {

    private final DonationRepository donationRepository;
    private final UserRepository userRepository;

    @GetMapping("/hotspots")
    public ResponseEntity<List<Map<String, Object>>> getHotspots() {
        List<Donation> allDonations = donationRepository.findAll();
        Map<String, List<Donation>> groupedByArea = allDonations.stream()
                .collect(Collectors.groupingBy(d -> parseNeighborhood(d.getPickupAddress())));

        List<Map<String, Object>> hotspots = new ArrayList<>();
        groupedByArea.forEach((area, list) -> {
            int wasted = list.stream()
                    .mapToInt(d -> d.getQuantity() != null ? d.getQuantity() : 0)
                    .sum();
            
            int rescued = list.stream()
                    .filter(d -> d.getStatus() == DonationStatus.DELIVERED)
                    .mapToInt(d -> d.getQuantity() != null ? d.getQuantity() : 0)
                    .sum();

            long availableCount = list.stream()
                    .filter(d -> d.getStatus() == DonationStatus.AVAILABLE)
                    .count();

            Map<String, Object> hotspot = new HashMap<>();
            hotspot.put("neighborhood", area);
            hotspot.put("foodWastedKg", wasted * 0.5);
            hotspot.put("foodRescuedKg", rescued * 0.5);
            hotspot.put("availableDonations", availableCount);
            hotspot.put("ngoExpansionNeeded", availableCount > 0);
            hotspot.put("demandIndex", list.size());
            hotspots.add(hotspot);
        });

        hotspots.sort((a, b) -> Double.compare((double) b.get("foodWastedKg"), (double) a.get("foodWastedKg")));
        return ResponseEntity.ok(hotspots);
    }

    @GetMapping("/ngo-performance")
    public ResponseEntity<List<Map<String, Object>>> getNgoPerformance() {
        List<User> ngos = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.NGO)
                .collect(Collectors.toList());

        List<Donation> allDonations = donationRepository.findAll();

        List<Map<String, Object>> performanceList = new ArrayList<>();
        for (User ngo : ngos) {
            List<Donation> ngoDonations = allDonations.stream()
                    .filter(d -> d.getNgo() != null && d.getNgo().getId().equals(ngo.getId()))
                    .collect(Collectors.toList());

            long accepted = ngoDonations.size();
            long completed = ngoDonations.stream()
                    .filter(d -> d.getStatus() == DonationStatus.DELIVERED)
                    .count();

            int mealsDistributed = ngoDonations.stream()
                    .filter(d -> d.getStatus() == DonationStatus.DELIVERED)
                    .mapToInt(d -> d.getQuantity() != null ? d.getQuantity() : 0)
                    .sum();

            double successRate = accepted > 0 ? ((double) completed / accepted) * 100.0 : 0.0;

            // Calculate average response/pickup time in hours
            double avgResponseHours = 0.0;
            List<Donation> timedDonations = ngoDonations.stream()
                    .filter(d -> d.getAcceptedAt() != null && d.getDeliveredAt() != null)
                    .collect(Collectors.toList());
            if (!timedDonations.isEmpty()) {
                long totalMinutes = timedDonations.stream()
                        .mapToLong(d -> Duration.between(d.getAcceptedAt(), d.getDeliveredAt()).toMinutes())
                        .sum();
                avgResponseHours = (double) totalMinutes / timedDonations.size() / 60.0;
            } else {
                avgResponseHours = 1.5; // default fallback if no timestamps logged
            }

            Map<String, Object> perf = new HashMap<>();
            perf.put("id", ngo.getId());
            perf.put("name", ngo.getName());
            perf.put("mealsDistributed", mealsDistributed);
            perf.put("pickupSuccessRate", Math.round(successRate * 10.0) / 10.0);
            perf.put("responseTimeHours", Math.round(avgResponseHours * 10.0) / 10.0);
            perf.put("donationsAccepted", accepted);
            perf.put("deliveryCompletionRate", Math.round(successRate * 10.0) / 10.0);
            performanceList.add(perf);
        }

        performanceList.sort((a, b) -> Integer.compare((int) b.get("mealsDistributed"), (int) a.get("mealsDistributed")));
        return ResponseEntity.ok(performanceList);
    }

    @GetMapping("/hotel-performance")
    public ResponseEntity<List<Map<String, Object>>> getHotelPerformance() {
        List<User> hotels = userRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.HOTEL)
                .collect(Collectors.toList());

        List<Donation> allDonations = donationRepository.findAll();

        List<Map<String, Object>> performanceList = new ArrayList<>();
        for (User hotel : hotels) {
            List<Donation> hotelDonations = allDonations.stream()
                    .filter(d -> d.getDonor().getId().equals(hotel.getId()))
                    .collect(Collectors.toList());

            long totalDonations = hotelDonations.size();
            long completed = hotelDonations.stream()
                    .filter(d -> d.getStatus() == DonationStatus.DELIVERED)
                    .count();

            int mealsDonated = hotelDonations.stream()
                    .filter(d -> d.getStatus() == DonationStatus.DELIVERED)
                    .mapToInt(d -> d.getQuantity() != null ? d.getQuantity() : 0)
                    .sum();

            long uniqueNgos = hotelDonations.stream()
                    .filter(d -> d.getNgo() != null)
                    .map(d -> d.getNgo().getId())
                    .distinct()
                    .count();

            double foodSavedKg = mealsDonated * 0.5;
            double carbonImpact = foodSavedKg * 2.5;

            Map<String, Object> perf = new HashMap<>();
            perf.put("id", hotel.getId());
            perf.put("name", hotel.getName());
            perf.put("mealsDonated", mealsDonated);
            perf.put("foodSavedKg", foodSavedKg);
            perf.put("carbonImpactKg", carbonImpact);
            perf.put("donationFrequency", totalDonations);
            perf.put("ngoInteractions", uniqueNgos);
            performanceList.add(perf);
        }

        performanceList.sort((a, b) -> Integer.compare((int) b.get("mealsDonated"), (int) a.get("mealsDonated")));
        return ResponseEntity.ok(performanceList);
    }

    private String parseNeighborhood(String address) {
        if (address == null) return "Other";
        String lower = address.toLowerCase();
        if (lower.contains("madhapur")) return "Madhapur";
        if (lower.contains("gachibowli")) return "Gachibowli";
        if (lower.contains("kondapur")) return "Kondapur";
        if (lower.contains("jubilee hills")) return "Jubilee Hills";
        if (lower.contains("banjara hills")) return "Banjara Hills";
        if (lower.contains("begumpet")) return "Begumpet";
        return "City Center";
    }
}
