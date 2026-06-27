package com.feedlink.backend.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class StartupVerifier implements CommandLineRunner {

    @Value("${spring.datasource.url:}")
    private String datasourceUrl;

    @Value("${spring.datasource.username:}")
    private String datasourceUsername;

    @Value("${spring.datasource.password:}")
    private String datasourcePassword;

    @Value("${jwt.secret:}")
    private String jwtSecret;

    @Value("${fastapi.url:}")
    private String fastapiUrl;

    @Override
    public void run(String... args) throws Exception {
        if (datasourceUrl == null || datasourceUrl.trim().isEmpty()) {
            throw new IllegalStateException("CRITICAL STARTUP ERROR: SPRING_DATASOURCE_URL environment variable is missing.");
        }
        if (datasourceUsername == null || datasourceUsername.trim().isEmpty()) {
            throw new IllegalStateException("CRITICAL STARTUP ERROR: SPRING_DATASOURCE_USERNAME environment variable is missing.");
        }
        if (datasourcePassword == null || datasourcePassword.trim().isEmpty()) {
            throw new IllegalStateException("CRITICAL STARTUP ERROR: SPRING_DATASOURCE_PASSWORD environment variable is missing.");
        }
        if (jwtSecret == null || jwtSecret.trim().isEmpty()) {
            throw new IllegalStateException("CRITICAL STARTUP ERROR: JWT_SECRET environment variable is missing.");
        }
        if (jwtSecret.length() < 32) {
            throw new IllegalStateException("CRITICAL STARTUP ERROR: JWT_SECRET must be at least 32 characters long for security compliance.");
        }
        if (fastapiUrl == null || fastapiUrl.trim().isEmpty()) {
            throw new IllegalStateException("CRITICAL STARTUP ERROR: FASTAPI_URL environment variable is missing.");
        }
        System.out.println(">>> Startup Verifier: All required environment variables verified successfully!");
    }
}
