package com.sabycut.core.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class EncryptedVaultServiceTest {

    private EncryptedVaultService vaultService;

    @BeforeEach
    void setUp() {
        // 32-byte hex test key
        vaultService = new EncryptedVaultService("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef");
    }

    @Test
    void shouldEncryptAndDecryptApiKeySuccessfully() {
        String originalKey = "sk-proj-test123456789abcdef";

        EncryptedVaultService.EncryptedResult result = vaultService.encryptKey(originalKey);

        assertNotNull(result.ciphertextBase64());
        assertNotNull(result.ivHex());
        assertEquals("cdef", result.lastFour());
        assertNotEquals(originalKey, result.ciphertextBase64());

        String decrypted = vaultService.decryptKey(result.ciphertextBase64(), result.ivHex());
        assertEquals(originalKey, decrypted);
    }

    @Test
    void shouldThrowExceptionWhenKeyIsEmpty() {
        assertThrows(IllegalArgumentException.class, () -> vaultService.encryptKey(""));
    }
}
