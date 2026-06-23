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
public class RegisterRequest {
    private String name;
    private String email;
    private String password;
    private Role role;
    private Double latitude;
    private Double longitude;
    private String address;
    private String phone;
    
    // Hotel-specific fields
    private String hotelName;
    
    // NGO-specific fields
    private String ngoName;
    private String registrationNumber;
    private String serviceArea;
}
