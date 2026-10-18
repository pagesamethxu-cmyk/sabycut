# SABYCUT - CapCut Photo Editor Parity Matrix

This document tracks functional parity between CapCut photo editing capabilities and SABYCUT Photo Editor mode.
Research Date: 2026-10-18
Source Base: Public CapCut Web, Desktop, and Mobile documentation and feature pages (recorded in docs/PHOTO_RESEARCH_SOURCES.md).

---

## 1. Feature Parity Tracking Table

| ID | Feature | Source URL | Short Description | Group | SABYCUT Status | Shared with Video? | Implementation | Notes |
|---|---|---|---|---|---|---|---|---|
| P01 | Freeform Crop | https://www.capcut.com/tools/online-image-cropper | Rectangular box with drag handles to trim photo canvas bounds | Basic Edit | partial | Yes (V08 in CAPCUT_PARITY.md) | Client (Canvas) | Video crop exists; needs interactive photo crop box with corner handles |
| P02 | Aspect Ratio Presets | https://www.capcut.com/tools/online-image-cropper | Pre-set ratios: 1:1, 9:16, 16:9, 4:5, 3:4, 2:3, 21:9 | Basic Edit | exists in video editor | Yes (I06 in CAPCUT_PARITY.md) | Client (Canvas) | Reuses video aspect ratio bounding system |
| P03 | Rotate 90-degree & Angle | https://www.capcut.com/tools/online-image-cropper | 90-degree step clockwise rotation and continuous degree slider | Basic Edit | exists in video editor | Yes (V06 in CAPCUT_PARITY.md) | Client (Canvas/CSS) | Reuses rotation transform matrix |
| P04 | Flip Horizontal & Vertical | https://www.capcut.com/tools/online-image-cropper | Mirrored horizontal and vertical axis inversion | Basic Edit | exists in video editor | Yes (V07 in CAPCUT_PARITY.md) | Client (Canvas/CSS) | Reuses matrix flip logic |
| P05 | Straighten Horizon | https://www.capcut.com/tools/online-image-cropper | Angle tilt correction (-45 to +45 deg) with automatic edge zoom | Basic Edit | partial | No | Client (Canvas) | Needs auto-zoom compensation to prevent transparent corners |
| P06 | Pixel Dimension Resizer | https://www.capcut.com/tools/online-image-resizer | Exact width and height pixel input with aspect ratio lock | Basic Edit | missing | No | Client (Canvas) | Scales canvas and all contained layers to custom dimensions |
| P07 | Canvas Background Styling | https://www.capcut.com/tools/online-photo-editor | Solid color, gradient, blur background, or pattern fill | Basic Edit | partial | Yes (V11 in CAPCUT_PARITY.md) | Client (Canvas) | Video background styling can be applied directly to photo stage |
| P08 | Brightness Adjustment | https://www.capcut.com/resource/howto-guides | Luminance adjustment slider (-100 to +100) | Adjustments | exists in video editor | Yes (V11 in CAPCUT_PARITY.md) | Client (WebGL/Canvas) | Reuses shader filter pipeline |
| P09 | Contrast Adjustment | https://www.capcut.com/resource/howto-guides | Dynamic range contrast expansion and compression | Adjustments | exists in video editor | Yes (V11 in CAPCUT_PARITY.md) | Client (WebGL/Canvas) | Reuses shader filter pipeline |
| P10 | Saturation Adjustment | https://www.capcut.com/resource/howto-guides | Color intensity modulation from grayscale to hyper-saturated | Adjustments | exists in video editor | Yes (V11 in CAPCUT_PARITY.md) | Client (WebGL/Canvas) | Reuses shader filter pipeline |
| P11 | Exposure Adjustment | https://www.capcut.com/resource/howto-guides | F-stop exposure simulation slider | Adjustments | partial | Yes (V11 in CAPCUT_PARITY.md) | Client (WebGL/Canvas) | Needs slider in photo adjust panel |
| P12 | Highlights & Shadows | https://www.capcut.com/resource/howto-guides | Independent recovery of clipped whites and dark shadow details | Adjustments | partial | Yes (V11 in CAPCUT_PARITY.md) | Client (WebGL/Canvas) | Tone curve splitting in shader |
| P13 | Temperature & Tint | https://www.capcut.com/resource/howto-guides | Warm/cool Kelvin shift and green/magenta balance | Adjustments | partial | Yes (V11 in CAPCUT_PARITY.md) | Client (WebGL/Canvas) | Reuses color temperature matrix |
| P14 | Sharpness & Clarity | https://www.capcut.com/tools/ai-photo-editor | High-pass edge sharpening and midtone local contrast | Adjustments | partial | Yes (V11 in CAPCUT_PARITY.md) | Client (WebGL 2D Kernel) | Convolution kernel convolution shader |
| P15 | Vignette | https://www.capcut.com/resource/howto-guides | Dark or light peripheral lens falloff with radius and feather | Adjustments | partial | Yes (V11 in CAPCUT_PARITY.md) | Client (Canvas/Shader) | Radial gradient overlay calculation |
| P16 | Film Grain | https://www.capcut.com/resource/howto-guides | Procedural analog film noise simulation with grain size | Adjustments | missing | No | Client (Shader/Canvas) | Perlin noise or pseudo-random grain texture blend |
| P17 | HSL 8-Channel Color Mixer | https://www.capcut.com/resource/howto-guides | Hue, Saturation, Lightness per channel: Red, Orange, Yellow, Green, Cyan, Blue, Purple, Magenta | Adjustments | missing | Yes (shared color grading) | Client (WebGL/Canvas) | Color selector tab with 8 swatches and 3 sliders each |
| P18 | Curves Tool (Luma & RGB) | https://www.capcut.com/resource/howto-guides | Spline graph editor for White (Luma), Red, Green, and Blue | Adjustments | missing | Yes (shared color grading) | Client (Canvas Spline) | Interactive curve editor mapping 0-255 lookup table |
| P19 | Preset Color Filters | https://www.capcut.com/tools/online-photo-editor | Curated categories: Portrait, Retro, Scenery, Film, Food, B&W | Filters & Effects | exists in video editor | Yes (B10 in CAPCUT_PARITY.md) | Client (Canvas/Shader) | 16 original LUT presets from SABYCUT video engine |
| P20 | Filter Intensity Slider | https://www.capcut.com/tools/online-photo-editor | Blend opacity between filtered state and original image (0-100%) | Filters & Effects | exists in video editor | Yes (B10 in CAPCUT_PARITY.md) | Client (Canvas) | Alpha mix between original and filtered buffers |
| P21 | Light Leak & Prism Effects | https://www.capcut.com/tools/online-photo-editor | Optical artifact overlays: subtle leaks, chromatic aberration | Filters & Effects | missing | No | Client (Canvas Blend) | Screen/Add blend mode procedural overlays |
| P22 | Skin Smoothing | https://www.capcut.com/tools/capcut-apk-latest-version-android-download | Surface blur preserving high-contrast facial contours | Retouch & Beauty | missing | No | Client / Server | Bilateral filter on facial skin regions |
| P23 | Blemish Removal | https://www.capcut.com/tools/capcut-apk-latest-version-android-download | Tap-to-heal spot healing brush for acne and spots | Retouch & Beauty | missing | No | Client (Patch Match / Inpaint) | Circular sampling from adjacent healthy texture |
| P24 | Teeth Whitening | https://www.capcut.com/tools/online-photo-editor | Selective desaturation and brightening of dental hues | Retouch & Beauty | missing | No | Client (Targeted HSL/Brush) | Masked lightness boost and yellow desaturation |
| P25 | Face Reshape & Slimming | https://www.capcut.com/tools/capcut-apk-latest-version-android-download | Subtle jawline and facial proportion warping | Retouch & Beauty | missing | No | Client (Mesh Warp) | 2D forward-warp displacement grid |
| P26 | Eye Brighten & Dark Circle | https://www.capcut.com/tools/capcut-apk-latest-version-android-download | Iris contrast lift and under-eye shadow reduction | Retouch & Beauty | missing | No | Client (Dodge/Burn) | Selective luminance boost on eye bounding regions |
| P27 | Makeup Color Accents | https://www.capcut.com/tools/capcut-apk-latest-version-android-download | Natural lip tint, blush, and contour enhancements | Retouch & Beauty | missing | No | Client (Color Blending) | Soft-light blend overlays with opacity control |
| P28 | Body Silhouette Adjustment | https://www.capcut.com/tools/capcut-apk-latest-version-android-download | Gentle proportion scaling along vertical/horizontal axis | Retouch & Beauty | missing | No | Client (Mesh Warp) | Linear warp zone along defined bounding box |
| P29 | AI Background Remover | https://www.capcut.com/tools/image-background-remover | Automatic foreground extraction and alpha mask generation | AI Tools | exists in video editor | Yes (V20 in CAPCUT_PARITY.md) | Server (ai-service Python) | Leverages ai-service segmentation model |
| P30 | AI Background Replace | https://www.capcut.com/tools/image-background-remover | Composite extracted subject onto solid, studio, or scenic backgrounds | AI Tools | missing | No | Client / Server | Places transparent cutout over selected background layer |
| P31 | AI Object Removal (Magic Eraser) | https://www.capcut.com/create/ai-object-remover | Brush over unwanted items to inpaint background seamlessly | AI Tools | missing | No | Server (ai-service / Provider) | Inpainting endpoint using user API key or OpenCV inpaint |
| P32 | AI Image Upscaler & Enhancer | https://www.capcut.com/tools/ai-image-upscaler | Super-resolution upscaling (2x, 4x) with detail enhancement | AI Tools | missing | No | Server (ai-service) | Real-ESRGAN / bicubic high-frequency synthesis |
| P33 | AI Old Photo Restoration | https://www.capcut.com/tools/old-photo-restoration | Scratch repair, crack elimination, facial deblurring | AI Tools | missing | No | Server (ai-service / Provider) | Multi-pass scratch detection and generative repair |
| P34 | AI Photo Colorizer | https://www.capcut.com/tools/photo-colorizer | Realistic chrominance generation for black and white photos | AI Tools | missing | No | Server (ai-service / Provider) | DeOldify / Lab color space chrominance prediction |
| P35 | AI Sky Replacement | https://tools.capcut.com/tools/add-sky-background-to-photo | Semantic sky segment detection and scenic sky blending | AI Tools | missing | No | Client / Server | Color thresholding or segmentation mask with sky library |
| P36 | AI Text-to-Image Generator | https://www.capcut.com/tools/ai-image-generator | Generate original photo assets from user text prompt | AI Tools | missing | No | Server (ai-service / Provider) | Calls OpenAI DALL-E or Gemini Imagen via server vault |
| P37 | AI Image Extender (Outpainting) | https://dreamina.capcut.com/tools/ai-image-extender | Expand canvas boundaries and generate continuous surrounding scene | AI Tools | missing | No | Server (ai-service / Provider) | Outpainting prompt with boundary blending |
| P38 | AI Portrait & Headshot Generator | https://www.capcut.com/tools/portrait-generator | Professional headshot styling from casual portrait | AI Tools | missing | No | Server (ai-service / Provider) | Portrait enhancement model via server vault |
| P39 | AI Portrait Relighting | https://www.capcut.com/tools/ai-photo-editor | Virtual 3D key and fill light placement on portraits | AI Tools | missing | No | Client (Normal Map / Shader) | Screen blend light sphere with falloff simulation |
| P40 | AI Background Blur (Depth Simulation) | https://www.capcut.com/tools/blur-image-online | Bokeh effect with subject depth isolation | AI Tools | missing | No | Client (Mask + Gaussian Blur) | Separates subject mask and applies radius blur to background |
| P41 | Multi-layer Text System | https://www.capcut.com/tools/online-photo-editor | Add multiple independent text layers with drag positioning | Text & Typography | exists in video editor | Yes (B07 in CAPCUT_PARITY.md) | Client (Canvas / DOM) | Reuses rich text element engine |
| P42 | Font Selector with Khmer Typography | https://www.capcut.com/tools/online-photo-editor | Noto Sans Khmer, Battambang, Moul, Siemreap, plus Latin fonts | Text & Typography | exists in video editor | Yes (shared typography) | Client (Web Fonts) | Perfect rendering of stacked consonants and coeng |
| P43 | Text Styling (Color, Stroke, Shadow) | https://www.capcut.com/tools/online-photo-editor | Fill color, outline stroke width/color, drop shadow x/y/blur | Text & Typography | exists in video editor | Yes (B07 in CAPCUT_PARITY.md) | Client (Canvas Context2D) | Reuses typography styling properties |
| P44 | Curved / Arched Text | https://www.capcut.com/tools/online-photo-editor | Bend text along circular arc with radius slider (-180 to +180 deg) | Text & Typography | missing | No | Client (Canvas arc transform) | Glyph-by-glyph polar coordinate rotation on canvas |
| P45 | Text Presets & Graphic Styles | https://www.capcut.com/tools/online-photo-editor | One-click typography presets: Neon, Retro, Gold, Outline, Badge | Text & Typography | partial | Yes (B07 in CAPCUT_PARITY.md) | Client (CSS/Canvas) | Expands video text styles into photo graphics |
| P46 | Text Background Plate | https://www.capcut.com/tools/online-photo-editor | Rounded capsule, rectangle, or ribbon behind text with padding | Text & Typography | exists in video editor | Yes (B07 in CAPCUT_PARITY.md) | Client (Canvas) | Reuses text background styling |
| P47 | Sticker Overlay Library | https://www.capcut.com/tools/online-photo-editor | Scalable graphic stickers categorized by theme with rotation/scale | Stickers & Shapes | exists in video editor | Yes (B08 in CAPCUT_PARITY.md) | Client (SVG / Canvas) | Reuses sticker library without emoji |
| P48 | Geometric Shapes | https://www.capcut.com/tools/online-photo-editor | Rectangle, circle, rounded box, triangle, star, arrow with fill/stroke | Stickers & Shapes | partial | Yes (V14 in CAPCUT_PARITY.md) | Client (Vector Canvas) | Vector rendering with custom stroke and fill colors |
| P49 | Photo Frames & Decorative Borders | https://www.capcut.com/tools/online-photo-editor | Film border, polaroid frame, vintage vignette border, minimal edge | Stickers & Shapes | missing | No | Client (Canvas Compositing) | Frame overlay bounding canvas boundary |
| P50 | Freehand Drawing & Brush Tool | https://www.capcut.com/tools/online-photo-editor | Smooth stroke drawing with color, size, and opacity control | Stickers & Shapes | partial | No | Client (Canvas 2D Path) | Extends mask brush to colored paint layer |
| P51 | Watermark & Branding Tool | https://www.capcut.com/tools/online-photo-editor | Corner logo placement, opacity, and custom copyright text | Stickers & Shapes | missing | No | Client (Canvas Layer) | Top-right/bottom-right locked branding overlay |
| P52 | Photo Grid Layouts (2-9 Photos) | https://www.capcut.com/tools/photo-grid-online | Multi-cell layouts (side-by-side, quad, 3x3, hero split) | Collage & Layout | missing | No | Client (Canvas Partitioning) | Automatic coordinate calculation for multi-photo grids |
| P53 | Cell Margins & Corner Radius | https://www.capcut.com/tools/photo-grid-online | Spacing slider between cells and rounded border slider | Collage & Layout | missing | No | Client (Canvas Rounded Rect) | Dynamic gap and radius rendering on grid cells |
| P54 | Drag-and-Drop Cell Swap | https://www.capcut.com/tools/photo-grid-online | Interactive image reordering between collage cells | Collage & Layout | missing | No | Client (Touch Gesture) | Swaps source images between cell containers |
| P55 | Collage Background Styling | https://www.capcut.com/tools/photo-grid-online | Solid color, gradient, or pattern fill behind collage grid | Collage & Layout | missing | No | Client (Canvas Layer) | Root canvas styling under collage geometry |
| P56 | Batch Photo Processing | https://www.capcut.com/tools/online-image-resizer | Apply identical crop, filter, and watermark across multiple images | Collage & Layout | missing | No | Client (Loop Processing) | Sequential canvas render and multi-file zip download |
| P57 | Multi-layer Canvas Stack | https://www.capcut.com/tools/online-photo-editor | Layers list with visibility, locking, and depth reordering | Layers & Blending | partial | Yes (B01-B11 in CAPCUT_PARITY.md) | Client (State Model) | Adapts timeline tracks to visual layer stack |
| P58 | Layer Reorder (Bring to Front, Send Back) | https://www.capcut.com/tools/online-photo-editor | Z-index manipulation of photos, stickers, shapes, and text | Layers & Blending | missing | No | Client (Array Reordering) | Visual layer list with move up/down controls |
| P59 | Blend Modes (Multiply, Screen, Overlay) | https://www.capcut.com/tools/online-photo-editor | Standard compositing blend modes between overlapping layers | Layers & Blending | exists in video editor | Yes (V16 in CAPCUT_PARITY.md) | Client (Canvas globalCompositeOperation) | Normal, multiply, screen, overlay, darken, lighten |
| P60 | Layer Opacity Control | https://www.capcut.com/tools/online-photo-editor | 0% to 100% individual layer transparency | Layers & Blending | exists in video editor | Yes (V10 in CAPCUT_PARITY.md) | Client (Canvas alpha) | Reuses clip opacity property |
| P61 | Stencil & Shape Cutout Masks | https://www.capcut.com/tools/online-photo-editor | Mask layer with circle, heart, star, rectangle, or linear gradient | Layers & Blending | exists in video editor | Yes (V14 in CAPCUT_PARITY.md) | Client (Canvas destination-in) | Reuses video mask engine with feathering |
| P62 | Layer Outline & Outer Glow | https://www.capcut.com/tools/online-photo-editor | Colored contour border and glow effect around cutout subjects | Layers & Blending | missing | No | Client (Canvas Shadow/Dilation) | Multiple shadow offsets or distance dilation filter |
| P63 | JPG Export with Quality Slider | https://www.capcut.com/tools/online-photo-editor | Export JPEG with adjustable compression quality (10% to 100%) | Export & Share | partial | Yes (Export Engine) | Client (Canvas toDataURL / toBlob) | Quality parameter in image/jpeg blob creation |
| P64 | PNG Export with Transparency | https://www.capcut.com/tools/online-photo-editor | Lossless PNG with preserved alpha channel for cutouts and logos | Export & Share | missing | No | Client (Canvas toBlob) | Preserves transparent background if enabled |
| P65 | WebP Export | https://www.capcut.com/tools/online-photo-editor | Modern high-efficiency WebP format export with compression | Export & Share | missing | No | Client (Canvas toBlob) | Export with image/webp mime type |
| P66 | Resolution Multiplier (1x, 2x, 4K) | https://www.capcut.com/tools/online-photo-editor | Scale final canvas export (standard, high, ultra 4K) | Export & Share | missing | Yes (Export Engine) | Client (Offscreen Canvas) | High-DPI offscreen rendering at target dimensions |
| P67 | Direct Download & Native Share | https://www.capcut.com/tools/online-photo-editor | Save to camera roll via Capacitor Share/Filesystem or browser download | Export & Share | exists in video editor | Yes (E09 in CAPCUT_PARITY.md) | Client (Capacitor / Anchor) | Direct mobile file saving and Web Share API |
| P68 | Send Photo to Video Timeline | Internal SABYCUT Spec | Insert edited photo directly into video editor as an image clip | Video-Photo Bridge | missing | Yes (Two-way integration) | Client (Project State) | Converts photo canvas blob into timeline clip (4s default) |
| P69 | Extract Video Frame into Photo Editor | Internal SABYCUT Spec | Send current video playhead frame directly into photo editor | Video-Photo Bridge | missing | Yes (Two-way integration) | Client (Project State) | Grabs video preview canvas and opens Photo Editor mode |
| P70 | Dedicated Photo Editor Mode Entry | Internal SABYCUT Spec | Third prominent action button on Home screen alongside New Project and AI Auto Cut | UI Shell | missing | No | Client (React) | Balanced 3-card layout without text wrapping |
| P71 | Dedicated Photo Canvas with Transform Handles | Internal SABYCUT Spec | Zoomable, pan-able photo canvas with interactive 8-point bounding box | UI Shell | missing | No | Client (Canvas/Pointer Events) | Interactive drag, pinch, scale, and rotate handles |
| P72 | Contextual Bottom Toolbar for Photos | Internal SABYCUT Spec | Mobile toolbar docked above safe area (Crop, Adjust, Filter, AI, Text, Stickers, Retouch, Export) | UI Shell | missing | Yes (I07 in CAPCUT_PARITY.md) | Client (React / Touch) | Adapts tools according to selected layer type |
| P73 | Full Undo & Redo History for Photos | Internal SABYCUT Spec | Immutable state snapshots for every photo manipulation | UI Shell | partial | Yes (A07 in CAPCUT_PARITY.md) | Client (Command Stack) | Reuses snapshot history model for photo layers |
| P74 | Safe Area & 100dvh Compliance | Internal SABYCUT Spec | Touch targets >= 44x44px, safe area padding on iOS notch and home bar | UI Shell | exists in video editor | Yes (I10 in CAPCUT_PARITY.md) | Client (CSS env) | Adheres to SABYCUT design system and touch guidelines |

