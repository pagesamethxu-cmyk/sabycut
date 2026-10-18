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
