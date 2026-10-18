# SABYCUT

SABYCUT is a high-performance video editor similar to CapCut, featuring full Khmer language localization and an AI Auto Cut engine with user-supplied OpenAI or Gemini API keys. Built as a PWA and packaged for Android and iOS via Capacitor from a single codebase.

## Hard Rules Compliance
- No emojis anywhere: UI, code, comments, commit messages, documentation, logs, or AI prompts.
- All AI prompts sent to ChatGPT or Gemini include the strict instruction: "Do not use emoji."
- Default UI language is Khmer (km), with secondary English (en) support via i18n JSON files.
- Two-tier backend architecture: Spring Boot (Java 21) core and Flask (Python 3.11) AI service.

---

## Architecture Overview

```text
frontend/          React 18 + TypeScript + Vite + Capacitor (PWA)
backend-core/      Spring Boot 3.3 (Java 21) REST API, JWT auth, AES-256-GCM vault, WebSockets
ai-service/        Flask (Python 3.11) video analysis, transcription, and FFmpeg rendering
docker-compose.yml Full orchestration: PostgreSQL 16, Redis 7, MinIO (S3), backend-core, ai-service
```

---

## Phase 1 Deliverables (Completed)
- Repository structure established with backend-core, ai-service, frontend, and docker-compose.
- Spring Boot 3.3 (Java 21) backend core with JWT authentication, Flyway migrations, and JPA entities.
- AES-256-GCM encrypted API key vault service (`EncryptedVaultService`) verified with automated unit tests.
- Flask AI service scaffolded with internal Bearer token protection and health checks.
- React frontend configured with Noto Sans Khmer typography and full i18n support (`km.json` and `en.json`).
- Capacitor configuration for Android and iOS mobile app generation.

---

## Running the Services

### 1. Full Stack with Docker
```bash
docker-compose up -d
```

### 2. Running backend-core locally (Java 21)
```bash
cd backend-core
mvn spring-boot:run
```
API runs on `http://localhost:8080`.

### 3. Running ai-service locally (Python 3.11)
```bash
cd ai-service
pip install -r requirements.txt
python app/main.py
```
Internal service runs on `http://localhost:5000`.

### 4. Running frontend locally (Vite)
```bash
cd frontend
npm install
npm run dev
```
Web client runs on `http://localhost:3000`.

---

## Mobile layout and safe areas

### 1. Architectural Principles
- **Viewport Meta Configuration**: `<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, interactive-widget=resizes-content">`.
- **CSS Safe Inset Variables**: Root CSS variables `--sat`, `--sab`, `--sal`, and `--sar` map to `env(safe-area-inset-*)` with fallback to `0px`.
- **Dynamic Viewport Height**: Replaced fixed `100vh` with `var(--app-height, 100dvh)` synchronized dynamically with `window.visualViewport` on resize and orientationchange events.
- **Overscroll & Root Pinning**: App shell root pinned with `position: fixed; inset: 0; overflow: hidden` to eliminate unwanted rubber-banding bounce while allowing inner panels to scroll.
- **Mobile Touch Targets**: All interactive buttons enforce a minimum touch target bounding box of 44x44 px and keep essential controls out of the 16 px display perimeter.
- **Capacitor Android 15+ Edge-to-Edge**: Configured transparent system bars with `WindowCompat.setDecorFitsSystemWindows(false)`, `layoutInDisplayCutoutMode = shortEdges`, and `android:windowSoftInputMode = adjustResize`.
- **Capacitor iOS Configuration**: Configured `contentInset: "always"`, StatusBar overlay, and home indicator bottom clearance.

### 2. Testing the Mobile Safe Areas
Run the automated Playwright test suite validating 12 distinct mobile device viewports (portrait and landscape, punch-hole cameras, notches, Dynamic Island, tablets, and foldables):

```bash
cd frontend
npx playwright test tests/safe-areas.spec.ts
```

Run the full end-to-end acceptance suite covering Home Screen redesign, Settings 9-section vault, AI key guard, and safe area assertions:

```bash
cd frontend
npx playwright test
```

### 3. Visual Debug Overlay
To visualize physical safe area boundaries directly on any device:
1. Tap the Settings icon in the top header.
2. Select the Debug tab in the sidebar.
3. Toggle "Safe Area Boundaries Overlay" ON.
4. Red, green, and blue boundary lines with live inset diagnostics will overlay the screen.