---

## 2. Summary of Parity Matrix

- **Total Features Analyzed:** 74
- **Exists in Video Editor (Shared & Ready to Reuse):** 16 (21.6%)
- **Partial (Foundations exist, requires photo adaptation):** 9 (12.2%)
- **Missing (New Photo Editor implementations required):** 49 (66.2%)
- **Total Features Shared Between Photo & Video:** 34 (45.9%)
- **Unique Photo-Specific Features:** 40 (54.1%)

---

## 3. Implementation Breakdown by Milestone

### Phase 1: Core Photo Mode UI & Basic Operations
- Home screen 3-action card layout (New Project, Photo Editor, AI Auto Cut) without text wrapping.
- Dedicated Photo Canvas with layer hierarchy, transform bounding box, and undo/redo history.
- Contextual bottom toolbar docked above safe area with 44x44px touch targets.
- Basic edit tools: interactive crop box with aspect ratios, rotate, flip, straighten, resizer.

### Phase 2: Color Adjustments, HSL, Curves & Filters
- Shader-accelerated adjustment engine: Brightness, Contrast, Saturation, Exposure, Highlights/Shadows, Temperature/Tint, Sharpness, Vignette, Film Grain.
- 8-Channel HSL color mixer with live visual feedback.
- Interactive spline Curve editor (Luma, Red, Green, Blue).
- 16 LUT filter presets with intensity slider.

### Phase 3: Text, Khmer Typography, Stickers, Shapes & Collagen
- Shared rich text layer engine with full Khmer font support (Noto Sans Khmer, Battambang, Moul, Siemreap).
- Curved/arched text generator along circular arc.
- Geometric shapes, borders/frames, freehand drawing brush, watermark branding.
- Multi-photo grid layouts (2 to 9 photos) with cell spacing and corner radius.

### Phase 4: AI Photo Enhancement & Retouch Suite
- Retouch tools: Skin smoothing, blemish healing, teeth whitening, facial reshape, eye brighten.
- AI server tools via ai-service: Background removal, object removal (inpainting), 4K upscaler, old photo restoration, photo colorizer, AI expand (outpaint), AI image generator.
- Privacy & security: Provider keys remain strictly in server vault, decrypted only in-memory, never exposed to client.

### Phase 5: Export Pipeline & Two-Way Video Integration
- Multi-format export: JPG (quality slider), PNG (with transparent background), WebP.
- Resolution multipliers: 1x, 2x, 4K offscreen canvas rendering.
- Two-way bridge: Send photo to video timeline as image clip, send video freeze frame to photo editor.
