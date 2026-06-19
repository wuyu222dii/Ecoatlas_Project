package com.example.demo.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Health / root path for browser checks or probes.
 * Business APIs use POST; see docs/API_AUTH.md.
 */
@RestController
public class HealthController {

    @GetMapping("/")
    public ResponseEntity<Map<String, Object>> root() {
        return ResponseEntity.ok(Map.of(
                "status", "ok",
                "message", "Six Cookies API is running. Please use POST for auth endpoints. See docs/API_AUTH.md"
        ));
    }
}
