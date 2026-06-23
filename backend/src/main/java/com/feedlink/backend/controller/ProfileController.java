package com.feedlink.backend.controller;

import com.feedlink.backend.dto.UserProfileDto;
import com.feedlink.backend.entity.Hotel;
import com.feedlink.backend.entity.Ngo;
import com.feedlink.backend.entity.User;
import com.feedlink.backend.repository.HotelRepository;
import com.feedlink.backend.repository.NgoRepository;
import com.feedlink.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/profile")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class ProfileController {

    private final UserRepository userRepository;
    private final HotelRepository hotelRepository;
    private final NgoRepository ngoRepository;

    @GetMapping
    public ResponseEntity<UserProfileDto> getProfile(@AuthenticationPrincipal User currentUser) {
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }
        
        // Fetch fresh copy from database
        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));
                
        UserProfileDto.UserProfileDtoBuilder builder = UserProfileDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .phone(user.getPhone())
                .address(user.getAddress())
                .latitude(user.getLatitude())
                .longitude(user.getLongitude());

        if (user.getRole() == com.feedlink.backend.entity.Role.HOTEL) {
            hotelRepository.findByUser(user).ifPresent(hotel -> {
                builder.hotelName(hotel.getHotelName());
                builder.address(hotel.getAddress()); // sync address
            });
        } else if (user.getRole() == com.feedlink.backend.entity.Role.NGO) {
            ngoRepository.findByUser(user).ifPresent(ngo -> {
                builder.ngoName(ngo.getNgoName());
                builder.registrationNumber(ngo.getRegistrationNumber());
                builder.serviceArea(ngo.getServiceArea());
                builder.approvalStatus(ngo.getApprovalStatus());
            });
        }

        return ResponseEntity.ok(builder.build());
    }

    @PutMapping
    public ResponseEntity<UserProfileDto> updateProfile(
            @AuthenticationPrincipal User currentUser,
            @RequestBody UserProfileDto updateDto
    ) {
        if (currentUser == null) {
            return ResponseEntity.status(401).build();
        }

        User user = userRepository.findById(currentUser.getId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setName(updateDto.getName());
        user.setPhone(updateDto.getPhone());
        user.setAddress(updateDto.getAddress());
        if (updateDto.getLatitude() != null) user.setLatitude(updateDto.getLatitude());
        if (updateDto.getLongitude() != null) user.setLongitude(updateDto.getLongitude());

        userRepository.save(user);

        if (user.getRole() == com.feedlink.backend.entity.Role.HOTEL) {
            Hotel hotel = hotelRepository.findByUser(user)
                    .orElseGet(() -> Hotel.builder().user(user).build());
            if (updateDto.getHotelName() != null) {
                hotel.setHotelName(updateDto.getHotelName());
            }
            hotel.setAddress(user.getAddress());
            hotelRepository.save(hotel);
        } else if (user.getRole() == com.feedlink.backend.entity.Role.NGO) {
            Ngo ngo = ngoRepository.findByUser(user)
                    .orElseGet(() -> Ngo.builder().user(user).build());
            if (updateDto.getNgoName() != null) {
                ngo.setNgoName(updateDto.getNgoName());
            }
            if (updateDto.getRegistrationNumber() != null) {
                ngo.setRegistrationNumber(updateDto.getRegistrationNumber());
            }
            if (updateDto.getServiceArea() != null) {
                ngo.setServiceArea(updateDto.getServiceArea());
            }
            ngoRepository.save(ngo);
        }

        // Return updated profile
        return getProfile(user);
    }
}
