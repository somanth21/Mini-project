package com.feedlink.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "donations")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Donation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "donor_id", nullable = false)
    private User donor;

    @ManyToOne
    @JoinColumn(name = "ngo_id")
    private User ngo;

    @ManyToOne
    @JoinColumn(name = "volunteer_id")
    private User volunteer;

    private String foodType;
    private String category;
    private Integer quantity; // Quantity in servings
    private String description;
    
    private String imageUrl;
    
    @Enumerated(EnumType.STRING)
    private DonationStatus status;

    private LocalDateTime expiryTime;
    private LocalDateTime createdAt;
    
    // AI Analysis results
    private Double freshnessScore;
    private String AIRecommendation;

    // Location
    private Double latitude;
    private Double longitude;
    private String pickupAddress;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (status == null) status = DonationStatus.AVAILABLE;
    }
}
