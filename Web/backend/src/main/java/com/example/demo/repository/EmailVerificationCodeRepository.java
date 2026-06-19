package com.example.demo.repository;

import com.example.demo.model.EmailVerificationCode;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface EmailVerificationCodeRepository extends JpaRepository<EmailVerificationCode, Long> {

    Optional<EmailVerificationCode> findTopByEmailAndTypeAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(
            String email, String type, LocalDateTime now);

    Optional<EmailVerificationCode> findTopByEmailAndTypeOrderByCreatedAtDesc(String email, String type);
}
