package com.sabycut.core.controller;

import com.sabycut.core.entity.EncryptedKey;
import com.sabycut.core.entity.User;
import com.sabycut.core.repository.EncryptedKeyRepository;
import com.sabycut.core.repository.UserRepository;
import com.sabycut.core.security.EncryptedVaultService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/keys")
public class ApiKeyController {

    private final EncryptedVaultService vaultService;
    private final EncryptedKeyRepository keyRepository;
    private final UserRepository userRepository;

    public ApiKeyController(
            EncryptedVaultService vaultService,
            EncryptedKeyRepository keyRepository,
            UserRepository userRepository
    ) {
        this.vaultService = vaultService;
        this.keyRepository = keyRepository;
        this.userRepository = userRepository;
    }

    public record KeySaveRequest(String provider, String apiKey, String model) {}
    public record KeyInfoResponse(String provider, String lastFour, String updatedAt) {}
    public record TestKeyRequest(String provider, String apiKey) {}

    @GetMapping
    public ResponseEntity<List<KeyInfoResponse>> getKeys(@AuthenticationPrincipal User user) {
        String userId = resolveUserId(user);
        List<EncryptedKey> keys = keyRepository.findByUserId(userId);
        List<KeyInfoResponse> responses = new ArrayList<>();
        for (EncryptedKey k : keys) {
            responses.add(new KeyInfoResponse(
                    k.getProvider(),
                    k.getLastFour(),
                    k.getUpdatedAt() != null ? k.getUpdatedAt().toString() : ""
            ));
        }
        return ResponseEntity.ok(responses);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<?> saveKey(
            @AuthenticationPrincipal User user,
            @RequestBody KeySaveRequest request
    ) {
        if (request.provider() == null || request.provider().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Provider is required"));
        }
        if (request.apiKey() == null || request.apiKey().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "API key cannot be empty"));
        }

        String normalizedProvider = request.provider().trim().toUpperCase();
        if (!normalizedProvider.equals("OPENAI") && !normalizedProvider.equals("GEMINI")) {
            return ResponseEntity.badRequest().body(Map.of("error", "Provider must be OPENAI or GEMINI"));
        }

        String userId = resolveUserId(user);
        User resolvedUser = userRepository.findById(userId).orElseGet(() -> {
            User guest = new User("guest_" + userId, "guest_" + userId + "@sabycut.local", "NOPASSWORD");
            guest.setId(userId);
            return userRepository.save(guest);
        });

        EncryptedVaultService.EncryptedResult encrypted = vaultService.encryptKey(request.apiKey());

        Optional<EncryptedKey> existing = keyRepository.findByUserIdAndProvider(userId, normalizedProvider);
        EncryptedKey keyEntity;
        if (existing.isPresent()) {
            keyEntity = existing.get();
            keyEntity.setEncryptedKey(encrypted.ciphertextBase64());
            keyEntity.setIv(encrypted.ivHex());
            keyEntity.setLastFour(encrypted.lastFour());
        } else {
            keyEntity = new EncryptedKey(
                    resolvedUser,
                    normalizedProvider,
                    encrypted.ciphertextBase64(),
                    encrypted.ivHex(),
                    encrypted.lastFour()
            );
        }

        keyRepository.save(keyEntity);

        return ResponseEntity.ok(Map.of(
                "provider", normalizedProvider,
                "lastFour", encrypted.lastFour(),
                "status", "saved"
        ));
    }

    @DeleteMapping("/{provider}")
    @Transactional
    public ResponseEntity<?> deleteKey(
            @AuthenticationPrincipal User user,
            @PathVariable String provider
    ) {
        String userId = resolveUserId(user);
        String normalizedProvider = provider.trim().toUpperCase();
        keyRepository.deleteByUserIdAndProvider(userId, normalizedProvider);
        return ResponseEntity.ok(Map.of("success", true, "provider", normalizedProvider));
    }

    @PostMapping("/test")
    public ResponseEntity<?> testKey(
            @AuthenticationPrincipal User user,
            @RequestBody TestKeyRequest request
    ) {
        if (request.provider() == null || request.provider().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Provider is required"));
        }

        String normalizedProvider = request.provider().trim().toUpperCase();
        String apiKey = request.apiKey();

        if ((apiKey == null || apiKey.isBlank()) && user != null) {
            String userId = resolveUserId(user);
            Optional<EncryptedKey> existing = keyRepository.findByUserIdAndProvider(userId, normalizedProvider);
            if (existing.isPresent()) {
                apiKey = vaultService.decryptKey(existing.get().getEncryptedKey(), existing.get().getIv());
            }
        }

        if (apiKey == null || apiKey.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "API key is required for testing"));
        }

        String trimmed = apiKey.trim();
        boolean validFormat = false;
        if (normalizedProvider.equals("OPENAI")) {
            validFormat = trimmed.startsWith("sk-") && trimmed.length() >= 20;
        } else if (normalizedProvider.equals("GEMINI")) {
            validFormat = (trimmed.startsWith("AIzaSy") || trimmed.length() >= 25);
        }

        if (!validFormat) {
            return ResponseEntity.badRequest().body(Map.of(
                    "valid", false,
                    "error", "Invalid API key format for " + normalizedProvider
            ));
        }

        return ResponseEntity.ok(Map.of(
                "valid", true,
                "provider", normalizedProvider,
                "message", "Key format verified successfully"
        ));
    }

    private String resolveUserId(User user) {
        if (user != null && user.getId() != null) {
            return user.getId();
        }
        return "default_user";
    }
}
