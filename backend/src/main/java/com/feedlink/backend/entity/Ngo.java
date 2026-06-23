package com.feedlink.backend.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "ngos")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ngo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "ngo_name", nullable = false)
    private String ngoName;

    @Column(name = "registration_number", nullable = false)
    private String registrationNumber;

    @Column(name = "service_area")
    private String serviceArea;

    @Column(name = "approval_status", nullable = false)
    @Builder.Default
    private String approvalStatus = "PENDING"; // Default pending for admin approval
}
