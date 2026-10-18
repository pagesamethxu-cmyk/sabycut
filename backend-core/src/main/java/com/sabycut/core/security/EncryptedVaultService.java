package com.sabycut.core.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

@Service
public class EncryptedVaultService {

    private static final String ALGORITHM = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH_BITS = 128;
    private static final int IV_LENGTH_BYTES = 12;

    private final SecretKey masterSecretKey;
    private final SecureRandom secureRandom;

    public EncryptedVaultService(@Value("${sabycut.vault.master-key:0123456789abcdef0123456789abcdef}") String masterKeyHex) {
        byte[] keyBytes = HexFormat.of().parseHex(masterKeyHex.trim());
        if (keyBytes.length != 16 && keyBytes.length != 24 && keyBytes.length != 32) {
            byte[] padded = new byte[32];
            System.arraycopy(keyBytes, 0, padded, 0, Math.min(keyBytes.length, 32));
            keyBytes = padded;
        }
        this.masterSecretKey = new SecretKeySpec(keyBytes, "AES");
        this.secureRandom = new SecureRandom();
    }

    public record EncryptedResult(String ciphertextBase64, String ivHex, String lastFour) {}

    public EncryptedResult encryptKey(String plainApiKey) {
        if (plainApiKey == null || plainApiKey.isBlank()) {
            throw new IllegalArgumentException("API key cannot be empty");
        }

        try {
            byte[] iv = new byte[IV_LENGTH_BYTES];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv);
            cipher.init(Cipher.ENCRYPT_MODE, masterSecretKey, spec);

            byte[] cipherText = cipher.doFinal(plainApiKey.trim().getBytes(StandardCharsets.UTF_8));
            String ciphertextBase64 = Base64.getEncoder().encodeToString(cipherText);
            String ivHex = HexFormat.of().formatHex(iv);

            String trimmed = plainApiKey.trim();
            String lastFour = trimmed.length() > 4 ? trimmed.substring(trimmed.length() - 4) : trimmed;

            return new EncryptedResult(ciphertextBase64, ivHex, lastFour);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to encrypt API key", e);
        }
    }

    public String decryptKey(String ciphertextBase64, String ivHex) {
        try {
            byte[] iv = HexFormat.of().parseHex(ivHex);
            byte[] cipherText = Base64.getDecoder().decode(ciphertextBase64);

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            GCMParameterSpec spec = new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv);
            cipher.init(Cipher.DECRYPT_MODE, masterSecretKey, spec);

            byte[] plainBytes = cipher.doFinal(cipherText);
            return new String(plainBytes, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to decrypt API key", e);
        }
    }
}
