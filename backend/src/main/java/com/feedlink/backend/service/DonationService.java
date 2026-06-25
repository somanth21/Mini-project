package com.feedlink.backend.service;

import com.feedlink.backend.entity.Donation;
import com.feedlink.backend.entity.DonationStatus;
import com.feedlink.backend.entity.User;
import com.feedlink.backend.repository.DonationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DonationService {

    private final DonationRepository repository;
    private final NotificationService notificationService;

    public Donation createDonation(Donation donation) {
        Donation saved = repository.save(donation);
        // Notify NGOs that a new donation is available
        notificationService.sendNotification(0L, "New Donation Available", "A new food donation of " + saved.getFoodType() + " is available!");
        return saved;
    }

    public List<Donation> getAvailableDonations() {
        return repository.findByStatus(DonationStatus.AVAILABLE);
    }

    public Donation updateStatus(Long id, DonationStatus status, User user) {
        Donation donation = repository.findById(id).orElseThrow();
        donation.setStatus(status);
        if (status == DonationStatus.ACCEPTED) {
            donation.setNgo(user);
            donation.setAcceptedAt(LocalDateTime.now());
            // Notify Hotel
            if (donation.getDonor() != null) {
                notificationService.sendNotification(donation.getDonor().getId(), "Donation Accepted", 
                    "Your donation of " + donation.getFoodType() + " has been accepted by " + user.getName());
            }
        } else if (status == DonationStatus.PICKED_UP || status == DonationStatus.DELIVERED) {
            donation.setVolunteer(user);
            if (status == DonationStatus.DELIVERED) {
                donation.setDeliveredAt(LocalDateTime.now());
                // Notify Hotel and NGO
                if (donation.getDonor() != null) {
                    notificationService.sendNotification(donation.getDonor().getId(), "Donation Delivered", 
                        "Your donation of " + donation.getFoodType() + " has been successfully delivered!");
                }
                notificationService.sendNotification(user.getId(), "Delivery Completed", 
                    "Donation #" + donation.getId() + " has been marked as delivered.");
            }
        }
        return repository.save(donation);
    }

    public String generateVerificationToken(Long id) {
        Donation donation = repository.findById(id).orElseThrow();
        String token = "FEEDLINK-QR-" + id + "-" + UUID.randomUUID().toString().substring(0, 8);
        donation.setVerificationToken(token);
        repository.save(donation);
        return token;
    }

    public Donation verifyQrCode(Long id, String token, User user) {
        Donation donation = repository.findById(id).orElseThrow();
        if (donation.getVerificationToken() == null || !donation.getVerificationToken().equals(token)) {
            throw new IllegalArgumentException("Invalid or expired QR verification token.");
        }
        donation.setStatus(DonationStatus.DELIVERED);
        donation.setDeliveredAt(LocalDateTime.now());
        donation.setVolunteer(user);
        Donation saved = repository.save(donation);
        
        // Notify Hotel & NGO
        if (donation.getDonor() != null) {
            notificationService.sendNotification(donation.getDonor().getId(), "Donation Delivered (QR Verified)", 
                "Your donation has been verified via QR code and delivered!");
        }
        if (donation.getNgo() != null) {
            notificationService.sendNotification(donation.getNgo().getId(), "Delivery Handover Complete", 
                "Donation #" + donation.getId() + " verified successfully via QR.");
        }
        return saved;
    }

    public List<Donation> getDonationsByUser(User user) {
        return switch (user.getRole()) {
            case HOTEL -> repository.findByDonor(user);
            case NGO -> repository.findByNgo(user);
            default -> repository.findAll();
        };
    }
}
