package com.feedlink.backend.controller;

import com.feedlink.backend.entity.*;
import com.feedlink.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AdminController {

    private final UserRepository userRepository;
    private final HotelRepository hotelRepository;
    private final NgoRepository ngoRepository;
    private final DonationRepository donationRepository;
    private final AIPredictionRepository aiPredictionRepository;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getAdminStats() {
        long totalUsers = userRepository.count();
        long totalHotels = hotelRepository.count();
        long totalNgos = ngoRepository.count();
        long totalDonations = donationRepository.count();

        // Calculate food saved & people fed from DELIVERED donations
        List<Donation> deliveredDonations = donationRepository.findByStatus(DonationStatus.DELIVERED);
        int totalServingsSaved = deliveredDonations.stream()
                .mapToInt(d -> d.getQuantity() != null ? d.getQuantity() : 0)
                .sum();
                
        double foodSavedKg = totalServingsSaved * 0.5;
        int peopleFed = totalServingsSaved;

        Map<String, Object> stats = new HashMap<>();
        stats.put("totalUsers", totalUsers);
        stats.put("totalHotels", totalHotels);
        stats.put("totalNgos", totalNgos);
        stats.put("totalDonations", totalDonations);
        stats.put("foodSavedKg", foodSavedKg);
        stats.put("peopleFed", peopleFed);

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/ngos")
    public ResponseEntity<List<Ngo>> getAllNgos() {
        return ResponseEntity.ok(ngoRepository.findAll());
    }

    @GetMapping("/hotels")
    public ResponseEntity<List<Hotel>> getAllHotels() {
        return ResponseEntity.ok(hotelRepository.findAll());
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PutMapping({"/ngos/{id}/approve", "/approve-ngo/{id}"})
    public ResponseEntity<Map<String, String>> approveNgo(@PathVariable Long id) {
        Ngo ngo = ngoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("NGO not found"));
        ngo.setApprovalStatus("APPROVED");
        ngoRepository.save(ngo);

        User user = ngo.getUser();
        user.setAccountStatus("ACTIVE");
        user.setVerified(true);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "NGO approved successfully."));
    }

    @PutMapping({"/ngos/{id}/reject", "/reject-ngo/{id}"})
    public ResponseEntity<Map<String, String>> rejectNgo(@PathVariable Long id) {
        Ngo ngo = ngoRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("NGO not found"));
        ngo.setApprovalStatus("REJECTED");
        ngoRepository.save(ngo);

        User user = ngo.getUser();
        user.setAccountStatus("REJECTED");
        user.setVerified(false);
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "NGO registration rejected."));
    }

    @PutMapping({"/users/{id}/suspend", "/suspend-user/{id}"})
    public ResponseEntity<Map<String, String>> suspendUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setAccountStatus("SUSPENDED");
        userRepository.save(user);

        return ResponseEntity.ok(Map.of("message", "User suspended successfully."));
    }

    @PutMapping("/users/{id}/reactivate")
    public ResponseEntity<Map<String, String>> reactivateUser(@PathVariable Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (user.getRole() == Role.NGO) {
            Ngo ngo = ngoRepository.findByUser(user).orElseThrow();
            if ("APPROVED".equalsIgnoreCase(ngo.getApprovalStatus())) {
                user.setAccountStatus("ACTIVE");
            } else {
                user.setAccountStatus("PENDING");
            }
        } else {
            user.setAccountStatus("ACTIVE");
        }
        
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "User reactivated successfully."));
    }

    @GetMapping("/donations")
    public ResponseEntity<List<Donation>> getAllDonations() {
        return ResponseEntity.ok(donationRepository.findAll());
    }

    @GetMapping("/ai-logs")
    public ResponseEntity<List<AIPredictionLog>> getAllAiLogs() {
        return ResponseEntity.ok(aiPredictionRepository.findAll());
    }
}
