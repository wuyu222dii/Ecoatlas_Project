package com.example.demo.utils;

import com.example.demo.common.AuthConstants;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {

    private final SecretKey key;
    private final long expirationMs;

    public JwtUtil(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.expiration-ms:7200000}") long expirationMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String generateToken(Long userId, String email) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);

        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("email", email)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public Long getUserId(String token) {
        return Long.parseLong(parseToken(token).getSubject());
    }

    public String getEmail(String token) {
        return (String) parseToken(token).get("email");
    }

    public boolean validateToken(String token) {
        try {
            parseToken(token);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    /**
     * Reads JWT from the {@code Authorization} header.
     * Accepts either {@code Bearer <jwt>} (RFC 6750) or a raw compact JWT (three Base64url segments).
     */
    public static String extractBearerToken(String authorization) {
        if (authorization == null || authorization.isBlank()) {
            return null;
        }
        String trimmed = stripJwtWrappers(authorization.trim());
        String prefix = AuthConstants.TOKEN_PREFIX;
        if (trimmed.length() > prefix.length()
                && trimmed.regionMatches(true, 0, prefix, 0, prefix.length())) {
            return trimmed.substring(prefix.length()).trim();
        }
        // Raw JWT pasted without "Bearer " prefix (e.g. Apifox / curl convenience)
        if (isLikelyCompactJwt(trimmed)) {
            return trimmed;
        }
        return null;
    }

    private static boolean isLikelyCompactJwt(String value) {
        if (value.length() < 20) {
            return false;
        }
        int dots = 0;
        for (int i = 0; i < value.length(); i++) {
            if (value.charAt(i) == '.') {
                dots++;
            }
        }
        return dots == 2;
    }

    /** Strip BOM, surrounding ASCII quotes, and angle brackets often pasted from docs/UI. */
    private static String stripJwtWrappers(String value) {
        String s = value;
        if (s.startsWith("\uFEFF")) {
            s = s.substring(1);
        }
        while (s.length() >= 2
                && ((s.startsWith("\"") && s.endsWith("\"")) || (s.startsWith("'") && s.endsWith("'")))) {
            s = s.substring(1, s.length() - 1).trim();
        }
        if (s.length() >= 2 && s.startsWith("<") && s.endsWith(">")) {
            s = s.substring(1, s.length() - 1).trim();
        }
        return s;
    }
}
