package com.sabycut.core.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDtos {

    public record RegisterRequest(
        @NotBlank @Size(min = 3, max = 50) String username,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 6, max = 100) String password
    ) {}

    public record LoginRequest(
        @NotBlank String usernameOrEmail,
        @NotBlank String password
    ) {}

    public record RefreshTokenRequest(
        @NotBlank String refreshToken
    ) {}

    public record UserDto(
        String id,
        String username,
        String email,
        String role
    ) {}

    public record AuthResponse(
        String accessToken,
        String refreshToken,
        UserDto user
    ) {}
}
