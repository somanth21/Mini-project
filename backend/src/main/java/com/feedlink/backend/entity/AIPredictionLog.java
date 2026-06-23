package com.feedlink.backend.entity;

import lombok.*;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_prediction_logs")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AIPredictionLog {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;
    private Long donationId;
    private String foodType;
    private String category;
    private Double freshnessScore;
    private Integer estimatedServings;
    @Column(length = 2000)
    private String predictionRaw;
    private LocalDateTime timestamp;
}
