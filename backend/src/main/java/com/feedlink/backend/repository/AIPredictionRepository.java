package com.feedlink.backend.repository;

import com.feedlink.backend.entity.AIPredictionLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AIPredictionRepository extends JpaRepository<AIPredictionLog, String> {
}
