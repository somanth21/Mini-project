package com.feedlink.backend.controller;

import com.feedlink.backend.entity.Donation;
import com.feedlink.backend.entity.DonationStatus;
import com.feedlink.backend.entity.Role;
import com.feedlink.backend.entity.User;
import com.feedlink.backend.repository.DonationRepository;
import com.feedlink.backend.repository.UserRepository;
import com.feedlink.backend.service.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/chatbot")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ChatbotController {

    private final AiService aiService;
    private final DonationRepository donationRepository;
    private final UserRepository userRepository;

    @PostMapping("/message")
    public ResponseEntity<Map<String, Object>> handleMessage(
            @RequestBody Map<String, Object> requestBody,
            @AuthenticationPrincipal User user
    ) {
        String message = (String) requestBody.get("message");
        String conversationId = (String) requestBody.get("conversationId");
        List<Map<String, String>> history = (List<Map<String, String>>) requestBody.getOrDefault("history", new ArrayList<>());

        // Build context based on user role
        String dbContext = buildContextForUser(user);

        // Prepare request payload for FastAPI
        Map<String, Object> payload = new HashMap<>();
        payload.put("message", message);
        payload.put("conversationId", conversationId != null ? conversationId : UUID.randomUUID().toString());
        payload.put("role", user.getRole().name());
        payload.put("userName", user.getName());
        payload.put("history", history);
        payload.put("dbContext", dbContext);

        Map<String, Object> result = aiService.chatbotMessage(payload);
        return ResponseEntity.ok(result);
    }

    private String buildContextForUser(User user) {
        StringBuilder sb = new StringBuilder();
        sb.append("User Details:\n");
        sb.append("- Name: ").append(user.getName()).append("\n");
        sb.append("- Email: ").append(user.getEmail()).append("\n");
        sb.append("- Role: ").append(user.getRole()).append("\n");
        sb.append("- Address: ").append(user.getAddress()).append("\n\n");

        if (user.getRole() == Role.HOTEL) {
            List<Donation> hotelDonations = donationRepository.findByDonor(user);
            
            long activeCount = hotelDonations.stream()
                    .filter(d -> d.getStatus() == DonationStatus.AVAILABLE || d.getStatus() == DonationStatus.ACCEPTED)
                    .count();
            
            int totalMeals = hotelDonations.stream()
                    .filter(d -> d.getStatus() == DonationStatus.DELIVERED)
                    .mapToInt(d -> d.getQuantity() != null ? d.getQuantity() : 0)
                    .sum();

            sb.append("Your Donation Status:\n");
            sb.append("- Active Donations (AVAILABLE or ACCEPTED): ").append(activeCount).append("\n");
            sb.append("- Total Meals Donated and Delivered: ").append(totalMeals).append("\n\n");
            sb.append("Your Active Donations List:\n");
            hotelDonations.stream()
                    .filter(d -> d.getStatus() == DonationStatus.AVAILABLE || d.getStatus() == DonationStatus.ACCEPTED)
                    .forEach(d -> sb.append(String.format("  * Donation #%d: %d servings of %s (Status: %s)\n", 
                            d.getId(), d.getQuantity(), d.getFoodType(), d.getStatus())));
            
            sb.append("\nYour Donation History:\n");
            hotelDonations.stream()
                    .limit(5)
                    .forEach(d -> sb.append(String.format("  * Donation #%d: %s (%d servings) on %s - Status: %s\n",
                            d.getId(), d.getFoodType(), d.getQuantity(), d.getCreatedAt(), d.getStatus())));

        } else if (user.getRole() == Role.NGO) {
            List<Donation> ngoDonations = donationRepository.findByNgo(user);
            List<Donation> availableDonations = donationRepository.findByStatus(DonationStatus.AVAILABLE);

            long pendingPickups = ngoDonations.stream()
                    .filter(d -> d.getStatus() == DonationStatus.ACCEPTED || d.getStatus() == DonationStatus.PICKED_UP)
                    .count();

            int mealsDistributed = ngoDonations.stream()
                    .filter(d -> d.getStatus() == DonationStatus.DELIVERED)
                    .mapToInt(d -> d.getQuantity() != null ? d.getQuantity() : 0)
                    .sum();

            sb.append("Your NGO Status:\n");
            sb.append("- Pending Pickups: ").append(pendingPickups).append("\n");
            sb.append("- Total Meals Distributed: ").append(mealsDistributed).append("\n\n");
            sb.append("Your Pending Pickups List:\n");
            ngoDonations.stream()
                    .filter(d -> d.getStatus() == DonationStatus.ACCEPTED || d.getStatus() == DonationStatus.PICKED_UP)
                    .forEach(d -> sb.append(String.format("  * Donation #%d: %d servings of %s from %s (Status: %s)\n",
                            d.getId(), d.getQuantity(), d.getFoodType(), d.getDonor().getName(), d.getStatus())));

            sb.append("\nNearby Available Donations:\n");
            availableDonations.stream()
                    .limit(5)
                    .forEach(d -> sb.append(String.format("  * Donation #%d: %s (%d servings) at %s\n",
                            d.getId(), d.getFoodType(), d.getQuantity(), d.getPickupAddress())));

        } else if (user.getRole() == Role.ADMIN) {
            List<Donation> donations = donationRepository.findAll();
            List<User> users = userRepository.findAll();

            long totalDonations = donations.size();
            long pendingNgos = users.stream()
                    .filter(u -> u.getRole() == Role.NGO && "PENDING".equalsIgnoreCase(u.getAccountStatus()))
                    .count();

            long activeHotels = users.stream()
                    .filter(u -> u.getRole() == Role.HOTEL && "ACTIVE".equalsIgnoreCase(u.getAccountStatus()))
                    .count();

            long activeNgos = users.stream()
                    .filter(u -> u.getRole() == Role.NGO && "ACTIVE".equalsIgnoreCase(u.getAccountStatus()))
                    .count();

            sb.append("System Statistics:\n");
            sb.append("- Total Donations Logged: ").append(totalDonations).append("\n");
            sb.append("- Active Hotels and Hostals: ").append(activeHotels).append("\n");
            sb.append("- Active NGOs: ").append(activeNgos).append("\n");
            sb.append("- NGOs Pending Approval: ").append(pendingNgos).append("\n\n");
            
            if (pendingNgos > 0) {
                sb.append("NGOs Pending Approval List:\n");
                users.stream()
                        .filter(u -> u.getRole() == Role.NGO && "PENDING".equalsIgnoreCase(u.getAccountStatus()))
                        .forEach(u -> sb.append(String.format("  * User #%d: %s (%s)\n", u.getId(), u.getName(), u.getEmail())));
            }
        }
        return sb.toString();
    }
}
