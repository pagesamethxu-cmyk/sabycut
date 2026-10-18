# SABYCUT Device Support Policy and Hardware Matrix

Document: docs/DEVICE_SUPPORT.md  
Version: 1.0.0  
Last Updated: 2026-10-18  
Author: SABYCUT Core Engineering  

---

## 1. Executive Summary

This document establishes the official device support tiering, platform policies, screen layout specifications, and graceful degradation matrix for SABYCUT across mobile applications (Android APK, iOS IPA) and mobile browsers (Progressive Web Application).

The foundational design mandate requires that SABYCUT never crashes. On low-capability devices, resource-intensive workflows degrade gracefully through automated quality adaptation, proxy pipelines, or server-side offloading, while presenting clear bilingual diagnostics (Khmer primary, English secondary).

---

## 2. Platform Support Standards

### 2.1 Android Platform Policy
- Minimum Operating System: Android 8.0 Oreo (API Level 26).
- Target Operating System: Android 14 / 15 (API Level 34 / 35).
- Architectures Supported:
  - 64-bit: arm64-v8a (primary production target).
  - 32-bit: armeabi-v7a (supported with low-tier memory profile).
  - x86 / x86_64: emulator builds.
- Baseline Hardware (Low-End):
  - RAM: 2.0 GB physical memory (available runtime heap: ~192 MB to 256 MB).
  - CPU: Quad-core 1.4 GHz ARM Cortex-A53.
  - Representative Models: Samsung Galaxy A01/A03/A10s, Xiaomi Redmi 6A/9A, Infinix Smart 6/7, Tecno Pop 5/6, Itel Vision 1/2.
- Mid-Tier Hardware:
  - RAM: 4.0 GB to 6.0 GB.
  - CPU: Octa-core 2.0 GHz ARM Cortex-A55 / Cortex-A76.
  - Representative Models: Samsung Galaxy A34/A54, Xiaomi Redmi Note 11/12, Oppo Reno 8/9, Vivo Y-series, Realme 9/10.
- High-Tier Hardware:
  - RAM: 8.0 GB or greater.
  - CPU / GPU: Qualcomm Snapdragon 8 Gen 1/2/3, MediaTek Dimensity 9000+, Google Tensor G2/G3/G4.
  - Representative Models: Samsung Galaxy S22/S23/S24, Google Pixel 7/8/9, Xiaomi 13/14.

### 2.2 iOS Platform Policy
- Minimum Operating System: iOS 15.0.
- Target Operating System: iOS 17 / iOS 18 (latest public releases).
- Device Scope:
  - Compact / Legacy Baseline: iPhone SE (1st gen 2016, 2nd gen 2020, 3rd gen 2022), iPhone 6s/7/8 with 2 GB - 3 GB RAM.
  - Notch Baseline: iPhone X, XR, XS, 11, 12, 13, 14 standard models.
  - Dynamic Island Flagships: iPhone 14 Pro/Pro Max, iPhone 15 series, iPhone 16 series.
  - Tablet Form Factor: iPad mini (5th gen+), iPad (6th gen+), iPad Air (3rd gen+), iPad Pro (all sizes), including Split View, Slide Over, and Stage Manager multitasking.

### 2.3 Browser and PWA Policy
- Tier 1 (Fully Supported):
  - Google Chrome for Android (version 90+).
  - Apple Safari on iOS (WebKit iOS 15+).
  - Samsung Internet Browser (version 16+).
- Tier 2 (Supported with Standard Fallbacks):
  - Mozilla Firefox Mobile (version 95+).
  - Microsoft Edge Mobile (version 90+).
  - Opera Mobile.
- Tier 3 (In-App WebViews - Limited Capabilities):
  - Facebook In-App Browser, Telegram In-App Browser, TikTok In-App Browser, Instagram In-App Browser.
  - Policy: Detect in-app container. WebCodecs, full-screen canvas, and persistent storage are often crippled or sandboxed. Display an informational banner in Khmer and English advising the user to open in Chrome or Safari, with a one-click copy URL button.

---

## 3. Screen Dimensions and Responsive Constraints

SABYCUT is engineered to render without clipping, overlap, or text truncation across the following screen parameter matrix:

| Form Factor | Viewport Width Range | Aspect Ratio Range | Layout Mode | Key Considerations |
|---|---|---|---|---|
| Compact Mobile | 320 px to 375 px | 16:9 to 20:9 | Single Column Vertical Stack | Preview fixed top, scrollable timeline, touch targets locked at 44x44 px minimum |
| Standard Mobile | 375 px to 430 px | 18:9 to 21:9 | Standard Mobile Shell | Safe-area inset handling for notch and home indicator |
| Tall / Dynamic Island | 393 px to 440 px | 19.5:9 to 21:9 | Standard Mobile Shell | Dynamic Island top inset compensation, 100dvh |
| Foldable (Outer Screen) | 280 px to 340 px | 21:9 to 23:9 | Ultra-narrow Stack | ICU word segmentation for Khmer titles; horizontally scrollable toolbars |
| Foldable (Inner Screen) | 600 px to 768 px | 4:3 to 1:1 | Adaptive Dual Pane | Preview left, timeline and inspector split right |
| Tablet (Portrait) | 768 px to 834 px | 4:3 to 16:10 | Tablet Portrait | Expanded track view, docked inspector pane |
| Tablet (Landscape) | 1024 px to 1366 px | 16:10 to 4:3 | Desktop Pro Layout | Three-column desktop interface matching CapCut desktop view |
| Mobile Landscape | 568 px to 932 px | 16:9 to 21:9 | Horizontal Compact | Left preview, right timeline, floating compact transport |

