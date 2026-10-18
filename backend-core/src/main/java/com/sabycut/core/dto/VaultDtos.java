package com.sabycut.core.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class VaultDtos {

    public record StoreKeyRequest(
        @NotBlank @Pattern(regexp = "OPENAI|GEMINI") String provider,
        @NotBlank String apiKey
    ) {}

    public record KeyStatusResponse(
        String provider,
        String lastFour,
        boolean configured
    ) {}

    public record TestKeyRequest(
        @NotBlank @Pattern(regexp = "OPENAI|GEMINI") String provider,
        String apiKey
    ) {}

    public record TestKeyResponse(
        String provider,
        boolean valid,
        String message
    ) {}
}
