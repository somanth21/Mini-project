package com.feedlink.backend.service;

import com.feedlink.backend.entity.Donation;
import com.feedlink.backend.entity.DonationStatus;
import com.feedlink.backend.entity.User;
import com.feedlink.backend.repository.DonationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DonationService {

    private final DonationRepository repository;

    public Donation createDonation(Donation donation) {
        return repository.save(donation);
    }

    public List<Donation> getAvailableDonations() {
        return repository.findByStatus(DonationStatus.AVAILABLE);
    }

    public Donation updateStatus(Long id, DonationStatus status, User user) {
        Donation donation = repository.findById(id).orElseThrow();
        donation.setStatus(status);
        if (status == DonationStatus.ACCEPTED) {
            donation.setNgo(user);
        } else if (status == DonationStatus.PICKED_UP || status == DonationStatus.DELIVERED) {
            donation.setVolunteer(user);
        }
        return repository.save(donation);
    }

    public List<Donation> getDonationsByUser(User user) {
        return switch (user.getRole()) {
            case HOTEL -> repository.findByDonor(user);
            case NGO -> repository.findByNgo(user);
            default -> repository.findAll();
        };
    }
}
