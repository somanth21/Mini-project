package com.feedlink.backend.service;

import com.feedlink.backend.entity.*;
import com.feedlink.backend.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final HotelRepository hotelRepository;
    private final NgoRepository ngoRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final DonationRepository donationRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Clear old refresh tokens at startup to avoid stale unique constraints in dev environment
        refreshTokenRepository.deleteAll();

        // Seed requested Admin if not exists
        if (userRepository.findByEmail("admin@feedlink.ai").isEmpty()) {
            User admin = User.builder()
                    .name("FeedLink AI Admin")
                    .email("admin@feedlink.ai")
                    .password(passwordEncoder.encode("Admin@123"))
                    .role(Role.ADMIN)
                    .phone("+10000000")
                    .address("System HQ, Hyderabad")
                    .latitude(17.4300)
                    .longitude(78.4000)
                    .build();
            userRepository.save(admin);
        }

        // Seed requested Hotel if not exists
        if (userRepository.findByEmail("hotel@feedlink.ai").isEmpty()) {
            User hotelUser = User.builder()
                    .name("FeedLink AI Hotel and Hostals")
                    .email("hotel@feedlink.ai")
                    .password(passwordEncoder.encode("Hotel@123"))
                    .role(Role.HOTEL)
                    .phone("+1234567890")
                    .address("Madhapur Main Rd, Hyderabad")
                    .latitude(17.4483)
                    .longitude(78.3741)
                    .build();
            userRepository.save(hotelUser);

            Hotel hotel = Hotel.builder()
                    .user(hotelUser)
                    .hotelName("FeedLink AI Hotel and Hostals")
                    .address("Madhapur Main Rd, Hyderabad")
                    .verificationStatus("VERIFIED")
                    .build();
            hotelRepository.save(hotel);
        } else {
            userRepository.findByEmail("hotel@feedlink.ai").ifPresent(u -> {
                u.setName("FeedLink AI Hotel and Hostals");
                userRepository.save(u);
                hotelRepository.findByUser(u).ifPresent(h -> {
                    h.setHotelName("FeedLink AI Hotel and Hostals");
                    hotelRepository.save(h);
                });
            });
        }

        // Seed requested NGO if not exists (starts as PENDING for NGO approval workflow testing)
        if (userRepository.findByEmail("ngo@feedlink.ai").isEmpty()) {
            User ngoUser = User.builder()
                    .name("FeedLink AI NGO")
                    .email("ngo@feedlink.ai")
                    .password(passwordEncoder.encode("NGO@123"))
                    .role(Role.NGO)
                    .phone("+15550199")
                    .address("Jubilee Hills Road, Hyderabad")
                    .latitude(17.4300)
                    .longitude(78.4000)
                    .build();
            userRepository.save(ngoUser);

            Ngo ngo = Ngo.builder()
                    .user(ngoUser)
                    .ngoName("FeedLink AI NGO")
                    .registrationNumber("REG-FEEDLINK-999")
                    .serviceArea("All City")
                    .approvalStatus("PENDING")
                    .build();
            ngoRepository.save(ngo);
        }

        // Seed Admin if not exists
        if (userRepository.findByEmail("admin@feedlink.com").isEmpty()) {
            User admin = User.builder()
                    .name("System Administrator")
                    .email("admin@feedlink.com")
                    .password(passwordEncoder.encode("admin123"))
                    .role(Role.ADMIN)
                    .phone("+10000000")
                    .address("Admin HQ, Hyderabad")
                    .latitude(17.4300)
                    .longitude(78.4000)
                    .build();
            userRepository.save(admin);
        }

        if (userRepository.findByEmail("hotel1@feedlink.com").isEmpty()) {
            User hotelUser1 = User.builder()
                    .name("Grand Palace Hotel and Hostals")
                    .email("hotel1@feedlink.com")
                    .password(passwordEncoder.encode("hotel123"))
                    .role(Role.HOTEL)
                    .phone("+1234567890")
                    .address("123 Luxury Ave, Gachibowli, Hyderabad")
                    .latitude(17.4401)
                    .longitude(78.3489)
                    .build();
            userRepository.save(hotelUser1);

            Hotel hotel1 = Hotel.builder()
                    .user(hotelUser1)
                    .hotelName("Grand Palace Hotel and Hostals")
                    .address("123 Luxury Ave, Gachibowli, Hyderabad")
                    .verificationStatus("VERIFIED")
                    .build();
            hotelRepository.save(hotel1);
        } else {
            userRepository.findByEmail("hotel1@feedlink.com").ifPresent(u -> {
                u.setName("Grand Palace Hotel and Hostals");
                userRepository.save(u);
                hotelRepository.findByUser(u).ifPresent(h -> {
                    h.setHotelName("Grand Palace Hotel and Hostals");
                    hotelRepository.save(h);
                });
            });
        }

        // Seed Hotel 2
        if (userRepository.findByEmail("hotel2@feedlink.com").isEmpty()) {
            User hotelUser2 = User.builder()
                    .name("Green Bistro and Hostals")
                    .email("hotel2@feedlink.com")
                    .password(passwordEncoder.encode("hotel123"))
                    .role(Role.HOTEL)
                    .phone("+1987654321")
                    .address("456 Eco Boulevard, Kondapur, Hyderabad")
                    .latitude(17.4622)
                    .longitude(78.3568)
                    .build();
            userRepository.save(hotelUser2);

            Hotel hotel2 = Hotel.builder()
                    .user(hotelUser2)
                    .hotelName("Green Bistro and Hostals")
                    .address("456 Eco Boulevard, Kondapur, Hyderabad")
                    .verificationStatus("VERIFIED")
                    .build();
            hotelRepository.save(hotel2);
        } else {
            userRepository.findByEmail("hotel2@feedlink.com").ifPresent(u -> {
                u.setName("Green Bistro and Hostals");
                userRepository.save(u);
                hotelRepository.findByUser(u).ifPresent(h -> {
                    h.setHotelName("Green Bistro and Hostals");
                    hotelRepository.save(h);
                });
            });
        }

        // Seed NGO 1 (Pending approval)
        if (userRepository.findByEmail("ngo1@feedlink.com").isEmpty()) {
            User ngoUser1 = User.builder()
                    .name("Food For All Director")
                    .email("ngo1@feedlink.com")
                    .password(passwordEncoder.encode("ngo123"))
                    .role(Role.NGO)
                    .phone("+15550199")
                    .address("789 Charity Way, Madhapur, Hyderabad")
                    .latitude(17.4483)
                    .longitude(78.3741)
                    .build();
            userRepository.save(ngoUser1);

            Ngo ngo1 = Ngo.builder()
                    .user(ngoUser1)
                    .ngoName("Food For All NGO")
                    .registrationNumber("REG-2026-001")
                    .serviceArea("Downtown / Metro")
                    .approvalStatus("PENDING")
                    .build();
            ngoRepository.save(ngo1);
        }

        // Seed NGO 2 (Pre-approved)
        if (userRepository.findByEmail("ngo2@feedlink.com").isEmpty()) {
            User ngoUser2 = User.builder()
                    .name("Care Share Manager")
                    .email("ngo2@feedlink.com")
                    .password(passwordEncoder.encode("ngo234"))
                    .role(Role.NGO)
                    .phone("+15550299")
                    .address("999 Hope Lane, Banjara Hills, Hyderabad")
                    .latitude(17.4156)
                    .longitude(78.4347)
                    .build();
            ngoUser2.setVerified(true);
            ngoUser2.setAccountStatus("ACTIVE");
            userRepository.save(ngoUser2);

            Ngo ngo2 = Ngo.builder()
                    .user(ngoUser2)
                    .ngoName("Care & Share Foundation")
                    .registrationNumber("REG-2026-002")
                    .serviceArea("Northside Suburbs")
                    .approvalStatus("APPROVED")
                    .build();
            ngoRepository.save(ngo2);
        }

        // Seed dynamic historical donations
        if (donationRepository.count() == 0) {
            User hotelUser = userRepository.findByEmail("hotel@feedlink.ai").orElse(null);
            User hotelUser1 = userRepository.findByEmail("hotel1@feedlink.com").orElse(null);
            User hotelUser2 = userRepository.findByEmail("hotel2@feedlink.com").orElse(null);
            User ngoUser2 = userRepository.findByEmail("ngo2@feedlink.com").orElse(null);
            User ngoUserApproved = userRepository.findByEmail("ngo@feedlink.ai").orElse(null);

            // Approve ngoUserApproved for testing completed donations
            if (ngoUserApproved != null) {
                ngoUserApproved.setAccountStatus("ACTIVE");
                ngoUserApproved.setVerified(true);
                userRepository.save(ngoUserApproved);
                ngoRepository.findByUser(ngoUserApproved).ifPresent(n -> {
                    n.setApprovalStatus("APPROVED");
                    ngoRepository.save(n);
                });
            }

            if (hotelUser != null && ngoUser2 != null && ngoUserApproved != null) {
                LocalDateTime now = LocalDateTime.now();

                // Yesterday
                Donation d1 = Donation.builder()
                        .donor(hotelUser1 != null ? hotelUser1 : hotelUser)
                        .ngo(ngoUser2)
                        .foodType("Biryani")
                        .category("Cooked Food")
                        .quantity(40)
                        .description("Delicious Veg and Chicken Biryani")
                        .status(DonationStatus.DELIVERED)
                        .createdAt(now.minusDays(1))
                        .acceptedAt(now.minusDays(1).plusMinutes(10))
                        .deliveredAt(now.minusDays(1).plusHours(2))
                        .latitude(17.4401)
                        .longitude(78.3489)
                        .pickupAddress("Gachibowli Road, Gachibowli, Hyderabad")
                        .freshnessScore(92.0)
                        .AIRecommendation("Eat within 4 hours")
                        .build();
                donationRepository.save(d1);

                // 3 days ago
                Donation d2 = Donation.builder()
                        .donor(hotelUser)
                        .ngo(ngoUserApproved)
                        .foodType("Rice")
                        .category("Cooked Food")
                        .quantity(60)
                        .description("Steamed Rice and Dal")
                        .status(DonationStatus.DELIVERED)
                        .createdAt(now.minusDays(3))
                        .acceptedAt(now.minusDays(3).plusMinutes(15))
                        .deliveredAt(now.minusDays(3).plusHours(1))
                        .latitude(17.4483)
                        .longitude(78.3741)
                        .pickupAddress("Madhapur Main Road, Madhapur, Hyderabad")
                        .freshnessScore(88.0)
                        .AIRecommendation("Consume immediately")
                        .build();
                donationRepository.save(d2);

                // 10 days ago (This Month)
                Donation d3 = Donation.builder()
                        .donor(hotelUser2 != null ? hotelUser2 : hotelUser)
                        .ngo(ngoUser2)
                        .foodType("Bread")
                        .category("Bakery")
                        .quantity(20)
                        .description("Fresh baked wheat buns")
                        .status(DonationStatus.DELIVERED)
                        .createdAt(now.minusDays(10))
                        .acceptedAt(now.minusDays(10).plusMinutes(30))
                        .deliveredAt(now.minusDays(10).plusHours(3))
                        .latitude(17.4622)
                        .longitude(78.3568)
                        .pickupAddress("Kondapur Junction, Kondapur, Hyderabad")
                        .freshnessScore(85.0)
                        .AIRecommendation("Distribute within 12 hours")
                        .build();
                donationRepository.save(d3);

                // 25 days ago (This Month)
                Donation d4 = Donation.builder()
                        .donor(hotelUser1 != null ? hotelUser1 : hotelUser)
                        .ngo(ngoUserApproved)
                        .foodType("Curry")
                        .category("Cooked Food")
                        .quantity(30)
                        .description("Mixed Vegetable Curry")
                        .status(DonationStatus.DELIVERED)
                        .createdAt(now.minusDays(25))
                        .acceptedAt(now.minusDays(25).plusMinutes(20))
                        .deliveredAt(now.minusDays(25).plusHours(2))
                        .latitude(17.4401)
                        .longitude(78.3489)
                        .pickupAddress("Gachibowli, Hyderabad")
                        .freshnessScore(90.0)
                        .AIRecommendation("Consume within 4 hours")
                        .build();
                donationRepository.save(d4);

                // 45 days ago (This Year)
                Donation d5 = Donation.builder()
                        .donor(hotelUser)
                        .ngo(ngoUser2)
                        .foodType("Biryani")
                        .category("Cooked Food")
                        .quantity(100)
                        .description("Special mutton biryani")
                        .status(DonationStatus.DELIVERED)
                        .createdAt(now.minusDays(45))
                        .acceptedAt(now.minusDays(45).plusMinutes(12))
                        .deliveredAt(now.minusDays(45).plusHours(4))
                        .latitude(17.4483)
                        .longitude(78.3741)
                        .pickupAddress("Madhapur Metro, Madhapur, Hyderabad")
                        .freshnessScore(95.0)
                        .AIRecommendation("Keep hot and consume")
                        .build();
                donationRepository.save(d5);

                // Today - Accepted
                Donation d6 = Donation.builder()
                        .donor(hotelUser2 != null ? hotelUser2 : hotelUser)
                        .ngo(ngoUser2)
                        .foodType("Fruits")
                        .category("Fresh Produce")
                        .quantity(15)
                        .description("Organic Apples and Bananas")
                        .status(DonationStatus.ACCEPTED)
                        .createdAt(now.minusHours(4))
                        .acceptedAt(now.minusHours(3).plusMinutes(45))
                        .latitude(17.4622)
                        .longitude(78.3568)
                        .pickupAddress("Kondapur, Hyderabad")
                        .freshnessScore(95.0)
                        .AIRecommendation("Distribute immediately")
                        .build();
                donationRepository.save(d6);

                // Today - Available
                Donation d7 = Donation.builder()
                        .donor(hotelUser)
                        .foodType("Vegetables")
                        .category("Fresh Produce")
                        .quantity(25)
                        .description("Fresh Spinach and Tomatoes")
                        .status(DonationStatus.AVAILABLE)
                        .createdAt(now.minusHours(1))
                        .latitude(17.4483)
                        .longitude(78.3741)
                        .pickupAddress("Madhapur Circle, Madhapur, Hyderabad")
                        .freshnessScore(98.0)
                        .AIRecommendation("Distribute within 24 hours")
                        .build();
                donationRepository.save(d7);
            }
        }
    }
}
