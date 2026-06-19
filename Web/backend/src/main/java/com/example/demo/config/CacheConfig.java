package com.example.demo.config;

import com.example.demo.dto.request.resonance.ResonanceListRequest;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.interceptor.KeyGenerator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableCaching
public class CacheConfig {

    @Bean
    public KeyGenerator resonanceListKeyGenerator() {
        return (target, method, params) -> {
            Long userId = (Long) params[0];
            ResonanceListRequest req = (ResonanceListRequest) params[1];
            String q = req.getQ() == null ? "" : req.getQ().trim();
            return "u" + userId + ":p" + req.getPage() + ":s" + req.getSize() + ":q" + q;
        };
    }
}
