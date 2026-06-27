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
import java.util.*;

@RestController
@RequestMapping("/api/maps")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class MapController {

    private final DonationRepository donationRepository;
    private final UserRepository userRepository;


    @GetMapping("/heatmap")
    public ResponseEntity<List<Map<String, Object>>> getHeatmapData() {
        List<Donation> donations = donationRepository.findAll();
        
        // Group by coordinates
        Map<String, Map<String, Object>> coordGroup = new HashMap<>();
        
        for (Donation d : donations) {
            if (d.getLatitude() == null || d.getLongitude() == null) continue;
            
            // Format coords key to 4 decimals to aggregate closely located ones
            String key = String.format(Locale.US, "%.4f,%.4f", d.getLatitude(), d.getLongitude());
            
            int servings = d.getQuantity() != null ? d.getQuantity() : 0;
            double weight = servings * 0.5; // conversion
            
            int completedVal = d.getStatus() == DonationStatus.DELIVERED ? 1 : 0;
            
            if (coordGroup.containsKey(key)) {
                Map<String, Object> data = coordGroup.get(key);
                data.put("donationCount", (long) data.get("donationCount") + 1);
                data.put("foodWeight", (double) data.get("foodWeight") + weight);
                data.put("completedDeliveries", (long) data.get("completedDeliveries") + completedVal);
            } else {
                Map<String, Object> data = new HashMap<>();
                data.put("latitude", d.getLatitude());
                data.put("longitude", d.getLongitude());
                data.put("donationCount", 1L);
                data.put("foodWeight", weight);
                data.put("completedDeliveries", (long) completedVal);
                coordGroup.put(key, data);
            }
        }
        
        return ResponseEntity.ok(new ArrayList<>(coordGroup.values()));
    }

    @GetMapping("/ngos")
    public ResponseEntity<List<Map<String, Object>>> getActiveNgoLocations() {
        List<User> users = userRepository.findAll();
        List<Map<String, Object>> ngoLocations = new ArrayList<>();
        for (User u : users) {
            if (u.getRole() == Role.NGO && "ACTIVE".equalsIgnoreCase(u.getAccountStatus())) {
                Map<String, Object> map = new HashMap<>();
                map.put("name", u.getName());
                map.put("latitude", u.getLatitude() != null ? u.getLatitude() : 17.4411);
                map.put("longitude", u.getLongitude() != null ? u.getLongitude() : 78.3826);
                map.put("address", u.getAddress());
                ngoLocations.add(map);
            }
        }
        return ResponseEntity.ok(ngoLocations);
    }
}

