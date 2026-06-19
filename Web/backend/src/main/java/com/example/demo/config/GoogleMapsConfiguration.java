package com.example.demo.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.net.http.HttpClient;
import java.time.Duration;

@Configuration
@EnableConfigurationProperties(GoogleMapsProperties.class)
public class GoogleMapsConfiguration {

    @Bean
    public HttpClient googlePlacesHttpClient(GoogleMapsProperties properties) {
        int sec = Math.max(1, Math.min(properties.getRequestTimeoutSeconds(), 60));
        return HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(Math.min(10, sec)))
                .build();
    }
}
