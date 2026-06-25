package com.feedlink.backend.controller;

import com.feedlink.backend.entity.Donation;
import com.feedlink.backend.entity.DonationStatus;
import com.feedlink.backend.entity.User;
import com.feedlink.backend.service.DonationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/donations")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class DonationController {

    private final DonationService service;

    @PostMapping
    public ResponseEntity<Donation> createDonation(
            @RequestBody Donation donation,
            @AuthenticationPrincipal User user
    ) {
        donation.setDonor(user);
        return ResponseEntity.ok(service.createDonation(donation));
    }

    @GetMapping("/available")
    public ResponseEntity<List<Donation>> getAvailableDonations() {
        return ResponseEntity.ok(service.getAvailableDonations());
    }

    @GetMapping("/my")
    public ResponseEntity<List<Donation>> getMyDonations(
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(service.getDonationsByUser(user));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Donation> updateStatus(
            @PathVariable Long id,
            @RequestParam DonationStatus status,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(service.updateStatus(id, status, user));
    }

    @GetMapping("/hotel/stats")
    public ResponseEntity<Map<String, Object>> getHotelStats(@AuthenticationPrincipal User user) {
        List<Donation> myDonations = service.getDonationsByUser(user);
        
        long activeDonations = myDonations.stream()
                .filter(d -> d.getStatus() == DonationStatus.AVAILABLE || d.getStatus() == DonationStatus.ACCEPTED)
                .count();
                
        long successfulPickups = myDonations.stream()
                .filter(d -> d.getStatus() == DonationStatus.DELIVERED)
                .count();
                
        int mealsDonated = myDonations.stream()
                .filter(d -> d.getStatus() == DonationStatus.DELIVERED)
                .mapToInt(d -> d.getQuantity() != null ? d.getQuantity() : 0)
                .sum();
                
        long ngosHelped = myDonations.stream()
                .filter(d -> d.getNgo() != null)
                .map(d -> d.getNgo().getId())
                .distinct()
                .count();
                
        double carbonSaved = mealsDonated * 0.5 * 2.5;

        Map<String, Object> stats = new HashMap<>();
        stats.put("activeDonations", activeDonations);
        stats.put("mealsDonated", mealsDonated);
        stats.put("successfulPickups", successfulPickups);
        stats.put("ngosHelped", ngosHelped);
        stats.put("carbonSaved", carbonSaved);

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/ngo/stats")
    public ResponseEntity<Map<String, Object>> getNgoStats(@AuthenticationPrincipal User user) {
        List<Donation> ngoDonations = service.getDonationsByUser(user);
        long availableDonations = service.getAvailableDonations().size();
        
        long acceptedDonations = ngoDonations.stream()
                .filter(d -> d.getStatus() == DonationStatus.ACCEPTED)
                .count();
                
        int mealsDistributed = ngoDonations.stream()
                .filter(d -> d.getStatus() == DonationStatus.DELIVERED)
                .mapToInt(d -> d.getQuantity() != null ? d.getQuantity() : 0)
                .sum();
                
        long activeVolunteers = 5; // Mock value as per requirement

        Map<String, Object> stats = new HashMap<>();
        stats.put("availableDonations", availableDonations);
        stats.put("acceptedDonations", acceptedDonations);
        stats.put("mealsDistributed", mealsDistributed);
        stats.put("activeVolunteers", activeVolunteers);

        return ResponseEntity.ok(stats);
    }

    @PostMapping("/{id}/generate-qr")
    public ResponseEntity<Map<String, String>> generateQr(@PathVariable Long id) {
        String token = service.generateVerificationToken(id);
        String base64Image = "";
        try {
            com.google.zxing.qrcode.QRCodeWriter qrCodeWriter = new com.google.zxing.qrcode.QRCodeWriter();
            com.google.zxing.common.BitMatrix bitMatrix = qrCodeWriter.encode(token, com.google.zxing.BarcodeFormat.QR_CODE, 200, 200);
            java.io.ByteArrayOutputStream pngOutputStream = new java.io.ByteArrayOutputStream();
            com.google.zxing.client.j2se.MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);
            byte[] pngData = pngOutputStream.toByteArray();
            base64Image = "data:image/png;base64," + java.util.Base64.getEncoder().encodeToString(pngData);
        } catch (Exception e) {
            e.printStackTrace();
        }

        Map<String, String> response = new HashMap<>();
        response.put("token", token);
        response.put("qrCodeImage", base64Image);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{id}/verify-qr")
    public ResponseEntity<Donation> verifyQr(
            @PathVariable Long id,
            @RequestParam String token,
            @AuthenticationPrincipal User user
    ) {
        return ResponseEntity.ok(service.verifyQrCode(id, token, user));
    }
}
