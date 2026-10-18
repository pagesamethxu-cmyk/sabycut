package com.sabycut.core.service;

import com.sabycut.core.dto.VaultDtos.*;
import com.sabycut.core.entity.EncryptedKey;
import com.sabycut.core.entity.User;
import com.sabycut.core.repository.EncryptedKeyRepository;
import com.sabycut.core.security.EncryptedVaultService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class VaultService {

    private final EncryptedVaultService encryptedVaultService;
    private final EncryptedKeyRepository encryptedKeyRepository;

    // In-memory encrypted store for guest users (keys encrypted with master key, zero logs)
    private final Map<String, EncryptedVaultService.EncryptedResult> guestKeyStore = new ConcurrentHashMap<>();

    public VaultService(EncryptedVaultService encryptedVaultService, EncryptedKeyRepository encryptedKeyRepository) {
        this.encryptedVaultService = encryptedVaultService;
        this.encryptedKeyRepository = encryptedKeyRepository;
    }

    @Transactional
    public KeyStatusResponse storeKey(User user, StoreKeyRequest request) {
        String provider = request.provider().trim().toUpperCase();
        String rawKey = request.apiKey().trim();

        // Encrypt with AES-256-GCM
        EncryptedVaultService.EncryptedResult encrypted = encryptedVaultService.encryptKey(rawKey);

        if (user != null) {
            Optional<EncryptedKey> existing = encryptedKeyRepository.findByUserIdAndProvider(user.getId(), provider);
            EncryptedKey keyEntity;
            if (existing.isPresent()) {
                keyEntity = existing.get();
                keyEntity.setEncryptedKey(encrypted.ciphertextBase64());
                keyEntity.setIv(encrypted.ivHex());
                keyEntity.setLastFour(encrypted.lastFour());
            } else {
                keyEntity = new EncryptedKey(user, provider, encrypted.ciphertextBase64(), encrypted.ivHex(), encrypted.lastFour());
            }
            encryptedKeyRepository.save(keyEntity);
        } else {
            // Guest mode storage (isolated by provider for active session)
            guestKeyStore.put(provider, encrypted);
        }

        // Return only provider and last four. Key is never returned to client.
        return new KeyStatusResponse(provider, encrypted.lastFour(), true);
    }

    public List<KeyStatusResponse> listConfiguredKeys(User user) {
        List<KeyStatusResponse> list = new ArrayList<>();
        if (user != null) {
            for (String provider : List.of("GEMINI", "OPENAI")) {
                Optional<EncryptedKey> k = encryptedKeyRepository.findByUserIdAndProvider(user.getId(), provider);
                if (k.isPresent()) {
                    list.add(new KeyStatusResponse(provider, k.get().getLastFour(), true));
                } else {
                    list.add(new KeyStatusResponse(provider, null, false));
                }
            }
        } else {
            for (String provider : List.of("GEMINI", "OPENAI")) {
                EncryptedVaultService.EncryptedResult r = guestKeyStore.get(provider);
                if (r != null) {
                    list.add(new KeyStatusResponse(provider, r.lastFour(), true));
                } else {
                    list.add(new KeyStatusResponse(provider, null, false));
                }
            }
        }
        return list;
    }

    @Transactional
    public boolean deleteKey(User user, String provider) {
        String prov = provider.trim().toUpperCase();
        if (user != null) {
            Optional<EncryptedKey> k = encryptedKeyRepository.findByUserIdAndProvider(user.getId(), prov);
            if (k.isPresent()) {
                encryptedKeyRepository.delete(k.get());
                return true;
            }
        } else {
            return guestKeyStore.remove(prov) != null;
        }
        return false;
    }

    /**
     * Decrypts the key strictly in-memory on the server.
     * Never logged, never exposed to client.
     */
    public Optional<String> getDecryptedKey(User user, String provider, String guestExplicitKey) {
        String prov = provider.trim().toUpperCase();

        // 1. If user provided a guest API key directly in this call
        if (guestExplicitKey != null && !guestExplicitKey.isBlank()) {
            return Optional.of(guestExplicitKey.trim());
        }

        // 2. If logged in, fetch from DB
        if (user != null) {
            Optional<EncryptedKey> k = encryptedKeyRepository.findByUserIdAndProvider(user.getId(), prov);
            if (k.isPresent()) {
                String plain = encryptedVaultService.decryptKey(k.get().getEncryptedKey(), k.get().getIv());
                return Optional.of(plain);
            }
        }

        // 3. If guest in-memory vault has it
        EncryptedVaultService.EncryptedResult r = guestKeyStore.get(prov);
        if (r != null) {
            String plain = encryptedVaultService.decryptKey(r.ciphertextBase64(), r.ivHex());
            return Optional.of(plain);
        }

        return Optional.empty();
    }

    public TestKeyResponse testKeyFormat(TestKeyRequest request, User user) {
        String provider = request.provider().trim().toUpperCase();
        String rawKey = request.apiKey();

        if (rawKey == null || rawKey.isBlank()) {
            Optional<String> existing = getDecryptedKey(user, provider, null);
            if (existing.isPresent()) {
                rawKey = existing.get();
            } else {
                return new TestKeyResponse(provider, false, "No API key found in vault or request.");
            }
        }

        // Format check
        if ("GEMINI".equals(provider)) {
            if (rawKey.startsWith("AIza") && rawKey.length() >= 30) {
                return new TestKeyResponse(provider, true, "Gemini API key structure is valid.");
            } else {
                return new TestKeyResponse(provider, false, "Invalid Gemini API key structure (expected starting with 'AIza').");
            }
        } else if ("OPENAI".equals(provider)) {
            if ((rawKey.startsWith("sk-") || rawKey.startsWith("sk-proj-")) && rawKey.length() >= 25) {
                return new TestKeyResponse(provider, true, "OpenAI API key structure is valid.");
            } else {
                return new TestKeyResponse(provider, false, "Invalid OpenAI API key structure (expected starting with 'sk-').");
            }
        }

        return new TestKeyResponse(provider, false, "Unsupported provider: " + provider);
    }
}
