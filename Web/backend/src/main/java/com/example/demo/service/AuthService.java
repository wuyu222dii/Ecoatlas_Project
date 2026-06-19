package com.example.demo.service;

import com.example.demo.common.AuthConstants;
import com.example.demo.common.exception.BusinessException;
import com.example.demo.dto.request.*;
import com.example.demo.dto.response.LoginResponse;
import com.example.demo.mapper.UserMapper;
import com.example.demo.model.EmailVerificationCode;
import com.example.demo.model.User;
import com.example.demo.repository.EmailVerificationCodeRepository;
import com.example.demo.utils.JwtUtil;
import com.example.demo.utils.VerificationCodeUtil;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserService userService;
    private final EmailService emailService;
    private final EmailVerificationCodeRepository codeRepository;
    private final JwtUtil jwtUtil;
    private final PasswordEncoder passwordEncoder;
    private final GoogleTokenVerifier googleTokenVerifier;

    @Transactional
    public void sendRegisterCode(SendCodeRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (userService.existsByEmail(email)) {
            throw new BusinessException(409, "Email already registered");
        }
        sendCode(email, AuthConstants.CODE_TYPE_REGISTER);
    }

    @Transactional
    public LoginResponse register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (userService.existsByEmail(email)) {
            throw new BusinessException(409, "Email already registered");
        }
        verifyCode(email, request.getCode(), AuthConstants.CODE_TYPE_REGISTER);

        User user = User.builder()
                .email(email)
                .password(passwordEncoder.encode(request.getPassword()))
                .name(request.getName().trim())
                .emailVerified(true)
                .status(AuthConstants.USER_STATUS_ACTIVE)
                .build();
        user = userService.save(user);

        String token = jwtUtil.generateToken(user.getId(), user.getEmail());
        return LoginResponse.builder()
                .token(token)
                .user(UserMapper.toUserResponse(user))
                .build();
    }

    public LoginResponse login(LoginRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userService.findByEmailOrNull(email);
        if (user == null || user.getPassword() == null) {
            throw new BusinessException(401, "Invalid email or password");
        }
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException(401, "Invalid email or password");
        }
        userService.checkUserStatus(user);

        String token = jwtUtil.generateToken(user.getId(), user.getEmail());
        return LoginResponse.builder()
                .token(token)
                .user(UserMapper.toUserResponse(user))
                .build();
    }

    @Transactional
    public LoginResponse googleLogin(GoogleLoginRequest request) {
        GoogleIdToken.Payload payload = googleTokenVerifier.verify(request.getIdToken());

        String googleId = payload.getSubject();
        String email = payload.getEmail();
        String name = (String) payload.get("name");
        String pictureUrl = (String) payload.get("picture");

        User user = userService.findByGoogleIdOrNull(googleId);
        if (user == null) {
            user = userService.findByEmailOrNull(email);
            if (user != null) {
                user.setGoogleId(googleId);
                user.setName(name != null ? name : user.getName());
                user.setAvatarUrl(pictureUrl);
                user.setEmailVerified(true);
            } else {
                user = User.builder()
                        .email(email)
                        .googleId(googleId)
                        .name(name != null ? name : email)
                        .avatarUrl(pictureUrl)
                        .emailVerified(true)
                        .status(AuthConstants.USER_STATUS_ACTIVE)
                        .build();
            }
        } else {
            user.setName(name != null ? name : user.getName());
            user.setAvatarUrl(pictureUrl);
        }
        user = userService.save(user);
        userService.checkUserStatus(user);

        String token = jwtUtil.generateToken(user.getId(), user.getEmail());
        return LoginResponse.builder()
                .token(token)
                .user(UserMapper.toUserResponse(user))
                .build();
    }

    @Transactional
    public void sendForgotPasswordCode(SendCodeRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (!userService.existsByEmail(email)) {
            return;
        }
        sendCode(email, AuthConstants.CODE_TYPE_FORGOT_PASSWORD);
    }

    @Transactional
    public void resetPassword(ForgotPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        User user = userService.findByEmailOrNull(email);
        if (user == null) {
            throw new BusinessException(404, "Email is not registered");
        }
        verifyCode(email, request.getCode(), AuthConstants.CODE_TYPE_FORGOT_PASSWORD);

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userService.save(user);
    }

    @Transactional
    public void sendChangePasswordCode(String userEmail) {
        sendCode(userEmail, AuthConstants.CODE_TYPE_CHANGE_PASSWORD);
    }

    @Transactional
    public void changePassword(String userEmail, ChangePasswordRequest request) {
        verifyCode(userEmail, request.getCode(), AuthConstants.CODE_TYPE_CHANGE_PASSWORD);
        User user = userService.findByEmail(userEmail);
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userService.save(user);
    }

    public void logout(String token) {
        // If using a Redis denylist, add the token here.
        // Current implementation is stateless JWT; the client drops the token.
    }

    public LoginResponse.UserResponse getCurrentUser(Long userId) {
        User user = userService.findById(userId);
        userService.checkUserStatus(user);
        return UserMapper.toUserResponse(user);
    }

    @Transactional
    public LoginResponse.UserResponse updateDisplayName(Long userId, String nextName) {
        User user = userService.findById(userId);
        userService.checkUserStatus(user);
        user.setName(nextName.trim());
        user = userService.save(user);
        return UserMapper.toUserResponse(user);
    }

    @Transactional
    public LoginResponse.UserResponse updateAvatar(Long userId, String nextAvatarUrl) {
        User user = userService.findById(userId);
        userService.checkUserStatus(user);
        user.setAvatarUrl(nextAvatarUrl.trim());
        user = userService.save(user);
        return UserMapper.toUserResponse(user);
    }

    private void sendCode(String email, String type) {
        Optional<EmailVerificationCode> lastCode = codeRepository.findTopByEmailAndTypeOrderByCreatedAtDesc(email, type);
        if (lastCode.isPresent()) {
            LocalDateTime lastCreated = lastCode.get().getCreatedAt();
            if (lastCreated.plusSeconds(AuthConstants.CODE_SEND_INTERVAL_SECONDS).isAfter(LocalDateTime.now())) {
                throw new BusinessException(429, "Too many requests. Please try again in 1 minute");
            }
        }

        String code = VerificationCodeUtil.generate();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(AuthConstants.CODE_EXPIRE_MINUTES);

        EmailVerificationCode entity = EmailVerificationCode.builder()
                .email(email)
                .code(code)
                .type(type)
                .expiresAt(expiresAt)
                .used(false)
                .build();
        codeRepository.save(entity);

        emailService.sendVerificationCode(email, code, type);
    }

    private void verifyCode(String email, String code, String type) {
        LocalDateTime now = LocalDateTime.now();
        Optional<EmailVerificationCode> opt = codeRepository
                .findTopByEmailAndTypeAndUsedFalseAndExpiresAtAfterOrderByCreatedAtDesc(email, type, now);

        if (opt.isEmpty() || !opt.get().getCode().equals(code)) {
            throw new BusinessException(400, "Invalid or expired verification code");
        }

        EmailVerificationCode entity = opt.get();
        entity.setUsed(true);
        codeRepository.save(entity);
    }
}
