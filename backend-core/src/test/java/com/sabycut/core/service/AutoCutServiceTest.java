package com.sabycut.core.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sabycut.core.dto.AutoCutDtos.*;
import com.sabycut.core.repository.JobRepository;
import com.sabycut.core.websocket.AutoCutWebSocketHandler;
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
class AutoCutServiceTest {

    @Mock
    private JobRepository jobRepository;

    @Mock
    private VaultService vaultService;

    @Mock
    private AutoCutWebSocketHandler webSocketHandler;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private AutoCutService autoCutService;

    @BeforeEach
    void setUp() {
        autoCutService = new AutoCutService(
            jobRepository,
            vaultService,
            webSocketHandler,
            objectMapper,
            "http://localhost:5000",
            "internal_secret_token_12345"
        );
    }

    @Test
    void shouldThrowWhenApiKeyIsMissing() {
        when(vaultService.getDecryptedKey(any(), eq("GEMINI"), any())).thenReturn(Optional.empty());

        AutoCutRequest req = new AutoCutRequest(
            List.of("video.mp4"),
            List.of("video.mp4"),
            20.0,
            "preset",
            "tiktok",
            null,
            null,
            "Do not use emoji.",
            "GEMINI",
            null
        );

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class, () -> autoCutService.startAutoCut(null, req));
        assertEquals("API_KEY_REQUIRED", ex.getMessage());
    }

    @Test
    void shouldStartJobWhenKeyIsProvided() {
        when(vaultService.getDecryptedKey(any(), eq("GEMINI"), any())).thenReturn(Optional.of("AIzaSyTestKey"));

        AutoCutRequest req = new AutoCutRequest(
            List.of("video.mp4"),
            List.of("video.mp4"),
            15.0,
            "preset",
            "tiktok",
            null,
            null,
            "Do not use emoji.",
            "GEMINI",
            null
        );

        JobStatusResponse res = autoCutService.startAutoCut(null, req);
        assertNotNull(res.id());
        assertEquals("PROCESSING", res.status());
    }

    @Test
    void shouldHandlePartialEditOnSpecificClip() {
        when(vaultService.getDecryptedKey(any(), eq("GEMINI"), any())).thenReturn(Optional.of("AIzaSyTestKey"));

        String inputTimeline = """
            {
              "tracks": [
                {
                  "id": "track-video",
                  "clips": [
                    { "id": "clip-v1", "start": 0.0, "end": 4.0, "title": "Clip 1" }
                  ]
                }
              ],
              "clipProperties": {
                "clip-v1": { "speed": 1.0 }
              }
            }
            """;

        PartialEditRequest req = new PartialEditRequest(
            "clip-v1",
            0.0,
            4.0,
            "make this faster",
            inputTimeline,
            "GEMINI",
            null
        );

        String resultJson = autoCutService.handlePartialEdit(null, req);
        assertNotNull(resultJson);
        assertTrue(resultJson.contains("\"speed\":1.5"));
    }
}
