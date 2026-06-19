package com.example.demo.controller;

import com.example.demo.common.config.JwtAuthentication;
import com.example.demo.dto.request.*;
import com.example.demo.dto.response.ApiResponse;
import com.example.demo.dto.response.LoginResponse;
import com.example.demo.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register/send-code")
    public ResponseEntity<ApiResponse<Void>> sendRegisterCode(@Valid @RequestBody SendCodeRequest request) {
        authService.sendRegisterCode(request);
        return ResponseEntity.ok(ApiResponse.success("Verification code sent", null));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<LoginResponse>> register(@Valid @RequestBody RegisterRequest request) {
        LoginResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success("Registration successful", response));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/google")
    public ResponseEntity<ApiResponse<LoginResponse>> googleLogin(@Valid @RequestBody GoogleLoginRequest request) {
        LoginResponse response = authService.googleLogin(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/forgot-password/send-code")
    public ResponseEntity<ApiResponse<Void>> sendForgotPasswordCode(@Valid @RequestBody SendCodeRequest request) {
        authService.sendForgotPasswordCode(request);
        return ResponseEntity.ok(ApiResponse.success("Verification code sent", null));
    }

    @PostMapping("/forgot-password/reset")
    public ResponseEntity<ApiResponse<Void>> resetPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.resetPassword(request);
        return ResponseEntity.ok(ApiResponse.success("Password reset successful", null));
    }

    @PostMapping("/change-password/send-code")
    public ResponseEntity<ApiResponse<Void>> sendChangePasswordCode(
            @AuthenticationPrincipal JwtAuthentication auth) {
        if (auth == null) {
            return ResponseEntity.ok(ApiResponse.fail(401, "Unauthorized or invalid token"));
        }
        authService.sendChangePasswordCode(auth.getEmail());
        return ResponseEntity.ok(ApiResponse.success("Verification code sent to your email.", null));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal JwtAuthentication auth,
            @Valid @RequestBody ChangePasswordRequest request) {
        if (auth == null) {
            return ResponseEntity.ok(ApiResponse.fail(401, "Unauthorized or invalid token"));
        }
        authService.changePassword(auth.getEmail(), request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully", null));
    }

    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(@AuthenticationPrincipal JwtAuthentication auth) {
        if (auth != null) {
            authService.logout(null);
        }
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully", null));
    }

    @PostMapping("/me")
    public ResponseEntity<ApiResponse<LoginResponse.UserResponse>> me(
            @AuthenticationPrincipal JwtAuthentication auth) {
        if (auth == null) {
            return ResponseEntity.ok(ApiResponse.fail(401, "Unauthorized or invalid token"));
        }
        LoginResponse.UserResponse user = authService.getCurrentUser(auth.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Current user fetched", user));
    }

    @PostMapping("/profile/name")
    public ResponseEntity<ApiResponse<LoginResponse.UserResponse>> updateName(
            @AuthenticationPrincipal JwtAuthentication auth,
            @Valid @RequestBody UpdateNameRequest request) {
        if (auth == null) {
            return ResponseEntity.ok(ApiResponse.fail(401, "Unauthorized or invalid token"));
        }
        LoginResponse.UserResponse user = authService.updateDisplayName(auth.getUserId(), request.getName());
        return ResponseEntity.ok(ApiResponse.success("Name updated", user));
    }

    @PostMapping("/profile/avatar")
    public ResponseEntity<ApiResponse<LoginResponse.UserResponse>> updateAvatar(
            @AuthenticationPrincipal JwtAuthentication auth,
            @Valid @RequestBody UpdateAvatarRequest request) {
        if (auth == null) {
            return ResponseEntity.ok(ApiResponse.fail(401, "Unauthorized or invalid token"));
        }
        LoginResponse.UserResponse user = authService.updateAvatar(auth.getUserId(), request.getAvatarUrl());
        return ResponseEntity.ok(ApiResponse.success("Avatar updated", user));
    }
}
