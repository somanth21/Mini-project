package com.feedlink.backend.service;

import com.feedlink.backend.dto.AuthenticationRequest;
import com.feedlink.backend.dto.AuthenticationResponse;
import com.feedlink.backend.dto.RegisterRequest;
import com.feedlink.backend.entity.Hotel;
import com.feedlink.backend.entity.Ngo;
import com.feedlink.backend.entity.Role;
import com.feedlink.backend.entity.User;
import com.feedlink.backend.repository.HotelRepository;
import com.feedlink.backend.repository.NgoRepository;
import com.feedlink.backend.repository.UserRepository;
import com.feedlink.backend.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserRepository repository;
    private final HotelRepository hotelRepository;
    private final NgoRepository ngoRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final RefreshTokenService refreshTokenService;

    public AuthenticationResponse register(RegisterRequest request) {
        Role role = request.getRole() != null ? request.getRole() : Role.HOTEL;
        
        var user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .phone(request.getPhone())
                .latitude(request.getLatitude() != null ? request.getLatitude() : 0.0)
                .longitude(request.getLongitude() != null ? request.getLongitude() : 0.0)
                .address(request.getAddress())
                .build();
                
        // User onCreate PrePersist will handle verified and accountStatus defaults based on role:
        // HOTEL/ADMIN -> verified = true, status = ACTIVE
        // NGO -> verified = false, status = PENDING
        
        repository.save(user);

        if (role == Role.HOTEL) {
            var hotel = Hotel.builder()
                    .user(user)
                    .hotelName(request.getHotelName() != null ? request.getHotelName() : request.getName())
                    .address(request.getAddress() != null ? request.getAddress() : "")
                    .verificationStatus("VERIFIED")
                    .build();
            hotelRepository.save(hotel);
        } else if (role == Role.NGO) {
            var ngo = Ngo.builder()
                    .user(user)
                    .ngoName(request.getNgoName() != null ? request.getNgoName() : request.getName())
                    .registrationNumber(request.getRegistrationNumber() != null ? request.getRegistrationNumber() : "PENDING")
                    .serviceArea(request.getServiceArea() != null ? request.getServiceArea() : "")
                    .approvalStatus("PENDING")
                    .build();
            ngoRepository.save(ngo);
        }

        if (role == Role.NGO) {
            return AuthenticationResponse.builder()
                    .name(user.getName())
                    .email(user.getEmail())
                    .role(user.getRole())
                    .status("PENDING")
                    .message("NGO registration submitted. Access is pending Administrator approval.")
                    .build();
        }

        var jwtToken = jwtService.generateToken(user);
        var refreshToken = refreshTokenService.createRefreshToken(user.getId());
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .refreshToken(refreshToken.getToken())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .status("ACTIVE")
                .message("Registration successful.")
                .build();
    }

    public AuthenticationResponse registerHotel(RegisterRequest request) {
        request.setRole(Role.HOTEL);
        return register(request);
    }

    public AuthenticationResponse registerNgo(RegisterRequest request) {
        request.setRole(Role.NGO);
        return register(request);
    }

    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        var user = repository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password"));

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );
        } catch (DisabledException ex) {
            if ("PENDING".equalsIgnoreCase(user.getAccountStatus())) {
                return AuthenticationResponse.builder()
                        .name(user.getName())
                        .email(user.getEmail())
                        .role(user.getRole())
                        .status("PENDING")
                        .message("Your account is pending Admin approval.")
                        .build();
            }
            throw ex;
        } catch (LockedException ex) {
            if ("SUSPENDED".equalsIgnoreCase(user.getAccountStatus())) {
                return AuthenticationResponse.builder()
                        .name(user.getName())
                        .email(user.getEmail())
                        .role(user.getRole())
                        .status("SUSPENDED")
                        .message("Your account has been suspended by the administrator.")
                        .build();
            }
            throw ex;
        }

        var jwtToken = jwtService.generateToken(user);
        var refreshToken = refreshTokenService.createRefreshToken(user.getId());
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .refreshToken(refreshToken.getToken())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getAccountStatus())
                .message("Login successful.")
                .build();
    }

    @org.springframework.beans.factory.annotation.Autowired(required = false)
    private org.springframework.mail.javamail.JavaMailSender mailSender;

    @org.springframework.beans.factory.annotation.Value("${spring.mail.host:}")
    private String smtpHost;

    @org.springframework.beans.factory.annotation.Value("${spring.mail.from:noreply@feedlink.ai}")
    private String smtpFrom;

    public void forgotPassword(String email) {
        var user = repository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String resetLink = "http://localhost:5173/login?view=reset&email=" + email;
        
        if (smtpHost != null && !smtpHost.trim().isEmpty() && mailSender != null) {
            try {
                org.springframework.mail.SimpleMailMessage message = new org.springframework.mail.SimpleMailMessage();
                message.setFrom(smtpFrom);
                message.setTo(email);
                message.setSubject("FeedLink AI - Reset Password Request");
                message.setText("Hello " + user.getName() + ",\n\n" +
                        "We received a request to reset your password. Please use the link below to set a new password:\n" +
                        resetLink + "\n\n" +
                        "If you did not request this, you can ignore this email.\n\n" +
                        "Best regards,\nFeedLink AI Team");
                mailSender.send(message);
                System.out.println(">>> Real SMTP password reset email successfully dispatched to: " + email);
            } catch (Exception e) {
                System.err.println("Failed to send SMTP email: " + e.getMessage() + ". Falling back to simulated behavior.");
                System.out.println(">>> Simulated password reset link: " + resetLink);
            }
        } else {
            System.out.println(">>> SMTP Host is not configured. Simulating password reset link: " + resetLink);
        }
    }

    public void resetPassword(String email, String newPassword) {
        var user = repository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setPassword(passwordEncoder.encode(newPassword));
        repository.save(user);
    }
}

