package com.example.demo.common.config;

import org.springframework.security.authentication.AbstractAuthenticationToken;

import java.util.Collections;

public class JwtAuthentication extends AbstractAuthenticationToken {

    private final Long userId;
    private final String email;

    public JwtAuthentication(Long userId, String email) {
        super(Collections.emptyList());
        this.userId = userId;
        this.email = email;
        setAuthenticated(true);
    }

    public Long getUserId() {
        return userId;
    }

    public String getEmail() {
        return email;
    }

    @Override
    public Object getCredentials() {
        return null;
    }

    /**
     * Must return this instance so {@code @AuthenticationPrincipal JwtAuthentication} resolves correctly
     * (Spring injects {@code getPrincipal()}, not the {@link org.springframework.security.core.Authentication} wrapper type).
     */
    @Override
    public Object getPrincipal() {
        return this;
    }

    @Override
    public String getName() {
        return email != null ? email : String.valueOf(userId);
    }
}
