package com.feedlink.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.Map;

@RestController
public class HomeController {

    @GetMapping("/")
    public Map<String, String> home() {
        return Map.of(
            "message", "Welcome to the FeedLink AI Backend Service!",
            "status", "UP",
            "frontendUrl", "http://localhost:5173",
            "h2ConsoleUrl", "http://localhost:8080/h2-console"
        );
    }
}
