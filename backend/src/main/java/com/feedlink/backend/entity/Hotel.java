package com.feedlink.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "hotels")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Hotel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "hotel_name", nullable = false)
    private String hotelName;

    @Column(nullable = false)
    private String address;

    @Column(name = "verification_status", nullable = false)
    @Builder.Default
    private String verificationStatus = "VERIFIED"; // Default verified for hotels as per description
}