### 3.1 Safe Area and Display Accommodations
- Viewport Meta: `width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover`.
- Safe Area Insets: All boundary containers must reference `env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`, `env(safe-area-inset-left)`, and `env(safe-area-inset-right)`.
- Vertical Units: Exclusively utilize `100dvh` with a `100vh` fallback to eliminate address bar jump in mobile browsers.
- Touch Target Minimum: Every clickable icon, slider thumb, track header button, and trim handle must measure no less than 44 px by 44 px in computed bounding box.
- Dynamic Font Scaling: Layout integrity maintained up to 200% system font scaling (Accessibility text size) without breaking container boundaries or causing unreadable text collisions.

---

## 4. Hardware Capability Detection and Tiering Matrix

On initial launch, SABYCUT executes a sub-50ms capability assessment before initializing heavy rendering sub-systems:

```
+--------------------------------------------------------------------+
|                   Device Capability Assessment                     |
|                                                                    |
|  RAM (navigator.deviceMemory)        Storage (navigator.storage)   |
|  CPU (navigator.hardwareConcurrency) WebCodecs (VideoDecoder)      |
|  GPU (WebGL2 / WebGL1 / MaxTexture)  AudioContext (SampleRate)     |
|  WebView Version (UserAgent)         TouchPoints & PixelRatio      |
+---------------------------------+----------------------------------+
                                  |
                                  v
+--------------------------------------------------------------------+
|                      Assigned Device Tier                          |
|                                                                    |
|  [Low Tier]                   [Mid Tier]              [High Tier]  |
|  RAM <= 3GB, <= 4 Cores      RAM 4-6GB, 6-8 Cores    RAM >= 8GB    |
|  WebGL1 or Weak GPU          WebGL2, Mid GPU         WebGL2 High   |
+--------------------------------------------------------------------+
```

### 4.1 Tier Operational Parameters

| Operational Metric | Low Tier (Baseline 2GB) | Mid Tier (4-6GB) | High Tier (8GB+) |
|---|---|---|---|
| Preview Resolution | 360p (640x360) Proxy | 540p (960x540) Proxy | 720p / 1080p Full |
| Preview Frame Rate | 24 frames per second | 30 frames per second | 30 to 60 frames per second |
| Max Concurrent Video Layers | 2 layers | 4 layers | 8+ layers |
| WebGL Rendering Engine | WebGL1 with Canvas 2D fallback | WebGL2 Standard Shaders | WebGL2 Full Shader Pipeline |
| Audio Waveform Resolution | 200 sample points per clip | 500 sample points per clip | 1000 sample points per clip |
| Video Filmstrip Thumbnails | 1 thumbnail per 5 seconds | 1 thumbnail per 2 seconds | 1 thumbnail per 1 second |
| Undo History Buffer Depth | 20 snapshots max | 50 snapshots | 100 snapshots |
| Export Target Resolution | 720p default (1080p warned) | 1080p default | Up to 4K (2160p) |
| Complex Shaders / LUTs | Simplified 1-pass shader | Standard 2-pass shader | Multi-pass Bloom & Grading |
| Thermal Throttling Action | Drop to 18 fps preview | Drop to 24 fps preview | Drop to 30 fps preview |

---

## 5. Graceful Degradation and Fallback Matrix

When a device fails capability requirements, SABYCUT falls back transparently according to this hierarchy:

| Feature | Primary Engine | Fallback 1 | Fallback 2 | User Notification |
|---|---|---|---|---|
| Video Decoding | Hardware WebCodecs API | HTML5 Video Element with offscreen canvas capture | Software Transcode to 360p Proxy via ai-service | None (silent automated downgrade) |
| Video Composition | WebGL2 Multi-texture Shader | WebGL1 Shader (basic blend equations) | HTML5 Canvas 2D Context | None (seamless visual continuity) |
| Audio Processing | WebAudio AudioWorklet | WebAudio ScriptProcessorNode | HTML5 Audio playback | None |
| Video Export | Client-side WebCodecs / WebM | Client Canvas Frame Recorder (MediaRecorder API) | Cloud Server Render (Spring Core + FFmpeg) | "Rendering on server for optimal quality on your device" (Khmer and English) |
| AI Auto Cut Analysis | Local ai-service PySceneDetect + librosa | Remote Flask ai-service | Rule-based timeline cut on audio silence | Step list progress indicator |
| AI Background Removal | WebGL Real-time Human Matting | Server-side rembg / PyTorch pipeline | Bounding box crop with feathered oval mask | "Processing background on server" modal |
| 4K UHD Export | Client GPU encoder | 1080p Render with prompt | Server-side 4K queue | "4K export requires higher device memory. Export in 1080p or send to server?" |
| Khmer Text Typography | Bundled WOFF2 fonts with HarfBuzz WebAssembly | Bundled TTF fonts with Canvas 2D text measure | System sans-serif with zero-width space insertion | None |
| Storage Low (<100MB) | Local IndexedDB Cache | Evict cached proxies and thumbnails | Prompt to export project JSON and clear cache | Clear modal warning with storage breakdown |

