package com.feedlink.backend.repository;

import com.feedlink.backend.entity.AIPredictionLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AIPredictionRepository extends JpaRepository<AIPredictionLog, String> {
    List<AIPredictionLog> findByUserEmail(String userEmail);
}

