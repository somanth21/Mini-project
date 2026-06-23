package com.feedlink.backend.repository;

import com.feedlink.backend.entity.Hotel;
import com.feedlink.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface HotelRepository extends JpaRepository<Hotel, Long> {
    Optional<Hotel> findByUser(User user);
}
