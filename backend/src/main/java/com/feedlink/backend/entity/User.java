package com.feedlink.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;

@Entity
@Table(name = "users")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class User implements UserDetails {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String password;

    private String name;

    @Enumerated(EnumType.STRING)
    private Role role;

    @Builder.Default
    private boolean verified = false;

    private String phone;

    @Column(name = "account_status")
    @Builder.Default
    private String accountStatus = "PENDING";

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // Location details
    private Double latitude;
    private Double longitude;
    private String address;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (role == Role.ADMIN || role == Role.HOTEL) {
            accountStatus = "ACTIVE";
            verified = true;
        } else {
            accountStatus = "PENDING";
            verified = false;
        }
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return !"SUSPENDED".equalsIgnoreCase(accountStatus);
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return "ACTIVE".equalsIgnoreCase(accountStatus) || "APPROVED".equalsIgnoreCase(accountStatus);
    }
}
