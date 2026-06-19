package com.example.demo.mapper;

import com.example.demo.dto.response.LoginResponse;
import com.example.demo.model.User;

public final class UserMapper {

    private UserMapper() {
    }

    public static LoginResponse.UserResponse toUserResponse(User user) {
        if (user == null) {
            return null;
        }
        return LoginResponse.UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .avatarUrl(user.getAvatarUrl())
                .emailVerified(user.getEmailVerified())
                .build();
    }
}
