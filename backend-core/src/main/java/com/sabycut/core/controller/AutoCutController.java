package com.sabycut.core.controller;

import com.sabycut.core.dto.AutoCutDtos.*;
import com.sabycut.core.entity.User;
import com.sabycut.core.service.AutoCutService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/autocut")
public class AutoCutController {

    private final AutoCutService autoCutService;

    public AutoCutController(AutoCutService autoCutService) {
        this.autoCutService = autoCutService;
    }

    @PostMapping("/jobs")
    public ResponseEntity<?> startAutoCut(
        @AuthenticationPrincipal User user,
        @RequestBody AutoCutRequest request
    ) {
        try {
            JobStatusResponse response = autoCutService.startAutoCut(user, request);
            return ResponseEntity.status(HttpStatus.ACCEPTED).body(response);
        } catch (IllegalArgumentException e) {
            if ("API_KEY_REQUIRED".equals(e.getMessage())) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "error", "API_KEY_REQUIRED",
                    "message", "An API key for the chosen provider is required in Settings"
                ));
            }
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/jobs/{jobId}")
    public ResponseEntity<?> getJobStatus(@PathVariable String jobId) {
        try {
            JobStatusResponse status = autoCutService.getJobStatus(jobId);
            return ResponseEntity.ok(status);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/partial-edit")
    public ResponseEntity<?> partialEdit(
        @AuthenticationPrincipal User user,
        @RequestBody PartialEditRequest request
    ) {
        try {
            String updatedTimelineJson = autoCutService.handlePartialEdit(user, request);
            return ResponseEntity.ok(Map.of("timelineJson", updatedTimelineJson));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }
}
