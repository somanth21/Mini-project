package com.feedlink.backend.repository;

import com.feedlink.backend.entity.Ngo;
import com.feedlink.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface NgoRepository extends JpaRepository<Ngo, Long> {
    Optional<Ngo> findByUser(User user);
}
