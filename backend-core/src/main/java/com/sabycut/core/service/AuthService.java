package com.sabycut.core.service;

import com.sabycut.core.dto.AuthDtos.*;
import com.sabycut.core.entity.User;
import com.sabycut.core.repository.UserRepository;
import com.sabycut.core.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.username())) {
            throw new IllegalArgumentException("Username already in use");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email already in use");
        }

        User user = new User(
            request.username().trim(),
            request.email().trim().toLowerCase(),
            passwordEncoder.encode(request.password())
        );

        User savedUser = userRepository.save(user);
        String accessToken = jwtService.generateToken(savedUser.getId(), savedUser.getUsername());
        String refreshToken = jwtService.generateRefreshToken(savedUser.getId(), savedUser.getUsername());

        return new AuthResponse(
            accessToken,
            refreshToken,
            new UserDto(savedUser.getId(), savedUser.getUsername(), savedUser.getEmail(), savedUser.getRole())
        );
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String identifier = request.usernameOrEmail().trim();
        User user = userRepository.findByUsername(identifier)
            .or(() -> userRepository.findByEmail(identifier.toLowerCase()))
            .orElseThrow(() -> new IllegalArgumentException("Invalid username or password"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid username or password");
        }

        String accessToken = jwtService.generateToken(user.getId(), user.getUsername());
        String refreshToken = jwtService.generateRefreshToken(user.getId(), user.getUsername());

        return new AuthResponse(
            accessToken,
            refreshToken,
            new UserDto(user.getId(), user.getUsername(), user.getEmail(), user.getRole())
        );
    }

    public AuthResponse refreshToken(RefreshTokenRequest request) {
        if (!jwtService.isTokenValid(request.refreshToken())) {
            throw new IllegalArgumentException("Invalid or expired refresh token");
        }

        String userId = jwtService.extractUserId(request.refreshToken());
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        String newAccessToken = jwtService.generateToken(user.getId(), user.getUsername());
        String newRefreshToken = jwtService.generateRefreshToken(user.getId(), user.getUsername());

        return new AuthResponse(
            newAccessToken,
            newRefreshToken,
            new UserDto(user.getId(), user.getUsername(), user.getEmail(), user.getRole())
        );
    }
}
