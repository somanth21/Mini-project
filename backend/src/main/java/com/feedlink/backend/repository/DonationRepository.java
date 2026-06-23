package com.feedlink.backend.repository;

import com.feedlink.backend.entity.Donation;
import com.feedlink.backend.entity.DonationStatus;
import com.feedlink.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface DonationRepository extends JpaRepository<Donation, Long> {
    List<Donation> findByStatus(DonationStatus status);
    List<Donation> findByDonor(User donor);
    List<Donation> findByNgo(User ngo);
    List<Donation> findByVolunteer(User volunteer);
}
