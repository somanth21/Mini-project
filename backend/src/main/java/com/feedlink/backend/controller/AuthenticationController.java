package com.feedlink.backend.controller;

import com.feedlink.backend.dto.*;
import com.feedlink.backend.entity.RefreshToken;
import com.feedlink.backend.security.JwtService;
import com.feedlink.backend.service.AuthenticationService;
import com.feedlink.backend.service.RefreshTokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class AuthenticationController {

    private final AuthenticationService service;
    private final RefreshTokenService refreshTokenService;
    private final JwtService jwtService;

    @PostMapping("/register-hotel")
    public ResponseEntity<AuthenticationResponse> registerHotel(
            @RequestBody RegisterRequest request
    ) {
        return ResponseEntity.ok(service.registerHotel(request));
    }

    @PostMapping("/register-ngo")
    public ResponseEntity<AuthenticationResponse> registerNgo(
            @RequestBody RegisterRequest request
    ) {
        return ResponseEntity.ok(service.registerNgo(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> authenticate(
            @RequestBody AuthenticationRequest request
    ) {
        return ResponseEntity.ok(service.authenticate(request));
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestBody TokenRefreshRequest request) {
        String requestRefreshToken = request.getRefreshToken();
        if (requestRefreshToken == null || requestRefreshToken.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("message", "Refresh token is missing"));
        }

        return refreshTokenService.findByToken(requestRefreshToken)
                .map(refreshTokenService::verifyExpiration)
                .map(RefreshToken::getUser)
                .map(user -> {
                    String token = jwtService.generateToken(user);
                    var newRefreshToken = refreshTokenService.createRefreshToken(user.getId());
                    return ResponseEntity.ok(TokenRefreshResponse.builder()
                            .accessToken(token)
                            .refreshToken(newRefreshToken.getToken())
                            .tokenType("Bearer")
                            .build());
                })
                .orElseGet(() -> ResponseEntity.status(403).body(null));
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logoutUser(@RequestBody(required = false) Map<String, String> requestBody) {
        String refreshToken = requestBody != null ? requestBody.get("refreshToken") : null;
        if (refreshToken != null) {
            refreshTokenService.findByToken(refreshToken).ifPresent(token -> {
                refreshTokenService.deleteByUserId(token.getUser().getId());
            });
        }
        return ResponseEntity.ok(Map.of("message", "Log out successful."));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Map<String, String>> forgotPassword(
            @RequestBody Map<String, String> request
    ) {
        String email = request.get("email");
        return ResponseEntity.ok(Map.of("message", "Password reset link sent to " + email));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(
            @RequestBody Map<String, String> request
    ) {
        String email = request.get("email");
        String password = request.get("password");
        service.resetPassword(email, password);
        return ResponseEntity.ok(Map.of("message", "Password reset successfully."));
    }
}
