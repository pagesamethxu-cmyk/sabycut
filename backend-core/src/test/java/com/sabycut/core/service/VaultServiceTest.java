package com.sabycut.core.service;

import com.sabycut.core.dto.VaultDtos.*;
import com.sabycut.core.entity.EncryptedKey;
import com.sabycut.core.entity.User;
import com.sabycut.core.repository.EncryptedKeyRepository;
import com.sabycut.core.security.EncryptedVaultService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VaultServiceTest {

    @Mock
    private EncryptedKeyRepository encryptedKeyRepository;

    private EncryptedVaultService encryptedVaultService;
    private VaultService vaultService;

    @BeforeEach
    void setUp() {
        encryptedVaultService = new EncryptedVaultService("0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef");
        vaultService = new VaultService(encryptedVaultService, encryptedKeyRepository);
    }

    @Test
    void shouldStoreKeyEncryptedInGuestVault() {
        StoreKeyRequest request = new StoreKeyRequest("GEMINI", "AIzaSyTestApiKey123456789abcdefg");
        KeyStatusResponse response = vaultService.storeKey(null, request);

        assertEquals("GEMINI", response.provider());
        assertTrue(response.configured());
        assertEquals("defg", response.lastFour());

        // Decrypt strictly on server
        Optional<String> decrypted = vaultService.getDecryptedKey(null, "GEMINI", null);
        assertTrue(decrypted.isPresent());
        assertEquals("AIzaSyTestApiKey123456789abcdefg", decrypted.get());
    }

    @Test
    void shouldStoreKeyEncryptedInDatabaseForUser() {
        User user = new User("tester", "tester@sabycut.com", "hash");
        when(encryptedKeyRepository.findByUserIdAndProvider(user.getId(), "OPENAI")).thenReturn(Optional.empty());

        StoreKeyRequest request = new StoreKeyRequest("OPENAI", "sk-proj-1234567890abcdef12345");
        KeyStatusResponse response = vaultService.storeKey(user, request);

        assertEquals("OPENAI", response.provider());
        assertEquals("2345", response.lastFour());
        verify(encryptedKeyRepository, times(1)).save(any(EncryptedKey.class));
    }

    @Test
    void shouldValidateKeyFormats() {
        TestKeyResponse geminiValid = vaultService.testKeyFormat(
            new TestKeyRequest("GEMINI", "AIzaSyValidGeminiKeyFormatHere1234567"), null);
        assertTrue(geminiValid.valid());

        TestKeyResponse geminiInvalid = vaultService.testKeyFormat(
            new TestKeyRequest("GEMINI", "invalid-key"), null);
        assertFalse(geminiInvalid.valid());

        TestKeyResponse openaiValid = vaultService.testKeyFormat(
            new TestKeyRequest("OPENAI", "sk-proj-ValidOpenAiKeyFormatHere1234"), null);
        assertTrue(openaiValid.valid());
    }
}
