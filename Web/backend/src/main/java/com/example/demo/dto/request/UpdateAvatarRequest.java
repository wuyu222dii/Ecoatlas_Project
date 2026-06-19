package com.example.demo.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateAvatarRequest {

    @NotBlank(message = "Avatar is required")
    @Size(max = 500, message = "Avatar value is too long")
    private String avatarUrl;
}
