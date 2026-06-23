package com.feedlink.backend.dto;

import com.feedlink.backend.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AuthenticationResponse {
    private String token;
    private String refreshToken;
    private String name;
    private String email;
    private Role role;
    private String status;
    private String message;
}
