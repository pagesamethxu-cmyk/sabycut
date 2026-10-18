package com.sabycut.core.dto;

import java.util.List;
import java.util.Map;

public class AutoCutDtos {

    public record AutoCutRequest(
        List<String> videoUrls,
        List<String> videoNames,
        Double videoDuration,
        String formType, // "preset", "custom", "reference"
        String formPreset, // "tiktok", "vlog", "gaming", "podcast"
        Map<String, Object> customFormConfig,
        String referenceVideoUrl,
        String prompt,
        String provider, // "GEMINI" or "OPENAI"
        String guestApiKey
    ) {}

    public record PartialEditRequest(
        String clipId,
        Double rangeStart,
        Double rangeEnd,
        String instruction,
        String currentTimelineJson,
        String provider,
        String guestApiKey
    ) {}

    public record ProgressUpdate(
        String jobId,
        String step, // "analyzing", "planning", "building", "rendering", "completed", "failed"
        int progress,
        String message,
        Object payload
    ) {}

    public record JobStatusResponse(
        String id,
        String status,
        String currentStep,
        int progressPercentage,
        String timelineJson,
        String errorMessage
    ) {}
}
