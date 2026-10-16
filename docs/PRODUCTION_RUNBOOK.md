# Kalalo AI — Production Operations & Diagnostic Runbook

This runbook documents how to monitor, diagnose, and troubleshoot production issues for the **Kalalo AI** video-captioning studio deployed on Vercel and backed by Supabase and Google Gemini.

---

## 1. System Architecture Overview

- **Frontend & API Routes:** Next.js 14 App Router deployed globally on Vercel Edge/Serverless.
- **Database & Storage:** Supabase PostgreSQL (`khxvrjnbikwgggykhbpk`) with Row Level Security (RLS) on all tables and private media storage (`kalalo-media` bucket).
- **AI Transcription Engine:** Google Gemini (`gemini-1.5-flash`, `gemini-2.0-flash`, `gemini-2.0-flash-lite`, `gemini-1.5-pro`) multilingual speech-to-text with Devanagari script preservation.
- **Media Processing:** Bundled static FFmpeg / FFprobe binaries for metadata extraction and audio processing.

---

## 2. Fast Diagnostic Triage (First 5 Minutes)

When an alert or user failure is reported, run these commands from the repository root:

### Step 1: Query the Live Production Health Endpoint
```bash
curl -s https://kalalo-ai.vercel.app/api/diagnostics | jq .
```
Verify:
- `system.status`: `"HEALTHY"`
- `services.supabase.connected`: `true`
- `services.supabase.storageBucket.exists`: `true`
- `services.gemini.ready`: `true`
- `services.ffmpeg.healthy`: `true`

### Step 2: Run the Live Supabase RLS & Storage Audit
```bash
npm run verify:supabase
```
Verifies table readability, RLS rejection for anonymous callers, disposable user creation, and storage signed URL generation.

### Step 3: Run the Production E2E Backend Verification Suite
```bash
node scripts/verify-production-backend.mjs
```
Executes a 9-step synthetic transaction directly against `https://kalalo-ai.vercel.app`:
1. Registration & JWT generation
2. Session restoration via `/api/auth/me`
3. Profile update & database persistence
4. Remote project creation
5. Caption edit & save read-back
6. SRT & WebVTT subtitle export formatting
7. Cross-tenant isolation rejection (User B blocked from User A)
8. Private media streaming rejection (401 unauthenticated, 404/403 cross-tenant)
9. Automated test teardown

---

## 3. Diagnosing Specific Common Failure Modes

### Failure A: Video Upload Stuck or Failing
- **Symptoms:** User sees error badge during upload or transfer stalls.
- **Diagnostic Steps:**
  1. Check upload size. Server-side upload limit is 250MB (`app/api/upload/route.ts`).
  2. Verify network transfer: upload uses `XMLHttpRequest.upload.onprogress` for real byte tracking.
  3. Verify Supabase Storage bucket: check if `kalalo-media` bucket is active in Supabase Dashboard.
  4. Test upload with sample media:
     ```bash
     node scripts/verify-production-backend.mjs
     ```

### Failure B: Gemini Transcription Failure or Timeout
- **Symptoms:** Project status transitions to `"failed"` with error message.
- **Diagnostic Steps:**
  1. Inspect the project record in Supabase:
     ```bash
     curl -s -H "Authorization: Bearer <TOKEN>" https://kalalo-ai.vercel.app/api/projects/<PROJECT_ID>
     ```
  2. Verify that `GEMINI_API_KEY` is active and has available quota in Google AI Studio.
  3. Check the configured model name: valid models are `gemini-1.5-flash`, `gemini-2.0-flash`, `gemini-2.0-flash-lite`, `gemini-1.5-pro`.
  4. Ensure audio track is present: silent videos or corrupt audio return actionable error without generating hallucinated captions.

### Failure C: Video Playback or Seeking Errors (HTTP 401 / 403 / 404)
- **Symptoms:** Video player displays "Failed to load video" or cannot seek.
- **Diagnostic Steps:**
  1. **HTTP 401:** Client is missing the session cookie or Authorization header. Direct navigation without login is prohibited.
  2. **HTTP 403:** The user does not own the project. Multi-tenant RLS prevents accessing another user's private media.
  3. **Signed URL Expiration:** Signed URLs have a 3600-second (1 hour) TTL. Opening a project refreshed via `GET /api/projects/[id]` re-signs the URL automatically.
  4. **Byte Range Requests:** Video seeking requires HTTP 206 Partial Content support, which is handled natively by `app/api/media/stream/route.ts`.

### Failure D: Stale or Stuck Background Jobs
- **Symptoms:** Job appears to remain in `"running"` or `"queued"` state.
- **Remediation:**
  1. `JobsService` includes an automated timeout sweeper: any job running or queued for >15 minutes is automatically marked as `failed` with code `PROCESS_TIMEOUT`.
  2. To cancel a running job:
     ```bash
     curl -X POST https://kalalo-ai.vercel.app/api/jobs/<JOB_ID>
     ```

---

## 4. Telemetry & Log Analysis

Server logs output structured JSON formatted by `src/utils/logger.ts`:
- **Sensitive data** (passwords, JWT tokens, API keys, signed URL tokens) is automatically redacted (`[REDACTED]`).
- **Correlation IDs:** Include `correlationId` in request headers or API payloads to trace a job from upload through Gemini transcription and export.