---

## 6. Permissions and Scoped Storage Policy

### 6.1 Android Permission Handling Across Versions
- Android 8.0 - 12 (API 26 - 32):
  - Requests `READ_EXTERNAL_STORAGE` and `WRITE_EXTERNAL_STORAGE`.
- Android 13 (API 33):
  - Requests granular media permissions: `READ_MEDIA_IMAGES`, `READ_MEDIA_VIDEO`, `READ_MEDIA_AUDIO`.
- Android 14+ (API 34+):
  - Requests `READ_MEDIA_VISUAL_USER_SELECTED` for partial photo library access. If partial access granted, SABYCUT shows a banner to pick additional videos without resetting project state.
- Foreground Service:
  - Declares `FOREGROUND_SERVICE` and `FOREGROUND_SERVICE_DATA_SYNC` to guarantee that video export finishes even if the user minimizes the app.

### 6.2 iOS Permission Handling
- Gallery Import: `NSPhotoLibraryUsageDescription` with support for Limited Photo Library picker (`PHAuthorizationStatusLimited`).
- Camera Capture: `NSCameraUsageDescription`.
- Microphone Voiceover: `NSMicrophoneUsageDescription`.
- Export Save: `NSPhotoLibraryAddUsageDescription`.

### 6.3 Pre-Permission Bilingual Explanation
Before calling native OS permission prompts, SABYCUT renders a contextual explanation modal in Khmer and English explaining specifically why the permission is required. If denied, the modal explains how to enable access in Settings with a direct link button.

---

## 7. Memory and Battery Management Rules

1. Deterministic Resource Deallocation:
   - When clips or tracks are deleted or unloaded from the viewport, associated `WebGLTexture`, `ImageBitmap`, `AudioBuffer`, and `VideoFrame` references must be explicitly destroyed via `gl.deleteTexture()`, `frame.close()`, and `URL.revokeObjectURL()`.
2. App Backgrounding Safeguard:
   - On `visibilitychange === 'hidden'`, `freeze`, or Capacitor `appStateChange`, the current project state is immediately serialized and persisted to IndexedDB within 200 milliseconds.
   - Decoders and playback intervals pause immediately to halt CPU wake-locks.
3. Thermal and Battery Throttling:
   - On devices supporting Battery Status API (`navigator.getBattery`), if battery level is under 15% and discharging, SABYCUT automatically activates Battery Saver mode (Low Tier profile).
4. Vendor Background Killer Mitigation:
   - On aggressive vendor skins (Xiaomi MIUI/HyperOS, Oppo ColorOS, Vivo FuntouchOS, Huawei EMUI, Samsung OneUI), export flows display clear instructions guiding users to exempt SABYCUT from aggressive battery optimization.

---

## 8. Summary of Verification Status

| Device Classification | Verified In Test Matrix | Verification Method | Status |
|---|---|---|---|
| Low-End Android (2GB, Android 8-10) | Yes | Playwright Low-Memory Emulation + Armv7 profile | Verified with Fallback |
| Mid-Tier Android (4-6GB, Android 11-13) | Yes | Playwright Mid-Tier Emulation + Moto G Power profile | Verified |
| High-Tier Android (8GB+, Android 14+) | Yes | Playwright Pixel 7 / Galaxy S24 emulation | Verified |
| Foldable Android (Inner/Outer) | Yes | Dual-viewport responsive emulation (280px & 768px) | Verified |
| Compact iOS (iPhone SE) | Yes | Playwright iPhone SE emulation (375x667) | Verified |
| Notch iOS (iPhone 12 / 13) | Yes | Playwright iPhone 12 emulation with safe areas | Verified |
| Dynamic Island iOS (iPhone 14/15/16 Pro) | Yes | Playwright iPhone 14 Pro emulation (393x852) | Verified |
| Tablet / iPad | Yes | Playwright iPad Pro emulation (1024x1366) | Verified |
| PWA Browsers (Chrome, Safari, Samsung) | Yes | Browser matrix execution | Verified |
| Real Physical Phone Fleet (All 5000+ Android Models) | No | Representative matrix tested; capability detection handles arbitrary devices | Honest limitation |
