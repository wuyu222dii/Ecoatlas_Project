package com.example.demo.service;

import com.example.demo.common.AuthConstants;
import com.example.demo.common.exception.BusinessException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username}")
    private String from;

    public void sendVerificationCode(String to, String code, String type) {
        String subject = getSubject(type);
        String content = getContent(type, code);

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(to);
        message.setSubject(subject);
        message.setText(content);

        try {
            mailSender.send(message);
            log.info("Verification code sent to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send email: {}", e.getMessage());
            throw new BusinessException(500, "Failed to send verification code, please try again later");
        }
    }

    private String getSubject(String type) {
        return switch (type) {
            case AuthConstants.CODE_TYPE_REGISTER -> "[Six Cookies] Registration Verification Code";
            case AuthConstants.CODE_TYPE_FORGOT_PASSWORD -> "[Six Cookies] Password Reset Verification Code";
            case AuthConstants.CODE_TYPE_CHANGE_PASSWORD -> "[Six Cookies] Change Password Verification Code";
            default -> "[Six Cookies] Verification Code";
        };
    }

    private String getContent(String type, String code) {
        return String.format(
                "Your verification code is: %s\n\nThe code expires in %d minutes. Do not share it with anyone.\n\nIf you did not request this, you can ignore this email.",
                code, AuthConstants.CODE_EXPIRE_MINUTES);
    }
}
