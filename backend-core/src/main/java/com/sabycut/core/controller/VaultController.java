package com.sabycut.core.controller;

import com.sabycut.core.dto.VaultDtos.*;
import com.sabycut.core.entity.User;
import com.sabycut.core.service.VaultService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/keys")
public class VaultController {

    private final VaultService vaultService;

    public VaultController(VaultService vaultService) {
        this.vaultService = vaultService;
    }

    @PostMapping({"", "/vault"})
    public ResponseEntity<KeyStatusResponse> saveKey(
        @AuthenticationPrincipal User user,
        @Valid @RequestBody StoreKeyRequest request
    ) {
        KeyStatusResponse response = vaultService.storeKey(user, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping({"", "/vault"})
    public ResponseEntity<List<KeyStatusResponse>> getKeys(
        @AuthenticationPrincipal User user
    ) {
        List<KeyStatusResponse> keys = vaultService.listConfiguredKeys(user);
        return ResponseEntity.ok(keys);
    }

    @DeleteMapping({"/{provider}", "/vault/{provider}"})
    public ResponseEntity<?> deleteKey(
        @AuthenticationPrincipal User user,
        @PathVariable String provider
    ) {
        boolean deleted = vaultService.deleteKey(user, provider);
        return ResponseEntity.ok(Map.of("success", deleted, "provider", provider.toUpperCase()));
    }

    @PostMapping("/test")
    public ResponseEntity<TestKeyResponse> testKey(
        @AuthenticationPrincipal User user,
        @Valid @RequestBody TestKeyRequest request
    ) {
        TestKeyResponse response = vaultService.testKeyFormat(request, user);
        return ResponseEntity.ok(response);
    }
}
