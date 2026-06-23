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
public class UserProfileDto {
    private Long id;
    private String email;
    private String name;
    private Role role;
    private String phone;
    private String address;
    private Double latitude;
    private Double longitude;
    
    // Hotel specific
    private String hotelName;
    
    // NGO specific
    private String ngoName;
    private String registrationNumber;
    private String serviceArea;
    private String approvalStatus;
}
