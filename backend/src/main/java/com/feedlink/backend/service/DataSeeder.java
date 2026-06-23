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
                    .address("System HQ")
                    .latitude(12.9716)
                    .longitude(77.5946)
                    .build();
            userRepository.save(admin);
        }

        // Seed requested Hotel if not exists
        if (userRepository.findByEmail("hotel@feedlink.ai").isEmpty()) {
            User hotelUser = User.builder()
                    .name("FeedLink AI Hotel")
                    .email("hotel@feedlink.ai")
                    .password(passwordEncoder.encode("Hotel@123"))
                    .role(Role.HOTEL)
                    .phone("+1234567890")
                    .address("Hotel St, City Center")
                    .latitude(12.9784)
                    .longitude(77.6408)
                    .build();
            userRepository.save(hotelUser);

            Hotel hotel = Hotel.builder()
                    .user(hotelUser)
                    .hotelName("FeedLink AI Hotel")
                    .address("Hotel St, City Center")
                    .verificationStatus("VERIFIED")
                    .build();
            hotelRepository.save(hotel);
        }

        // Seed requested NGO if not exists (starts as PENDING for NGO approval workflow testing)
        if (userRepository.findByEmail("ngo@feedlink.ai").isEmpty()) {
            User ngoUser = User.builder()
                    .name("FeedLink AI NGO")
                    .email("ngo@feedlink.ai")
                    .password(passwordEncoder.encode("NGO@123"))
                    .role(Role.NGO)
                    .phone("+15550199")
                    .address("NGO Lane")
                    .latitude(12.9592)
                    .longitude(77.5681)
                    .build();
            // NGO defaults to PENDING in prePersist
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
                    .address("Admin HQ")
                    .latitude(12.9716)
                    .longitude(77.5946)
                    .build();
            userRepository.save(admin);
        }

        // Seed Hotel 1
        if (userRepository.findByEmail("hotel1@feedlink.com").isEmpty()) {
            User hotelUser1 = User.builder()
                    .name("Grand Palace Hotel Manager")
                    .email("hotel1@feedlink.com")
                    .password(passwordEncoder.encode("hotel123"))
                    .role(Role.HOTEL)
                    .phone("+1234567890")
                    .address("123 Luxury Ave, City Center")
                    .latitude(12.9784)
                    .longitude(77.6408)
                    .build();
            userRepository.save(hotelUser1);

            Hotel hotel1 = Hotel.builder()
                    .user(hotelUser1)
                    .hotelName("Grand Palace Hotel")
                    .address("123 Luxury Ave, City Center")
                    .verificationStatus("VERIFIED")
                    .build();
            hotelRepository.save(hotel1);
        }

        // Seed Hotel 2
        if (userRepository.findByEmail("hotel2@feedlink.com").isEmpty()) {
            User hotelUser2 = User.builder()
                    .name("Green Bistro Manager")
                    .email("hotel2@feedlink.com")
                    .password(passwordEncoder.encode("hotel123"))
                    .role(Role.HOTEL)
                    .phone("+1987654321")
                    .address("456 Eco Boulevard")
                    .latitude(12.9344)
                    .longitude(77.6192)
                    .build();
            userRepository.save(hotelUser2);

            Hotel hotel2 = Hotel.builder()
                    .user(hotelUser2)
                    .hotelName("Green Bistro")
                    .address("456 Eco Boulevard")
                    .verificationStatus("VERIFIED")
                    .build();
            hotelRepository.save(hotel2);
        }

        // Seed NGO 1 (Pending approval)
        if (userRepository.findByEmail("ngo1@feedlink.com").isEmpty()) {
            User ngoUser1 = User.builder()
                    .name("Food For All Director")
                    .email("ngo1@feedlink.com")
                    .password(passwordEncoder.encode("ngo123"))
                    .role(Role.NGO)
                    .phone("+15550199")
                    .address("789 Charity Way")
                    .latitude(12.9592)
                    .longitude(77.5681)
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
                    .address("999 Hope Lane")
                    .latitude(12.9801)
                    .longitude(77.5894)
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
    }
}
