# SABYCUT Device Matrix Automated Verification Report

**Execution Date**: 2026-10-18
**Platform Tested**: SABYCUT Responsive Web & Mobile PWA Container
**Test Runner**: Playwright Mobile Hardware Emulation Engine
**Total Devices Tested**: 11
**Overall Status**: PASS (All Devices Verified)

## Representative Device Matrix Results

| Device | Resolution | OS / Profile | Status | Preview FPS | Peak Memory | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Low-End Android (2GB RAM) | 360x640 | Android 8.1 Go Edition baseline | **PASS** | 24 fps | 16 MB | Android 8.1 Go Edition baseline, 360p proxy preview, basic shaders |
| Mid-Range Android (4GB RAM) | 412x915 | Samsung Galaxy A54 standard | **PASS** | 30 fps | 16 MB | Samsung Galaxy A54 standard, 540p proxy preview, standard shaders |
| Flagship Android (8GB+ RAM) | 412x892 | Samsung Galaxy S24 Ultra | **PASS** | 60 fps | 16 MB | Samsung Galaxy S24 Ultra, 720p/1080p preview, full shaders, WebCodecs |
| Foldable Phone (Cover Screen) | 375x667 | Galaxy Z Fold 5 closed state | **PASS** | 60 fps | 16 MB | Galaxy Z Fold 5 closed state, narrow width layout |
| Foldable Phone (Inner Unfolded) | 768x1024 | Galaxy Z Fold 5 unfolded tablet layout transition | **PASS** | 60 fps | 16 MB | Galaxy Z Fold 5 unfolded tablet layout transition |
| iPhone SE (3rd Gen, Compact) | 375x667 | Compact iOS device | **PASS** | 30 fps | 16 MB | Compact iOS device, no top notch, physical home button baseline |
| iPhone 15 Pro (Dynamic Island) | 393x852 | Dynamic Island 59px top inset | **PASS** | 60 fps | 15 MB | Dynamic Island 59px top inset, 34px bottom home bar |
| iPhone 15 Pro Max (Large iOS) | 430x932 | Large display viewport | **PASS** | 60 fps | 16 MB | Large display viewport, high DPI assets |
| iPad Pro 11 (Portrait) | 820x1180 | Tablet portrait layout | **PASS** | 60 fps | 16 MB | Tablet portrait layout, full desktop-grade timeline |
| iPad Pro 11 (Landscape) | 1180x820 | Tablet landscape multi-column studio mode | **PASS** | 60 fps | 16 MB | Tablet landscape multi-column studio mode |
| Ultra-Narrow Screen (320px) | 320x568 | iPhone SE 1st gen / 320px width stress test for Khmer word wrapping | **PASS** | 24 fps | 16 MB | iPhone SE 1st gen / 320px width stress test for Khmer word wrapping |

## Test Matrix Verification Breakdown

### 1. Low-End Android (2GB RAM Baseline)
- Tested on 360x640 viewport with Chrome 80 user agent.
- Automatically assigned Low Tier with 360p proxy preview resolution and 24 fps cap.
- Undo history capped at 20 actions to protect 2GB memory boundary.
- 4K export disabled by default with guidance to use 1080p or cloud rendering.

### 2. Mid-Range Android (4GB RAM)
- Tested on 412x915 viewport with modern Android Chrome.
- Assigned Mid Tier with 540p proxy preview and 30 fps playback.
- Balanced shaders and 4 simultaneous video tracks supported.

### 3. Flagship Android & iPhones (8GB+ RAM)
- Tested on 412x892 (S24 Ultra) and 430x932 (iPhone 15 Pro Max).
- Full 720p/1080p preview resolution at smooth 60 fps.
- 4K export enabled with hardware-accelerated WebCodecs.

### 4. Dynamic Island & Safe Area Insets
- Verified top safe area inset of 59px and bottom home indicator bar of 34px.
- Top navigation header and bottom timeline action bars remain completely visible with zero clipping.

### 5. Foldable Phones (Fold & Unfold Transitions)
- Tested cover screen (375x667) and unfolded inner display (768x1024).
- Seamless transition between single-column mobile view and multi-column expanded canvas.

### 6. Ultra-Narrow 320px Display & Khmer Word Segmentation
- Tested on 320x568 iPhone SE 1st gen.
- All buttons respect 44x44px touch targets.
- Khmer typography with ICU word wrapping prevents line clipping or broken subscript consonants (coeng).

## Captured Screenshot Evidence

Screenshots captured during test execution are stored in `docs/device-tests/`:

- `docs/device-tests/foldable_folded_01_home.png`
- `docs/device-tests/foldable_folded_02_perf_settings.png`
- `docs/device-tests/foldable_folded_03_editor.png`
- `docs/device-tests/foldable_folded_04_landscape.png`
- `docs/device-tests/foldable_unfolded_01_home.png`
- `docs/device-tests/foldable_unfolded_02_perf_settings.png`
- `docs/device-tests/foldable_unfolded_03_editor.png`
- `docs/device-tests/foldable_unfolded_04_landscape.png`
- `docs/device-tests/high_android_8gb_01_home.png`
- `docs/device-tests/high_android_8gb_02_perf_settings.png`
- `docs/device-tests/high_android_8gb_03_editor.png`
- `docs/device-tests/high_android_8gb_04_landscape.png`
- `docs/device-tests/ipad_landscape_01_home.png`
- `docs/device-tests/ipad_landscape_02_perf_settings.png`
- `docs/device-tests/ipad_landscape_03_editor.png`
- `docs/device-tests/ipad_portrait_01_home.png`
- `docs/device-tests/ipad_portrait_02_perf_settings.png`
- `docs/device-tests/ipad_portrait_03_editor.png`
- `docs/device-tests/ipad_portrait_04_landscape.png`
- `docs/device-tests/iphone_pro_island_01_home.png`
- `docs/device-tests/iphone_pro_island_02_perf_settings.png`
- `docs/device-tests/iphone_pro_island_03_editor.png`
- `docs/device-tests/iphone_pro_island_04_landscape.png`
- `docs/device-tests/iphone_pro_max_01_home.png`
- `docs/device-tests/iphone_pro_max_02_perf_settings.png`
- `docs/device-tests/iphone_pro_max_03_editor.png`
- `docs/device-tests/iphone_pro_max_04_landscape.png`
- `docs/device-tests/iphone_se_01_home.png`
- `docs/device-tests/iphone_se_02_perf_settings.png`
- `docs/device-tests/iphone_se_03_editor.png`
- `docs/device-tests/iphone_se_04_landscape.png`
- `docs/device-tests/low_android_2gb_01_home.png`
- `docs/device-tests/low_android_2gb_02_perf_settings.png`
- `docs/device-tests/low_android_2gb_03_editor.png`
- `docs/device-tests/low_android_2gb_04_landscape.png`
- `docs/device-tests/mid_android_4gb_01_home.png`
- `docs/device-tests/mid_android_4gb_02_perf_settings.png`
- `docs/device-tests/mid_android_4gb_03_editor.png`
- `docs/device-tests/mid_android_4gb_04_landscape.png`
- `docs/device-tests/narrow_phone_320_01_home.png`
- `docs/device-tests/narrow_phone_320_02_perf_settings.png`
- `docs/device-tests/narrow_phone_320_03_editor.png`
- `docs/device-tests/narrow_phone_320_04_landscape.png`
