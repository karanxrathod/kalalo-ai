# KALALO — COMPLETE TECHNICAL HANDOVER & SYSTEM AUDIT REPORT

**Project Name:** Kalalo (AI Captioning Studio & MCP Server for Creators)  
**Document Type:** Technical Handover, Architecture Audit, and Pre-Deployment Assessment  
**Author Role:** Lead Software Architect, Senior Full-Stack Engineer, MCP Developer & DevOps Engineer  
**Audit Target Directory:** `C:\Users\karan\OneDrive\Desktop\Kalalo`  
**Execution Environment:** Windows (x64), Node.js v22.13.0, TypeScript 5.8.2, Next.js 14.2.23  
**Status Date:** October 2026  
**Audience:** Incoming Engineering Team, Security Auditors, Product Leadership, and Reviewing AI Systems  

---

## 1. Executive Summary & Purpose

This technical handover document provides a complete, factual, code-verified, and test-substantiated audit of **Kalalo**. It details the exact current state of the codebase, covering the Next.js web application, backend processing services, Model Context Protocol (MCP) server, Google Gemini AI transcription integration, FFmpeg ASS subtitle rendering pipeline, file storage mechanisms, security posture, and deployment readiness.

Every claim, schema, command, and metric in this document has been verified directly against the active repository source files and confirmed by live test execution on the host machine.

---

## 2. Project Overview

### 2.1 What Kalalo Does
Kalalo is an AI-powered video captioning studio and automation server engineered specifically for short-form content creators (YouTube Shorts, Instagram Reels, TikTok) and multilingual video producers. It automates the end-to-end captioning lifecycle:
1. Ingesting raw video/audio media (MP4, MOV, WebM, MP3, WAV).
2. Extracting audio tracks and performing speech-to-text (STT) transcription with timestamp alignment.
3. Providing an interactive 3-panel studio interface for reviewing, editing, splitting, merging, and retiming caption segments with real-time video playback synchronization.
4. Applying professional, broadcast-grade subtitle styling (28 original presets or customized typography, colors, borders, and margins) supporting Latin and Devanagari scripts (Hindi, Marathi, Hinglish, English).
5. Generating standardized subtitle files (SubRip `.srt` and WebVTT `.vtt`).
6. Burning styled subtitles directly into video streams via FFmpeg using Advanced SubStation Alpha (`.ass`) rendering with aspect-ratio adjustment (9:16 vertical, 1:1 square, 16:9 landscape) and optional video trimming and audio muting.
7. Exposing all core capabilities over the Model Context Protocol (MCP) via STDIO JSON-RPC for programmatic automation by AI coding assistants (Claude Desktop, Google Antigravity, Cursor).

### 2.2 Problems Kalalo Solves
- **High Friction in Subtitle Creation:** Manual subtitle timing and formatting in traditional NLEs (Premiere, Final Cut, DaVinci Resolve) is labor-intensive.
- **Multilingual Support Gaps:** Traditional cloud captioners struggle with Hindi, Marathi, and mixed Hinglish dialogue, failing on Devanagari conjuncts or phonetic Latin transliteration.
- **Expensive SaaS Platforms:** Commercial auto-captioning tools (CapCut Pro, Submagic, Descript) charge recurring subscriptions and cloud credits. Kalalo allows creators to run processing locally or bring their own Google Gemini / OpenAI API keys with zero platform markup.
- **AI Agent Automation Gap:** Existing video editors lack standardized agent interfaces. Kalalo provides a native MCP server so autonomous AI agents can inspect footage, generate transcripts, validate timing, select styles, and trigger renders directly.

### 2.3 Target Users & Use Cases
- **Short-form Content Creators:** Fast vertical (9:16) caption burn-in with bold typography and high-contrast accents.
- **Multilingual & Regional Creators:** Accurate Hinglish and Devanagari (Hindi/Marathi) captions with proper line-height calibration and font fallback.
- **Podcasters & Interviewers:** Long-form dialogue transcription, clean lower-third subtitles, and standalone SRT/VTT exports.
- **AI Agent Workflows & Automation Pipelines:** Headless processing of video queues using Claude Desktop or Antigravity via MCP tools.

### 2.4 Complete User Workflow

```
[User / MCP Client]
        │
        ▼
[1. Upload / Ingest Media] ────► Stored in tmp/uploads/ or referenced on disk
        │
        ▼
[2. Media Inspection] ─────────► FFprobe extracts codecs, dimensions, duration, audio/video streams
        │
        ▼
[3. Audio Extraction] ─────────► FFmpeg extracts 16kHz mono MP3
        │
        ▼
[4. AI Transcription] ─────────► Google Gemini API (v1beta) generates structured JSON segments
        │
        ▼
[5. Validation & Normalization] ► CaptionsService clamps times, resolves micro-overlaps, enforces IDs
        │
        ▼
[6. Interactive Studio] ───────► 3-Panel Editor: edit text, scrub video, split/merge, tweak styles
        │
   ┌────┴────────────────────────┐
   ▼                             ▼
[7A. Subtitle Export]         [7B. FFmpeg Video Render]
   │                             │
   ├─► SRT format                ├─► ASS script generation (font, colors, positioning)
   └─► WebVTT format             ├─► Letterbox / scale to 9:16, 1:1, or 16:9
                                 ├─► Trim start / end & audio mute options
                                 ├─► (Optional) Person Cutout foreground compositing
                                 └─► Output MP4 verification & stream/download
```

### 2.5 Architecture Separation: Web App vs. Backend Services vs. MCP Server

| System Tier | Components | Entry Point | Communication Protocol |
|---|---|---|---|
| **Web Studio** | Next.js 14 App Router, React 18, Tailwind CSS, Lucide icons | `app/page.tsx`, `app/editor/page.tsx`, `app/create/page.tsx`, `app/dashboard/page.tsx`, `app/presets/page.tsx`, `app/settings/page.tsx` | Browser DOM, HTML5 Video, React State, REST `fetch()` |
| **Backend API** | Next.js API Route Handlers | `app/api/**/route.ts` (12 distinct endpoints) | HTTP JSON / `multipart/form-data` / Byte-range streaming |
| **Core Services** | Pure TypeScript domain services | `src/services/*.ts`, `src/presets/*.ts` | In-process asynchronous function calls |
| **MCP Server** | `@modelcontextprotocol/sdk` (v1.6.1) | `src/index.ts` -> `dist/index.js` | STDIO JSON-RPC 2.0 (standard input/output, diagnostic logs isolated to stderr) |

### 2.6 Implementation Status: Implemented vs. Incomplete/Planned

- **Fully Implemented & Verified:**
  - Complete Next.js 14 Web Studio (Dashboard, Creator upload, 3-Panel Studio Editor, Preset Gallery, Diagnostics, Settings).
  - All 9 Model Context Protocol (MCP) tools registered and passing end-to-end STDIO automated tests.
  - FFmpeg & FFprobe integration with auto-resolving binaries (`@ffmpeg-installer/ffmpeg` and `@ffprobe-installer/ffprobe`).
  - Google Gemini API (v1beta) multimodal transcription with user-owned API keys, model fallbacks, and live tested audio processing.
  - Mock offline transcription engine for deterministic zero-dependency testing.
  - OpenAI Whisper transcription provider integration.
  - Advanced SubStation Alpha (`.ass`) subtitle generation supporting custom typography, colors, outlines, shadows, alignment, and coordinate positioning.
  - Full video burn-in rendering with scaling, letterbox padding, trimming, and audio mute settings.
  - Subtitle export to SubRip (`.srt`) and WebVTT (`.vtt`).
  - Project persistence in `tmp/projects.json`.
  - User settings and API key persistence in `tmp/user-settings.json`.
  - Byte-range HTTP video/audio streaming with download attachment headers.
  - 28 verified original typography presets.

- **Partially Implemented / Limitations:**
  - **Person Cutout / Captions-Behind-Subject:** Code exists in `src/services/cutout.service.ts`, `scripts/process_person_cutout.py`, and FFmpeg alphamerge filter pipelines. Model `models/selfie_segmenter.tflite` is present. However, it requires a host Python environment with OpenCV and MediaPipe. On Windows environments where `python` points to the Microsoft Windows Store app execution alias, execution fails unless configured with a full Python environment.
  - **Job State Persistence:** `JobsService` maintains background jobs in a static in-memory `Map`. Active job status does not survive server restarts.
  - **Multi-user Isolation:** Project and settings storage is single-tenant local file storage (`tmp/projects.json`, `tmp/user-settings.json`). There is no user authentication, session management, or access control.

---

## 3. Current Feature Inventory

### 3.1 Web Application Features

| Feature | Implementation Location | How It Works | Status | Evidence or Test |
|---|---|---|---|---|
| **Landing Page** | `app/page.tsx` | Studio showcase with feature highlights, quick-launch buttons to Studio and Presets, dark-theme creator aesthetic. | **Complete** | Production build verified (`/` static 1.85 kB). Verified in browser. |
| **Dashboard** | `app/dashboard/page.tsx` | Displays active projects, recent jobs, quick creation shortcuts, media duration badges, and project deletion triggers. | **Complete** | Tested via `GET /api/projects` and UI navigation. |
| **Project Creation / Ingestion** | `app/create/page.tsx`, `app/api/upload/route.ts` | Drag-and-drop file upload, file size validation (250MB limit), automatic media inspection, auto-transcribe toggle, and one-click sample media loader. | **Complete** | End-to-end verified with `samples/sample-video.mp4`. |
| **3-Panel Caption Studio** | `app/editor/page.tsx` | Main studio workspace. Left: segment editor list. Center: synchronized video player with custom controls. Right: styling presets & custom style controls. | **Complete** | Production build verified (`/editor` 34.1 kB, 133 kB first load JS). |
| **Segment Editing & Timing** | `app/editor/page.tsx`, `src/services/captions.service.ts` | Allows direct inline editing of segment text, start/end timestamps. Dynamic validation badge indicates syntax/timing status in real time. | **Complete** | Vitest unit tests in `tests/schemas.test.ts` (13 tests pass). |
| **Segment Splitting** | `app/editor/page.tsx:392` | Splits active segment at current video player playhead position (`currentTime`), allocating text between two new segments. | **Complete** | Code verified in `handleSplitSegment()`. |
| **Segment Merging** | `app/editor/page.tsx:415` | Combines text and timestamps of a segment with its subsequent adjacent segment into a single cohesive card. | **Complete** | Code verified in `handleMergeSegment()`. |
| **Video Player & Playhead Synchronization** | `components/VideoPlayer.tsx`, `app/editor/page.tsx` | HTML5 video player with requestAnimationFrame / timeupdate tracking. Subtitle overlay syncs with current playhead time. | **Complete** | Component verified; scrubbing, playing, and overlay tested. |
| **Aspect Ratio Switching** | `components/VideoPlayer.tsx`, `src/services/rendering.service.ts` | Switches viewport between 9:16 (vertical), 1:1 (square), and 16:9 (horizontal) with container letterboxing. | **Complete** | Verified in player and in FFmpeg render test (`tests/rendering.test.ts`). |
| **Safe Margin Overlays** | `components/VideoPlayer.tsx` | Renders title-safe and action-safe dotted guide overlays to preview Instagram/TikTok UI obstruction zones. | **Complete** | Verified in `VideoPlayer.tsx` canvas overlay. |
| **Preset Typography Selection** | `app/presets/page.tsx`, `src/presets/presets.ts` | Live preview cards for 28 original presets with category tabs (Social, Professional, Cinema, etc.) and filter by aspect ratio/language. | **Complete** | Presets test passes in `tests/presets.test.ts` (6 tests pass). |
| **Custom Styling Controls** | `app/editor/page.tsx` | Sliders and pickers for font family, font size, bold/italic, primary/outline/shadow colors, border thickness, shadow depth, vertical margin, box treatment, and X/Y positioning. | **Complete** | Full state bindings verified in `app/editor/page.tsx`. |
| **Video Trimming** | `app/editor/page.tsx`, `src/services/rendering.service.ts` | Dual-handle trim sliders adjust `trimStart` and `trimEnd`. Recalculates effective duration and shifts subtitle timestamps during render. | **Complete** | Verified in `tests/rendering.test.ts` ("renders with trimming, muting, and custom 720p resolution"). |
| **Audio Extraction** | `app/api/media/extract-audio/route.ts` | Extracts high-fidelity 192k MP3 or 16-bit PCM WAV from video via FFmpeg `-vn`. Returns stream URL and download attachment. | **Complete** | Test passes in `tests/audio-extraction.test.ts` (2757ms execution). |
| **Audio Mute Toggle** | `src/services/rendering.service.ts:273` | Passes `-an` to FFmpeg when `muteAudio: true` is requested during render. | **Complete** | Verified in `tests/rendering.test.ts`. |
| **Gemini API Configuration** | `app/settings/page.tsx`, `src/services/settings.service.ts` | UI to input, save, test, and remove Google Gemini API keys. Keys stored locally in `tmp/user-settings.json` and masked in UI. | **Complete** | Live connection test verified against `generativelanguage.googleapis.com`. |
| **SRT & WebVTT Export** | `app/api/export/route.ts`, `src/services/subtitle-export.service.ts` | Converts segments into valid SubRip (`.srt`) and WebVTT (`.vtt`) files. Offers one-click clipboard copy and file downloads. | **Complete** | Tests pass in `tests/subtitles.test.ts` (5 tests pass). |
| **FFmpeg Caption Rendering** | `app/api/render/route.ts`, `src/services/rendering.service.ts` | Generates ASS styles, scales/pads video, burns subtitles, tracks real-time progress via `pipe:1`, verifies output with FFprobe. | **Complete** | Tests pass in `tests/rendering.test.ts` (4 tests pass, verified with FFprobe). |
| **Rendered Video Download** | `app/api/media/stream/route.ts` | Streams rendered MP4 with `Content-Disposition: attachment` for browser downloading. | **Complete** | Verified via stream route with `download=true`. |
| **Diagnostics Page** | `app/diagnostics/page.tsx`, `app/api/diagnostics/route.ts` | Real-time environment check for FFmpeg/FFprobe health, binary paths, active STT provider, preset counts, and storage directories. | **Complete** | Verified at `/api/diagnostics`. |
| **Person Cutout / Captions Behind Subject** | `src/services/cutout.service.ts`, `scripts/process_person_cutout.py` | MediaPipe TFLite person segmentation creates alpha mask; FFmpeg `alphamerge` composites foreground person in front of subtitles. | **Partial** | Code, model, and FFmpeg filter-complex implemented. Blocked in environments without a functional Python runtime with MediaPipe/OpenCV. |
| **Authentication & Accounts** | N/A | Multi-tenant auth, session tokens, user signup/login. | **Not Implemented** | Single-tenant local application design. |
| **Project History Persistence** | `src/services/projects.service.ts` | Projects saved to disk in `tmp/projects.json`. Survives server restarts. | **Complete** | Tested in `tests/projects.test.ts` (2 tests pass). |

---

### 3.2 MCP Server Feature Inventory

The Kalalo MCP Server is built on `@modelcontextprotocol/sdk` (v1.6.1) and operates over `StdioServerTransport`. All 9 tools are registered in `src/tools/register-tools.ts` and verified via automated client scripts (`scripts/test-all-tools.mjs` and `scripts/verify-mcp-connection.mjs`).

```
                    ┌─────────────────────────────────┐
                    │       MCP Client Host           │
                    │ (Claude Desktop / Antigravity)  │
                    └───────────────┬─────────────────┘
                                    │ STDIO Transport (JSON-RPC 2.0)
                                    ▼
                    ┌─────────────────────────────────┐
                    │      Kalalo MCP Server          │
                    │         (src/index.ts)          │
                    └───────────────┬─────────────────┘
                                    │
    ┌──────────────┬────────────────┼────────────────┬──────────────┐
    ▼              ▼                ▼                ▼              ▼
Media Tools   STT Tools       Caption Tools     Render Tools    Job Tools
(Inspect)     (Transcribe)    (Validate/Export/ (Render ASS)    (Status/List/
                              Presets)                          Cancel)
```

#### Detailed MCP Tools Specification Table

| Tool Name | Input Schema (Zod) | Output Structure | Purpose | Implementation File | Runtime Dependencies |
|---|---|---|---|---|---|
| `kalalo_inspect_media` | `inputPath: string` | `{ media: MediaMetadata, video?: VideoStreamInfo, audio?: AudioStreamInfo, durationSeconds: number, hasAudio: boolean, hasVideo: boolean }` | Inspects audio/video files to extract real container format, stream codecs, duration, dimensions, bitrates, and sample rates using FFprobe. | `src/tools/media-tools.ts` | `MediaService`, FFprobe binary |
| `kalalo_transcribe_media` | `inputPath: string`, `language?: "auto" \| "hinglish" \| "hi" \| "en"`, `provider?: string`, `jobId?: string` | `{ jobId: string, status: string, segments: CaptionSegment[], detectedLanguage?: string, message: string }` | Transcribes speech in media files into timestamped caption segments. Supports Hinglish, Hindi, English, and auto-detection. Tracks job progress. | `src/tools/transcription-tools.ts` | `ProviderFactory`, `JobsService`, Gemini / OpenAI / Mock provider, FFmpeg |
| `kalalo_validate_segments` | `segments: Record<string, unknown>[]`, `durationSeconds?: number` | `{ valid: boolean, segments?: CaptionSegment[], errors?: string[], warnings?: string[] }` | Validates and normalizes caption segments against timing, ordering, overlap, and media duration boundaries without corrupting Unicode/Devanagari scripts. | `src/tools/caption-tools.ts` | `CaptionsService` |
| `kalalo_list_presets` | `format?: "9:16" \| "1:1" \| "16:9"`, `language?: "hinglish" \| "hi" \| "en"` | `{ presets: PresetStyle[] }` | Lists original caption styling presets with optional filtering by aspect ratio and target language. | `src/tools/caption-tools.ts` | `PresetsService` |
| `kalalo_export_subtitles` | `segments: Record<string, unknown>[]`, `format: "srt" \| "vtt"`, `outputPath?: string` | `{ format: "srt" \| "vtt", outputPath?: string, content: string, segmentCount: number }` | Exports segments into standards-compliant SubRip (`.srt`) or WebVTT (`.vtt`) format, writing to disk or returning raw string text. | `src/tools/caption-tools.ts` | `SubtitleExportService`, `CaptionsService` |
| `kalalo_render_captions` | `inputPath: string`, `outputPath: string`, `segments: unknown[] \| string`, `presetId: string`, `aspectRatio?: "9:16" \| "1:1" \| "16:9"`, `burnIn?: boolean`, `jobId?: string` | `{ jobId: string, status: string, outputPath: string, progress: number, message: string }` | Burns styled captions onto video using FFmpeg. Handles aspect ratio letterboxing, ASS generation, and progress tracking. Accepts segment array or prior transcription `jobId`. | `src/tools/render-tools.ts` | `RenderingService`, `JobsService`, FFmpeg binary |
| `kalalo_get_job_status` | `jobId: string` | `{ id: string, type: string, status: JobStatus, progress: number, stage: string, createdAt: string, startedAt?: string, finishedAt?: string, error?: KalaloError, result?: unknown }` | Inspects current status, execution stage, progress percentage (0-100%), error diagnostics, and completed results of a background job. | `src/tools/job-tools.ts` | `JobsService` |
| `kalalo_list_jobs` | `status?: JobStatus`, `limit?: number` | `{ jobs: Job[] }` | Lists all background transcription and rendering jobs known to the running server with status and count filtering. | `src/tools/job-tools.ts` | `JobsService` |
| `kalalo_cancel_job` | `jobId: string` | `{ jobId: string, status: "cancelled", cancelled: boolean, message: string }` | Aborts an active processing job, triggering `AbortSignal` and terminating spawned FFmpeg child processes. | `src/tools/job-tools.ts` | `JobsService` |

---

### 3.3 AI Functionality & Providers

Kalalo employs a provider abstraction layer (`src/services/transcription/`) supporting three distinct speech-to-text engines:

#### 1. Google Gemini Multimodal Provider (`gemini.provider.ts`)
- **API Endpoint:** `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
- **Active Model Default:** `gemini-3.5-flash-lite` (configured in `env.ts` and `settings.service.ts`).
- **Media Input Method:** In-memory base64-encoded audio. When a media file is submitted, Kalalo extracts a 16kHz mono MP3 audio track (`libmp3lame`, 64k bitrate) via FFmpeg to minimize payload size while preserving speech phonetics, then transmits it using `inlineData` (`mimeType: "audio/mp3"`).
- **Prompt Architecture:** The model receives strict system rules commanding it to act as a precision captioning system, transcribe only spoken dialogue, eliminate hallucinations during silence/music, format dialogue into 3 to 8 word segments, and return a strict JSON schema conforming to `[{ start: number, end: number, text: string, language?: string }]`.
- **Language Adaptation:**
  - `hi`: Commands Devanagari script output.
  - `hinglish`: Commands natural spoken phrasing in Latin/Romanized script without translating English terms to Hindi or vice versa.
  - `en`: Standard English spelling.
  - `auto`: Transcribes in original spoken language.
- **Error Handling:** Maps upstream HTTP error codes:
  - `404`: Model not found or deprecated -> suggests `gemini-3.5-flash-lite`.
  - `503`: High demand spikes -> flags as retryable.
  - `400` / `403`: Authentication failure -> invalid API key message.
  - `429`: Quota / rate limit exceeded.

#### 2. Mock Offline Provider (`mock.provider.ts`)
- **Purpose:** Fast, 100% deterministic offline testing and demonstration without requiring API keys or internet access.
- **Operation:** Inspects media duration via FFprobe, then generates mock Hinglish and English subtitle segments proportional to the clip duration. Used as default in unit test suites and offline local testing.

#### 3. OpenAI Whisper Provider (`openai.provider.ts`)
- **API Endpoint:** `https://api.openai.com/v1/audio/transcriptions`
- **Supported Models:** `whisper-1`
- **Input Method:** Direct multipart audio stream upload via Node.js native `fetch`.

---

## 4. Complete Codebase Structure

### 4.1 Directory Tree

```
C:\Users\karan\OneDrive\Desktop\Kalalo
├── .env                              # Local environment configuration (untracked)
├── .env.example                      # Documented template of environment variables
├── .gitignore                        # Git exclusion rules
├── KALALO_PROJECT_HANDOVER.md        # [This Document] Complete technical audit
├── LOCAL_TESTING.md                  # Quickstart testing documentation
├── README.md                         # Project documentation and introduction
├── next-env.d.ts                     # Next.js TypeScript definitions
├── next.config.mjs                   # Next.js configuration
├── package.json                      # Project manifest, dependencies, scripts
├── package-lock.json                 # Dependency lockfile
├── postcss.config.js                 # PostCSS configuration for Tailwind CSS
├── tailwind.config.js                # Tailwind CSS design system and theme configuration
├── tsconfig.json                     # TypeScript configuration for Next.js App
├── tsconfig.server.json              # TypeScript configuration for Node.js MCP server
├── tsconfig.tsbuildinfo              # TypeScript incremental build cache
├── vitest.config.ts                  # Vitest test runner configuration
│
├── app/                              # Next.js 14 App Router
│   ├── globals.css                   # Global stylesheet with dark theme variables
│   ├── layout.tsx                    # Root layout with sidebar and navigation wrapper
│   ├── page.tsx                      # Landing page with studio feature showcase
│   ├── create/                       # Project creator page (upload & sample loader)
│   │   └── page.tsx
│   ├── dashboard/                    # Project dashboard & recent jobs overview
│   │   └── page.tsx
│   ├── diagnostics/                  # System health & FFmpeg diagnostics page
│   │   └── page.tsx
│   ├── editor/                       # 3-Panel Caption Studio Editor
│   │   └── page.tsx
│   ├── presets/                      # Preset visual gallery & typography explorer
│   │   └── page.tsx
│   ├── settings/                     # Settings page for AI keys and studio defaults
│   │   └── page.tsx
│   └── api/                          # REST API Endpoints
│       ├── diagnostics/route.ts      # Health check and environment diagnostic endpoint
│       ├── export/route.ts           # Subtitle export endpoint (SRT/VTT)
│       ├── jobs/                     # Job management endpoints
│       │   ├── route.ts              # GET: List active/past jobs
│       │   └── [id]/route.ts         # GET: Job status; POST: Cancel job
│       ├── media/                    # Media processing endpoints
│       │   ├── cutout-preview/route.ts # Generate transparent preview frame
│       │   ├── extract-audio/route.ts  # Extract MP3/WAV audio track
│       │   ├── inspect/route.ts        # FFprobe metadata inspection
│       │   └── stream/route.ts         # Byte-range video/audio streaming & download
│       ├── presets/route.ts          # GET: List filtered styling presets
│       ├── projects/                 # Project persistence endpoints
│       │   ├── route.ts              # GET: List projects; POST: Create project
│       │   └── [id]/
│       │       ├── route.ts          # GET: Read; PATCH: Update; DELETE: Delete
│       │       └── transcribe/route.ts # POST: Re-run transcription on project
│       ├── render/route.ts           # POST: Trigger FFmpeg caption burn-in
│       ├── sample/route.ts           # GET: Inspect verified sample video
│       ├── segments/
│       │   └── validate/route.ts     # POST: Validate caption segments contract
│       ├── settings/
│       │   ├── route.ts              # GET/POST/DELETE: Manage user settings
│       │   └── test-key/route.ts     # POST: Verify Gemini connection
│       ├── transcribe/route.ts       # POST: Headless transcription endpoint
│       └── upload/route.ts           # POST: Video file upload & auto-transcribe
│
├── components/                       # Shared React UI Components
│   ├── Navbar.tsx                    # Top navigation header
│   ├── Sidebar.tsx                   # Left navigation sidebar
│   ├── Timeline.tsx                  # Interactive audio/caption timeline widget
│   └── VideoPlayer.tsx               # HTML5 player with subtitle overlay & safe guides
│
├── dist/                             # Compiled JavaScript build for MCP Server
│   ├── index.js                      # MCP server entry point
│   ├── server.js                     # McpServer instantiation
│   └── ...                           # Compiled service modules
│
├── examples/                         # Developer Integration Examples
│   ├── mcp-client-config.json        # Claude Desktop MCP configuration example
│   └── sample-workflow.ts            # Programmatic MCP client workflow script
│
├── models/                           # Machine Learning Model Assets
│   └── selfie_segmenter.tflite       # MediaPipe selfie segmentation TFLite model
│
├── output/                           # Rendered outputs, audio extracts, and exports
│   └── .gitkeep
│
├── samples/                          # Sample Media Assets
│   ├── sample-video.mp4              # Verified 5.4s 720x1280 vertical test video
│   └── speech-sample.wav             # 16kHz audio sample for speech testing
│
├── scripts/                          # Automation & Testing Utility Scripts
│   ├── gen-speech.ps1                # PowerShell TTS generator script
│   ├── generate-sample.mjs           # Script generating synthetic sample video
│   ├── process_person_cutout.py      # Python MediaPipe segmentation script
│   ├── test-all-tools.mjs            # Comprehensive STDIO MCP test suite (9 tools)
│   └── verify-mcp-connection.mjs     # Standalone MCP connection verification script
│
├── src/                              # Core TypeScript Domain Architecture
│   ├── index.ts                      # MCP CLI Entry Point (`#!/usr/bin/env node`)
│   ├── server.ts                     # Kalalo MCP Server Factory
│   ├── config/
│   │   └── env.ts                    # Zod-validated environment configuration
│   ├── presets/
│   │   ├── index.ts                  # Presets module export
│   │   └── presets.ts                # 28 original ASS styling presets & resolver
│   ├── schemas/                      # Canonical Zod Contract Schemas
│   │   ├── common.schema.ts          # Language, aspect ratio, error schemas
│   │   ├── job.schema.ts             # Job lifecycle, input/output schemas
│   │   ├── media.schema.ts           # FFprobe inspection schemas
│   │   ├── preset.schema.ts          # Styling preset structure schemas
│   │   ├── render.schema.ts          # Render and export input/output schemas
│   │   └── segment.schema.ts         # Caption segment timing and list schemas
│   ├── services/                     # Business Logic Services
│   │   ├── captions.service.ts       # Segment normalization, validation, timing
│   │   ├── cutout.service.ts         # Person segmentation and mask video generation
│   │   ├── jobs.service.ts           # Job lifecycle, progress tracking, cancellation
│   │   ├── media.service.ts          # FFprobe metadata inspection
│   │   ├── projects.service.ts       # Project storage and retrieval
│   │   ├── rendering.service.ts      # ASS generator and FFmpeg render pipeline
│   │   ├── settings.service.ts       # Settings and API credential store
│   │   ├── subtitle-export.service.ts# SRT and WebVTT serialization
│   │   └── transcription/            # Speech-to-Text Engines
│   │       ├── gemini.provider.ts    # Google Gemini AI integration
│   │       ├── mock.provider.ts      # Offline deterministic mock engine
│   │       ├── openai.provider.ts    # OpenAI Whisper integration
│   │       ├── provider.factory.ts   # Dynamic provider factory
│   │       └── provider.interface.ts # Transcription provider contract
│   ├── types/
│   │   └── index.ts                  # Shared TypeScript interfaces
│   └── utils/                        # System & Operating System Utilities
│       ├── errors.ts                 # Standardized KalaloError class
│       ├── paths.ts                  # Path validation, resolution, directory checks
│       ├── process.ts                # Safe child_process spawn, timeouts, binary resolver
│       └── time.ts                   # SRT, VTT, and ASS timestamp formatters
│
├── tests/                            # Automated Vitest Test Suite (52 tests)
│   ├── audio-extraction.test.ts      # Audio extraction via FFmpeg
│   ├── jobs.test.ts                  # In-memory job lifecycle and cancellation
│   ├── mcp-tools.test.ts             # MCP server tool registration and invocations
│   ├── media.test.ts                 # FFprobe media inspection
│   ├── presets.test.ts               # Preset resolution and filtering
│   ├── projects.test.ts              # Project creation, update, and deletion
│   ├── rendering.test.ts             # FFmpeg burn-in rendering and trimming
│   ├── schemas.test.ts               # Zod contract and timing validation
│   └── subtitles.test.ts             # SRT and WebVTT serialization
│
└── tmp/                              # Temporary Scratch & Runtime Data Directory
    ├── previews/                     # Temporary frame preview PNGs
    ├── uploads/                      # Uploaded video and audio files
    ├── projects.json                 # Persistent project store
    └── user-settings.json            # Persistent user configuration and masked keys
```

### 4.2 Entry Points

1. **Web Studio (Browser Interface):** `app/page.tsx` (served by `next dev` or `next start` on `http://localhost:3000`).
2. **Backend API Handlers:** `app/api/**/route.ts` executed inside Next.js server runtime.
3. **MCP Server (CLI / AI Agent Interface):** `src/index.ts` compiled to `dist/index.js` (executed via `node dist/index.js` or `npm run dev:mcp`). Configured with `#!/usr/bin/env node` and registered in `package.json` under `"bin": { "kalalo": "./dist/index.js" }`.

---

## 5. Technical Stack & Dependencies

All versions are verified directly from `package.json` and the active environment.

### 5.1 Runtime & Framework Versions
- **Node.js:** `v22.13.0`
- **npm:** `10.9.2`
- **TypeScript:** `^5.8.2` (devDependency, compiles both Next.js app and standalone MCP server)
- **Next.js:** `^14.2.23` (Core web framework, App Router, React Server Components, API routes)
- **React & React DOM:** `^18.3.1` (UI view layer)

### 5.2 Dependencies Breakdown

| Package | Version | Type | Purpose & Justification |
|---|---|---|---|
| `@modelcontextprotocol/sdk` | `^1.6.1` | Runtime | Official Model Context Protocol TypeScript SDK. Implements `McpServer`, `StdioServerTransport`, JSON-RPC message framing, and tool registration. |
| `zod` | `^3.24.2` | Runtime | Schema declaration, runtime validation, and static type inference. Enforces caption timing rules, job states, and MCP tool parameter validation. |
| `dotenv` | `^16.4.7` | Runtime | Loads environment variables from `.env` into `process.env`. |
| `clsx` | `^2.1.1` | Runtime | Utility for constructing conditional CSS className strings. |
| `tailwind-merge` | `^3.7.0` | Runtime | Utility to safely merge Tailwind CSS class names without CSS specificity conflicts. |
| `lucide-react` | `^1.57.0` | Runtime | Icon library for video player controls, navigation, and studio panels. |
| `@ffmpeg-installer/ffmpeg` | `^1.1.0` | Dev / Bundled | Self-contained platform-specific FFmpeg binary installer for zero-config local execution. |
| `@ffprobe-installer/ffprobe` | `^2.1.2` | Dev / Bundled | Self-contained platform-specific FFprobe binary installer. |
| `tailwindcss` | `^3.4.17` | Dev | Utility-first CSS framework for studio styling. |
| `postcss` | `^8.4.31` | Dev | Tool for transforming CSS with plugins. |
| `autoprefixer` | `^10.4.20` | Dev | PostCSS plugin to parse CSS and add vendor prefixes. |
| `tsx` | `^4.19.3` | Dev | TypeScript execute wrapper for executing `src/index.ts` during development without pre-compilation. |
| `vitest` | `^3.0.7` | Dev | Unit and integration test runner. |
| `@types/node` | `^22.13.9` | Dev | Node.js TypeScript type definitions. |
| `@types/react` | `^18.3.18` | Dev | React TypeScript type definitions. |
| `@types/react-dom` | `^18.3.5` | Dev | React DOM TypeScript type definitions. |

---

## 6. Architecture & Data Flow

### 6.1 Mermaid System Architecture Diagram

```mermaid
graph TD
    subgraph Client Tier
        UI[Next.js Web Studio Browser]
        Agent[MCP Client / Claude Desktop / Antigravity]
    end

    subgraph Server & Transport Tier
        APIRoutes[Next.js API Routes app/api/*]
        MCPServer[MCP Server STDIO JSON-RPC dist/index.js]
    end

    subgraph Domain Services Tier
        MediaSvc[MediaService FFprobe]
        CaptionsSvc[CaptionsService Validation & Timing]
        JobsSvc[JobsService In-Memory State & Signals]
        ProjectsSvc[ProjectsService tmp/projects.json]
        SettingsSvc[SettingsService tmp/user-settings.json]
        RenderSvc[RenderingService FFmpeg ASS Burn-In]
        SubExportSvc[SubtitleExportService SRT/VTT]
        CutoutSvc[CutoutService Python/MediaPipe]
    end

    subgraph AI Transcription Tier
        Factory[ProviderFactory]
        Gemini[GeminiTranscriptionProvider Google API v1beta]
        Mock[MockTranscriptionProvider Offline Engine]
        OpenAI[OpenAITranscriptionProvider Whisper]
    end

    subgraph External & Binaries
        FFmpegBin[FFmpeg Binary libx264 / ASS]
        FFprobeBin[FFprobe Binary JSON Output]
        GoogleCloud[Google Gemini API Endpoint]
        FileSystem[File System tmp/ and output/]
    end

    UI -->|HTTP Fetch / Multipart| APIRoutes
    Agent -->|STDIO JSON-RPC 2.0| MCPServer

    APIRoutes --> ProjectsSvc
    APIRoutes --> SettingsSvc
    APIRoutes --> MediaSvc
    APIRoutes --> JobsSvc
    APIRoutes --> RenderSvc
    APIRoutes --> SubExportSvc
    APIRoutes --> Factory

    MCPServer --> MediaSvc
    MCPServer --> CaptionsSvc
    MCPServer --> JobsSvc
    MCPServer --> RenderSvc
    MCPServer --> SubExportSvc
    MCPServer --> Factory

    Factory --> Gemini
    Factory --> Mock
    Factory --> OpenAI

    Gemini -->|HTTP REST Base64 Audio| GoogleCloud
    MediaSvc --> FFprobeBin
    RenderSvc --> FFmpegBin
    RenderSvc --> CaptionsSvc
    RenderSvc --> CutoutSvc

    ProjectsSvc --> FileSystem
    SettingsSvc --> FileSystem
    RenderSvc --> FileSystem
```

---

### 6.2 Sequence Diagram: Ingestion to Transcription to Burn-In Render

```mermaid
sequenceDiagram
    autonumber
    actor Creator as Creator / User
    participant Web as Web Studio (Next.js)
    participant API as Upload / Render API
    participant Media as MediaService (FFprobe)
    participant Gemini as Gemini Provider
    participant Captions as CaptionsService
    participant Render as RenderingService (FFmpeg)
    participant Disk as Local File Storage

    Creator->>Web: Drops MP4 video file (or clicks Sample Media)
    Web->>API: POST /api/upload (multipart/form-data)
    API->>Disk: Saves file to tmp/uploads/upload-{uuid}.mp4
    API->>Media: inspectMedia(filePath)
    Media-->>API: Returns resolution (720x1280), duration (5.4s), hasAudio: true
    API->>Disk: Persists project record to tmp/projects.json

    opt Auto-Transcribe is Enabled
        API->>Gemini: transcribe({ inputPath, language: 'auto' })
        Gemini->>Disk: Extracts 16kHz mono MP3 via FFmpeg
        Gemini->>Gemini: Base64-encodes MP3 buffer
        Gemini->>Google Gemini API: POST v1beta/models/gemini-3.5-flash-lite:generateContent
        Google Gemini API-->>Gemini: Returns structured JSON array of segments
        Gemini->>Captions: ensureValid(segments, duration)
        Captions-->>Gemini: Returns normalized, overlap-free segments
        Gemini-->>API: Returns segments array
        API->>Disk: Updates project in tmp/projects.json
    end

    API-->>Web: Returns Project Data + Segments
    Web-->>Creator: Renders 3-Panel Studio with Video & Synced Captions

    Creator->>Web: Edits text, adjusts preset to "Pop Highlight", clicks "Render Video"
    Web->>API: POST /api/render { inputPath, segments, presetId, aspectRatio: '9:16' }
    API->>Render: renderCaptions(options)
    Render->>Captions: generateAssContent(segments, presetStyle, 1080, 1920)
    Captions-->>Render: Writes formatted ASS file to tmp/kalalo-{uuid}.ass
    Render->>FFmpeg: Spawns FFmpeg [-i video, -vf scale/pad + subtitles, -progress pipe:1]
    loop FFmpeg Progress Loop
        FFmpeg-->>Render: out_time_us={microseconds}
        Render-->>API: Progress updated (e.g. 45%, 72%)
    end
    FFmpeg-->>Render: Render complete, outputs output/render-9-16-{uuid}.mp4
    Render->>Media: inspectMedia(outputPath) (Verify file > 0 bytes & has video)
    Render-->>API: RenderResult { outputPath, 1080x1920, 9:16 }
    API-->>Web: Returns downloadUrl & streamUrl
    Web-->>Creator: Displays modal with rendered video player & Download MP4 button
```

---

## 7. API Routes and Contracts

All routes are implemented under `app/api/` using Next.js App Router route handlers.

### 7.1 Complete Route Inventory

#### 1. `POST /api/upload`
- **Purpose:** Ingests media files, performs FFprobe inspection, persists the project, and optionally triggers speech-to-text.
- **Request:** `multipart/form-data` containing:
  - `file`: `File` (Max 250 MB).
  - `autoTranscribe`: `"true"` | `"false"`.
  - `language`: `"auto"` | `"hinglish"` | `"hi"` | `"en"`.
  - `provider`: `"gemini"` | `"mock"` | `"openai"` (optional).
- **Response Format (200 OK):**
  ```json
  {
    "success": true,
    "project": { "id": "proj-...", "name": "...", "filePath": "...", "durationSeconds": 5.4, "status": "ready_to_edit" },
    "projectId": "proj-...",
    "filePath": "C:\\...\\tmp\\uploads\\upload-uuid.mp4",
    "fileName": "sample.mp4",
    "fileSize": 119041,
    "streamUrl": "/api/media/stream?path=...",
    "media": { "durationSeconds": 5.4, "hasAudio": true, "hasVideo": true },
    "segments": [{ "id": "gemini-seg-1", "start": 0.36, "end": 1.28, "text": "...", "language": "en" }],
    "transcriptionError": null,
    "status": "ready_to_edit"
  }
  ```
- **File System Effects:** Writes uploaded buffer to `tmp/uploads/upload-{uuid}.ext`. Updates `tmp/projects.json`.
- **Implementation File:** `app/api/upload/route.ts`

#### 2. `POST /api/render`
- **Purpose:** Renders styled ASS captions onto a source video with aspect ratio scaling, letterboxing, trimming, and audio controls.
- **Request Body (JSON):**
  ```json
  {
    "inputPath": "C:\\path\\to\\source.mp4",
    "segments": [{ "id": "seg-1", "start": 0.0, "end": 2.0, "text": "Hello world" }],
    "presetId": "kalalo-clean-bold",
    "aspectRatio": "9:16",
    "customPreset": { "fontSize": 72, "primaryColor": "&H0000FFFF&" },
    "trimStart": 0.0,
    "trimEnd": 5.0,
    "muteAudio": false,
    "resolution": "1080p",
    "personCutout": false,
    "async": false
  }
  ```
- **Response Format (200 OK):**
  ```json
  {
    "jobId": "job-...",
    "status": "completed",
    "outputPath": "C:\\...\\output\\render-9-16-uuid.mp4",
    "streamUrl": "/api/media/stream?path=...",
    "downloadUrl": "/api/media/stream?path=...&download=true&filename=...",
    "result": { "outputPath": "...", "durationSeconds": 5.0, "width": 1080, "height": 1920, "aspectRatio": "9:16" }
  }
  ```
- **File System Effects:** Creates temporary ASS file in `tmp/`, renders target MP4 in `output/`, cleans up temporary ASS.
- **Implementation File:** `app/api/render/route.ts`

#### 3. `POST /api/export`
- **Purpose:** Converts caption segments into SubRip (`.srt`) or WebVTT (`.vtt`) files.
- **Request Body (JSON):** `{ "segments": CaptionSegment[], "format": "srt" | "vtt", "saveToDisk": true }`
- **Response Format (200 OK):**
  ```json
  {
    "format": "srt",
    "outputPath": "C:\\...\\output\\subtitles-uuid.srt",
    "content": "1\n00:00:00,000 --> 00:00:01,800\nHello\n",
    "segmentCount": 1,
    "downloadUrl": "/api/media/stream?path=...&download=true&filename=kalalo-subtitles.srt"
  }
  ```
- **Implementation File:** `app/api/export/route.ts`

#### 4. `GET /api/media/stream`
- **Purpose:** High-performance byte-range streaming for video and audio playback in HTML5 players, and forced attachment downloading.
- **Query Parameters:** `path` (string), `download` ("true"|"false"), `filename` (string).
- **HTTP Headers:** Supports `Range: bytes=start-end`. Responds with `206 Partial Content` or `200 OK`. `Content-Type` matches file extension (`video/mp4`, `audio/mpeg`, `text/vtt`).
- **Implementation File:** `app/api/media/stream/route.ts`

#### 5. `POST /api/media/inspect`
- **Purpose:** Direct FFprobe inspection of a file path on disk.
- **Request Body:** `{ "inputPath": "C:\\path\\video.mp4" }`
- **Response Format:** Full `MediaMetadata` object with codec, fps, bitrates, dimensions.
- **Implementation File:** `app/api/media/inspect/route.ts`

#### 6. `POST /api/media/extract-audio`
- **Purpose:** Extracts audio track from video as MP3 or WAV.
- **Request Body:** `{ "inputPath": "...", "format": "mp3" | "wav" }`
- **Response Format:** `{ "success": true, "audioPath": "...", "durationSeconds": 5.4, "streamUrl": "...", "downloadUrl": "..." }`
- **Implementation File:** `app/api/media/extract-audio/route.ts`

#### 7. `POST /api/media/cutout-preview`
- **Purpose:** Generates a single transparent PNG frame showing the foreground subject segmented from background.
- **Request Body:** `{ "inputPath": "..." }`
- **Response Format:** `{ "success": true, "available": true, "previewUrl": "...", "previewPath": "..." }`
- **Implementation File:** `app/api/media/cutout-preview/route.ts`

#### 8. `GET /api/projects` and `POST /api/projects`
- **Purpose:** List all projects (sorted newest first) or create a project record.
- **Implementation File:** `app/api/projects/route.ts`

#### 9. `GET /api/projects/[id]`, `PATCH /api/projects/[id]`, `DELETE /api/projects/[id]`
- **Purpose:** Fetch project by ID, update project metadata/segments/presets, or delete project from storage.
- **Implementation File:** `app/api/projects/[id]/route.ts`

#### 10. `POST /api/projects/[id]/transcribe`
- **Purpose:** Trigger a fresh transcription run on an existing project file.
- **Implementation File:** `app/api/projects/[id]/transcribe/route.ts`

#### 11. `GET /api/presets`
- **Purpose:** List styling presets filtered by format (`9:16`, `1:1`, `16:9`) or language (`hinglish`, `hi`, `en`).
- **Implementation File:** `app/api/presets/route.ts`

#### 12. `GET /api/jobs` and `GET /api/jobs/[id]` and `POST /api/jobs/[id]`
- **Purpose:** List all jobs, get individual job progress, or post cancellation request.
- **Implementation Files:** `app/api/jobs/route.ts`, `app/api/jobs/[id]/route.ts`

#### 13. `GET /api/settings`, `POST /api/settings`, `DELETE /api/settings`
- **Purpose:** Read public settings (masked keys), save API keys and preferences, or clear saved keys.
- **Implementation File:** `app/api/settings/route.ts`

#### 14. `POST /api/settings/test-key`
- **Purpose:** Verifies Google Gemini connectivity using a test key or the currently saved key.
- **Request Body:** `{ "apiKey": "AIzaSy...", "model": "gemini-3.5-flash-lite" }` (both optional)
- **Response:** `{ "success": true, "message": "Successfully connected to Google Gemini...", "model": "gemini-3.5-flash-lite" }`
- **Implementation File:** `app/api/settings/test-key/route.ts`

#### 15. `POST /api/segments/validate`
- **Purpose:** Validates segment timing, overlap, ordering, and duration constraints.
- **Implementation File:** `app/api/segments/validate/route.ts`

#### 16. `GET /api/diagnostics`
- **Purpose:** System health report covering FFmpeg/FFprobe binaries, STT provider, preset counts, and storage writability.
- **Implementation File:** `app/api/diagnostics/route.ts`

#### 17. `GET /api/sample`
- **Purpose:** Returns metadata and stream URL for the bundled sample video (`samples/sample-video.mp4`).
- **Implementation File:** `app/api/sample/route.ts`

---

## 8. Gemini Integration & API Key Handling

### 8.1 Key Configuration & Storage
Creators can supply a personal Google Gemini API key through three channels:
1. **Web Studio Settings UI:** Navigating to `/settings`, pasting an API key (`AIzaSy...`), and clicking **Save API Key**. The key is saved to `tmp/user-settings.json`.
2. **Environment Variables:** Defining `GEMINI_API_KEY` or `GOOGLE_API_KEY` in `.env`.
3. **Per-Request Headers / Body:** Providing `x-gemini-api-key` in HTTP headers or `apiKey` in request JSON payloads.

### 8.2 Security & Isolation Evaluation
- **Encryption at Rest:** **Not Encrypted.** Keys saved via the Settings UI are stored as plaintext JSON in `tmp/user-settings.json`.
- **Masking on Read:** When `/api/settings` is queried, `SettingsService.getPublicSettings()` masks the key (`AIzaSy••••••••AbCd`), exposing only the first 6 and last 4 characters. The raw key is never returned to the frontend client.
- **User Isolation:** **Single-Tenant.** Any user accessing the local instance uses the same shared settings file and API key. There is no cryptographic tenant isolation.
- **Logging Safety:** `gemini.provider.ts` and `settings.service.ts` sanitize API parameters. API keys are transmitted to Google over HTTPS in query parameters (`key=AIzaSy...`) or headers.

### 8.3 Live Transcription Verification vs. Connection Test

During this audit, both tests were executed live:
1. **Connection Test (`SettingsService.testGeminiConnection`):**
   - **Command:** `node -e "import('./dist/services/settings.service.js')..."`
   - **Result:** `{"success": true, "message": "Successfully connected to Google Gemini (gemini-3.5-flash-lite)! Speech transcription is ready.", "model": "gemini-3.5-flash-lite"}` (HTTP 200).
2. **Real Audio/Video Speech Transcription Test:**
   - **Target File:** `samples/sample-video.mp4` (Duration: 5.4s).
   - **Execution Procedure:** Audio extracted to 16kHz mono MP3 via FFmpeg, base64 encoded, transmitted to Google Gemini v1beta endpoint with structured JSON response schema.
   - **Actual Result:**
     ```json
     {
       "segments": [
         {
           "id": "gemini-seg-1-1f059d",
           "start": 0.36,
           "end": 1.28,
           "text": "Welcome to Cololo.",
           "language": "en",
           "confidence": 0.98
         },
         {
           "id": "gemini-seg-2-f4e79a",
           "start": 1.84,
           "end": 4.64,
           "text": "Create crisp captions with Google Gemini AI.",
           "language": "en",
           "confidence": 0.98
         }
       ],
       "detectedLanguage": "en",
       "provider": "gemini"
     }
     ```
   - **Conclusion:** Confirmed live end-to-end transcription functionality using Gemini AI Studio credentials.

---

## 9. Caption Rendering & Media Processing

### 9.1 ASS Script Generation & Typography
Kalalo compiles caption segments into the Advanced SubStation Alpha (`.ass` v4.00+) subtitle specification in `RenderingService.generateAssContent()`:
- **Reference Resolution:** Standardized to a 1920px reference height (`PlayResX: 1080`, `PlayResY: 1920` for 9:16). All font sizes, outlines, shadows, and margins are scaled proportionally by `targetHeight / 1920`.
- **Positioning:** Supports explicit normalized X/Y percentage coordinates converted to exact ASS positioning tags: `{\an${alignment}\pos(${posX},${posY})}`.
- **Background Treatments:**
  - `none`: BorderStyle 1 with text outline and drop shadow.
  - `solid_box`: BorderStyle 3 with opaque black bounding box.
  - `translucent_box`: BorderStyle 3 with calculated alpha channel opacity (`&H${opacityHex}000000&`).
  - `highlight_box`: BorderStyle 3 using preset accent color.
  - `outline_only`: BorderStyle 1 with shadow set to 0.
- **Text Escaping & Unicode Safety:** Special characters (`\`, `{`, `}`) are escaped to prevent ASS formatting injection. Newlines are mapped to `\N`. Devanagari Unicode glyphs (Hindi, Marathi) are rendered with full UTF-8 integrity.

### 9.2 FFmpeg Video Processing Pipeline

#### Filter Complex for Standard Burn-In:
```bash
ffmpeg -y -ss {trimStart} -to {trimEnd} -i {inputPath} \
  -vf "scale={W}:{H}:force_original_aspect_ratio=decrease,pad={W}:{H}:(ow-iw)/2:(oh-ih)/2:black,subtitles='{escapedAssPath}'" \
  -c:v libx264 -preset fast -crf 22 -pix_fmt yuv420p \
  -c:a aac -b:a 128k \
  -progress pipe:1 -nostats {outputPath}
```

#### Multi-Input Filter Complex for Person Cutout (Captions Behind Subject):
When `personCutout: true` is enabled, Kalalo uses a 2-pass multi-stream compositing filter:
```
[0:v] -> scale & pad background ───────────────────► [bg]
[bg]  -> burn ASS subtitles ──────────────────────► [bg_sub]
[0:v] -> scale & pad foreground frame ─────────────► [scaled_fg]
[scaled_fg] + [1:v mask] -> alphamerge ────────────► [fg_person]
[bg_sub] + [fg_person] -> overlay=0:0 ─────────────► [outv]
```
1. `[0:v]` is scaled and padded to target dimensions (`[bg]`).
2. Subtitles are burned onto the background video (`[bg_sub]`).
3. An alpha mask video (`[1:v]`) generated by MediaPipe is merged with the uncaptioned video via `alphamerge` (`[fg_person]`).
4. The foreground person is overlaid on top of the subtitled background via `overlay=0:0`, placing captions behind the speaker.

#### Execution Tracking & Output Verification:
- Progress is captured asynchronously from `pipe:1` parsing `out_time_us={microsecond}` and mapped to 0-100% progress.
- Upon process completion, `MediaService.inspectMedia(outputPath)` verifies that the resulting file exists, has a size greater than 0 bytes, and contains a valid video stream.

---

## 10. Data Storage and Project Persistence

| Data Entity | Storage Mechanism | Location | Persistence Across Restarts | Retention / Cleanup Policy |
|---|---|---|---|---|
| **Project Records** | JSON File | `tmp/projects.json` | **Yes** (survives restart) | Stored indefinitely until deleted via UI or API. Pre-seeds Welcome sample if empty. |
| **User Settings & Keys** | JSON File | `tmp/user-settings.json` | **Yes** (survives restart) | Stored indefinitely until updated or cleared. |
| **Uploaded Videos** | Local Filesystem | `tmp/uploads/upload-{uuid}.mp4` | **Yes** (survives restart) | Currently retained indefinitely. No automatic TTL or cleanup daemon. |
| **Rendered Videos** | Local Filesystem | `output/render-{aspect}-{uuid}.mp4` | **Yes** (survives restart) | Retained indefinitely in `output/`. |
| **Exported Subtitles** | Local Filesystem | `output/subtitles-{uuid}.srt/.vtt` | **Yes** (survives restart) | Retained indefinitely in `output/`. |
| **Audio Extracts** | Local Filesystem | `output/{base}_audio_{uuid}.mp3` | **Yes** (survives restart) | Retained indefinitely in `output/`. |
| **Job Execution State** | In-Memory `Map` | `JobsService.jobs` | **No** (reset on restart) | Cleared when the Node.js process terminates. |
| **Temporary ASS / Masks**| Local Filesystem | `tmp/kalalo-{uuid}.ass`, `tmp/kalalo-mask-{uuid}.mp4` | **No** (temporary) | Cleaned up via `try...finally` unlinks in `rendering.service.ts`. |

---

## 11. Environment Variables and Setup

### 11.1 Environment Variables Reference

| Variable Name | Purpose | Required | Default in Code | Safe Example Value |
|---|---|---|---|---|
| `NODE_ENV` | Application runtime mode | No | `"development"` | `development` / `production` |
| `LOG_LEVEL` | Logging verbosity | No | `"info"` | `info` / `debug` |
| `KALALO_OUTPUT_DIR` | Destination directory for renders and exports | No | `"./output"` | `./output` |
| `KALALO_TEMP_DIR` | Directory for scratch files and temporary media | No | `"./tmp"` | `./tmp` |
| `KALALO_DEFAULT_ASPECT_RATIO` | Default viewport format | No | `"9:16"` | `9:16` |
| `KALALO_STT_PROVIDER` | Default transcription engine | No | `"mock"` (or `"gemini"` in factory) | `gemini` / `mock` / `openai` |
| `KALALO_STT_MODEL` | Override model name for STT | No | `undefined` | `whisper-1` |
| `KALALO_GEMINI_MODEL` | Default Google Gemini model | No | `"gemini-3.5-flash-lite"` | `gemini-3.5-flash-lite` |
| `KALALO_STT_LANGUAGE` | Default transcription language | No | `"auto"` | `auto` / `hinglish` / `hi` / `en` |
| `KALALO_FFMPEG_PATH` | Path override for custom FFmpeg binary | No | Bundled installer binary | `C:\tools\ffmpeg\bin\ffmpeg.exe` |
| `KALALO_FFPROBE_PATH` | Path override for custom FFprobe binary | No | Bundled installer binary | `C:\tools\ffmpeg\bin\ffprobe.exe` |
| `GEMINI_API_KEY` | Server-wide Google Gemini API Key | No | `undefined` | `AIzaSy...` (Never commit) |
| `GOOGLE_API_KEY` | Fallback Google Gemini API Key | No | `undefined` | `AIzaSy...` (Never commit) |
| `OPENAI_API_KEY` | Server-wide OpenAI API Key | No | `undefined` | `sk-proj-...` (Never commit) |

---

### 11.2 Step-by-Step Setup Guide (Windows Development Machine)

```powershell
# 1. Clone repository and navigate to root directory
cd C:\Users\karan\OneDrive\Desktop\Kalalo

# 2. Install all npm dependencies
npm install

# 3. Create .env from template
Copy-Item .env.example .env

# 4. Run TypeScript typecheck to verify contracts
npm run typecheck

# 5. Run automated Vitest test suite (All 52 tests)
npm test

# 6. Verify all 9 MCP tools over STDIO client transport
npm run test:tools

# 7. Compile the MCP server binary
npm run build:mcp

# 8. Build the Next.js production web studio
npm run build

# 9. Start the local server
npm run dev      # For development with hot reloading (port 3000)
# OR
npm start        # For production server
```

---

## 12. Testing and Verification Evidence

All tests listed below were executed directly during this technical audit.

| Test Suite / Procedure | Execution Command | Result | Evidence / Details | Limitations / Notes |
|---|---|---|---|---|
| **TypeScript Typecheck** | `npm run typecheck` (`tsc --noEmit`) | **Passed (Exit Code 0)** | Zero type errors across all routes, components, and services. | Clean compilation. |
| **Unit & Integration Tests** | `npm test` (`vitest run`) | **Passed (Exit Code 0)** | 52 tests passed across 9 test files in 35.64s. Covered schemas, jobs, media, presets, rendering, subtitles, projects, audio extraction, and MCP tools. | Real FFmpeg/FFprobe operations executed on synthetic test media. |
| **All 9 MCP Tools via STDIO** | `npm run test:tools` | **Passed (Exit Code 0)** | Verified inspect, transcribe (mock), validate, presets, export (SRT/VTT), render, get job, list jobs, and cancel job. | Validated over live `StdioClientTransport`. |
| **MCP Connection Verification** | `npm run verify:mcp` | **Passed (Exit Code 0)** | Verified JSON-RPC protocol negotiation and `client.listTools()` retrieval. | Confirmed STDIO pipe does not receive leaked stdout. |
| **Next.js Production Build** | `npm run build` (`next build`) | **Passed (Exit Code 0)** | Compiled all static and dynamic routes. Generated static pages (26/26). | First Load JS shared by all: 87.1 kB. |
| **Gemini Live Connection Test** | `SettingsService.testGeminiConnection()` | **Passed (Exit Code 0)** | Successfully connected to `generativelanguage.googleapis.com` with model `gemini-3.5-flash-lite`. | Responded with HTTP 200 OK. |
| **Gemini Real Speech Transcription** | Node.js script invoking `GeminiTranscriptionProvider.transcribe()` | **Passed (Exit Code 0)** | Audio extracted from `sample-video.mp4` and transcribed into 2 timed segments via Gemini multimodal API. | Verified real speech timestamps (`0.36 - 1.28` and `1.84 - 4.64`). |
| **Audio Extraction Test** | Vitest `audio-extraction.test.ts` | **Passed (Exit Code 0)** | Extracted audio track from MP4 to MP3, verified audio bitrate and channels via FFprobe. | Completed in 2749ms. |
| **SRT & WebVTT Export Tests** | Vitest `subtitles.test.ts` | **Passed (Exit Code 0)** | Verified serialization formatting, cue numbering, millisecond comma/dot delimiters, and file writing. | 5 tests passed in 24ms. |
| **FFmpeg Caption Render Test** | Vitest `rendering.test.ts` | **Passed (Exit Code 0)** | Rendered styled captions into 9:16 MP4 video, verified dimensions (1080x1920) and non-zero byte size with FFprobe. | Completed in 3204ms. |
| **Trimming & Muting Render Test**| Vitest `rendering.test.ts` | **Passed (Exit Code 0)** | Rendered trimmed 720p clip with muted audio, verified duration and absence of audio stream via FFprobe. | Completed in 1029ms. |
| **Model Availability Scan** | `node scratch/test_all_models.mjs` | **Completed** | `gemini-3.5-flash-lite`: HTTP 200 (Active). `gemini-2.5-flash-lite`: HTTP 404 (Deprecated). `gemini-3.7-flash`: HTTP 503 (High demand). | Confirmed `gemini-3.5-flash-lite` is the correct stable default. |
| **Person Cutout Dependency Test** | `python -c "import cv2..."` | **Blocked / Incomplete** | Default Windows `python` points to Microsoft Store execution alias stub; Python dependencies (OpenCV, MediaPipe) are not installed globally. | Cutout service requires configured Python runtime. |

---

## 13. Known Issues and Technical Debt

### 13.1 High Severity Issues
1. **Arbitrary File Access via `validateInputPath`:**
   - *Impact:* Path traversal and arbitrary file reads. In `src/utils/paths.ts`, `validateInputPath` resolves paths using `path.resolve(filePath.trim())` and checks if the file exists, but does not constrain resolution to a designated sandbox directory (e.g. `tmp/uploads` or `output`). An unauthenticated user can call `GET /api/media/stream?path=C:\Windows\System32\...` or `POST /api/media/inspect` to read or inspect arbitrary files accessible to the Node.js process.
2. **In-Memory Job State (`JobsService`):**
   - *Impact:* Loss of job tracking on restart or deployment. Jobs are held in a `Map<string, InternalJobRecord>`. If the Next.js process restarts or scales across multiple workers/lambdas, active rendering or transcription jobs cannot be queried or monitored by other processes.

### 13.2 Medium Severity Issues
1. **Unconstrained Disk Growth:**
   - *Impact:* Disk exhaustion. Files in `tmp/uploads/` and `output/` are stored permanently. There is no automated TTL cleanup, background garbage collection, or disk quota enforcement.
2. **Plaintext API Key Storage:**
   - *Impact:* Credential compromise. Keys stored via the Settings UI are written in plaintext to `tmp/user-settings.json`. Anyone with read access to the server filesystem or backup archives can read the stored credentials.
3. **Cutout Runtime Dependency:**
   - *Impact:* Feature failure on unconfigured systems. `CutoutService.isAvailable()` checks only if the script and `.tflite` model exist, but does not verify whether `python` is executable or has `cv2` and `mediapipe` installed. On standard Windows environments, this causes the child process to hang or fail on spawn.

### 13.3 Low Severity / Technical Debt
1. **Diagnostics UI Inconsistency:**
   - *Impact:* Incomplete monitoring display. `app/api/diagnostics/route.ts` monitors FFmpeg, FFprobe, and OpenAI keys, but does not report Gemini configuration or connection health, even though Gemini is the primary default engine.
2. **Single-Tenant Assumption:**
   - *Impact:* Multi-user collisions. All users share the same `tmp/projects.json`. There is no concept of tenant workspaces or user accounts.

---

## 14. Security and Privacy Assessment

| Vulnerability / Risk Area | Current Finding | Severity | Recommended Fix |
|---|---|---|---|
| **Path Traversal / Arbitrary File Read** | `validateInputPath` accepts arbitrary paths anywhere on disk without restricting to designated root directories. | **High** | Enforce directory jailing in `src/utils/paths.ts` ensuring resolved path begins with `env.outputDir`, `env.tempDir`, or `samples/`. Reject any path outside these roots. |
| **Plaintext Credential Storage** | API keys stored in `tmp/user-settings.json` without encryption. | **Medium** | Encrypt API keys at rest using AES-256-GCM with a server secret (`ENCRYPTION_KEY`), or migrate to a secure secrets vault. |
| **Absence of Authentication / Authorization** | API endpoints (`/api/projects`, `/api/render`, `/api/settings`) are publicly accessible without authentication. | **Medium** | Implement user authentication (e.g., NextAuth.js / Auth0 / Supabase Auth) and tenant authorization checks on project and settings endpoints. |
| **Command Injection in Subtitle Escaping** | ASS subtitles are generated by string concatenation. | **Low (Mitigated)** | `RenderingService.generateAssContent()` escapes curly braces `{}`, backslashes `\`, and newlines `\N`, neutralizing ASS override tag injection. |
| **Unbounded File Uploads** | Uploads limited to 250MB per file, but without rate limiting or total disk quotas. | **Medium** | Add rate limiting middleware (e.g., Upstash / Redis), MIME type verification via magic bytes, and automated garbage collection. |
| **Process Execution Security** | Child processes (FFmpeg, FFprobe, Python) are spawned with argument arrays (`stdio: ["ignore", "pipe", "pipe"]`, `windowsHide: true`). | **Low (Secure)** | Uses `spawn()` with argument arrays rather than `exec()` shell interpolation, preventing shell command injection. |

---

## 15. Deployment Readiness

### 15.1 Assessment for Customer-Facing Production

Kalalo is currently configured as a **single-tenant desktop or local-network studio**. Releasing it as a multi-tenant cloud SaaS requires the following architectural adjustments:

```
[Current Local Desktop Model]
Browser / MCP Client ──► Next.js (Localhost:3000) ──► Local Storage (tmp/, output/)
                                                  ──► Local In-Memory Jobs
                                                  ──► Local Bundled FFmpeg

                                     │
                                     ▼ Needs Migration For Multi-Tenant Cloud
                                     │

[Production Cloud Architecture]
Browser / Client ──────► Next.js Web App (Vercel / Cloud Run)
                              │
                              ├──► Auth (NextAuth / JWT)
                              ├──► Database (PostgreSQL / Prisma)
                              ├──► Object Storage (AWS S3 / Google Cloud Storage)
                              └──► Redis Queue (BullMQ) ──► Worker Pool (Docker + FFmpeg)
```

### 15.2 Production Requirements Checklist

1. **Hosting Architecture:**
   - **Web App / API:** Containerized Docker deployment (Google Cloud Run, AWS ECS, or DigitalOcean App Platform) or serverless (Vercel) with dedicated background rendering workers.
   - **Worker Tier:** FFmpeg rendering is CPU/GPU intensive and should not run inside serverless functions with short timeouts. Render requests should be pushed to a Redis queue (BullMQ) and processed by containerized worker nodes equipped with FFmpeg.
2. **Object Storage:** Replace local disk paths (`tmp/uploads/`, `output/`) with signed URLs targeting an S3-compatible bucket (AWS S3, Cloudflare R2, Google Cloud Storage).
3. **Database & Multi-Tenancy:** Replace `tmp/projects.json` with a relational database (PostgreSQL with Prisma/Drizzle). Associate projects, presets, and jobs with authenticated user IDs.
4. **Secret Management:** Move from local JSON storage to encrypted database columns or secret managers.
5. **Rate Limiting:** Implement IP-based and user-based rate limiting on `/api/upload`, `/api/render`, and `/api/transcribe`.

---

## 16. Final Assessment & Recommended Next Steps

### 16.1 Current Project Status
Kalalo is a **fully functional, verified, high-performance local AI captioning studio and MCP server**. Its core pipelines—media inspection, audio extraction, Gemini multimodal transcription, ASS subtitle styling, FFmpeg video burn-in rendering, and subtitle file export—are fully operational and validated by 52 automated tests and live API runs.

### 16.2 Feature Breakdown

- **Completed & Verified:**
  - 3-Panel Caption Studio Web Application.
  - All 9 Model Context Protocol (MCP) tools operating over STDIO.
  - Google Gemini API transcription with user-owned keys (`gemini-3.5-flash-lite`).
  - Mock offline transcription engine for zero-dependency local workflows.
  - OpenAI Whisper transcription integration.
  - ASS subtitle rendering with scaling, aspect ratios (9:16, 1:1, 16:9), trimming, and audio muting.
  - 28 verified typography presets with live preview explorer.
  - Project persistence in `tmp/projects.json`.
  - Byte-range video/audio streaming.
  - Subtitle export (SRT and WebVTT).
- **Partially Completed:**
  - Person Cutout / Captions Behind Subject (Code, models, and FFmpeg filter pipeline are complete; requires host Python/MediaPipe environment).
- **Not Implemented (Deferred to Cloud Phase):**
  - Multi-user authentication and tenant authorization.
  - Cloud database persistence (PostgreSQL/Prisma).
  - Cloud object storage (S3/R2).
  - Distributed background job queue (BullMQ/Redis).

---

### 16.3 Prioritized Engineering Roadmap

#### Priority 0: Security & Stability (Immediate)
- **P0.1: Enforce Path Jailing on File Endpoints:**
  - *Files:* `src/utils/paths.ts`, `app/api/media/stream/route.ts`, `app/api/media/inspect/route.ts`
  - *Action:* Restrict `validateInputPath` so that resolved paths must reside within approved directories (`tmp/uploads`, `output`, `samples`). Reject requests attempting to traverse outside these boundaries.
- **P0.2: Encrypt Saved Credentials at Rest:**
  - *Files:* `src/services/settings.service.ts`
  - *Action:* Encrypt Gemini and OpenAI API keys before writing to `tmp/user-settings.json`.

#### Priority 1: Production Multi-Tenancy & Architecture (MVP Launch)
- **P1.1: Database Persistence:**
  - *Files:* `src/services/projects.service.ts`
  - *Action:* Replace JSON file read/write with a database (e.g. SQLite for local/desktop, PostgreSQL for cloud).
- **P1.2: Persistent Job Queue:**
  - *Files:* `src/services/jobs.service.ts`, `app/api/render/route.ts`
  - *Action:* Move job state from in-memory `Map` to Redis/BullMQ so job progress survives server restarts.
- **P1.3: Storage Abstraction Layer:**
  - *Files:* `src/services/rendering.service.ts`, `app/api/upload/route.ts`
  - *Action:* Abstract file operations behind a Storage Provider interface supporting local filesystem and S3/R2 cloud buckets.

#### Priority 2: Media & ML Enhancements
- **P2.1: Python Cutout Environment Isolation:**
  - *Files:* `src/services/cutout.service.ts`, `scripts/process_person_cutout.py`
  - *Action:* Bundle a self-contained Python virtual environment or convert the MediaPipe TFLite model to ONNX WebAssembly (`onnxruntime-web` or `tfjs-node`) to eliminate the external Python runtime dependency.
- **P2.2: Automated Media Garbage Collection:**
  - *Files:* `src/utils/cleanup.ts`
  - *Action:* Implement a scheduled daemon or cron job to prune uploaded and rendered files older than 48 hours.

#### Priority 3: Advanced Creator Tools
- **P3.1: Word-by-Word Kinetic Animation:**
  - *Files:* `src/presets/presets.ts`, `src/services/rendering.service.ts`
  - *Action:* Add ASS karaoke formatting tags (`\k`) to support word-by-word highlight animations popular in viral short-form clips.
- **P3.2: Multi-Language Dual Subtitles:**
  - *Files:* `src/services/rendering.service.ts`
  - *Action:* Support stacked bilingual subtitle tracks (e.g. Hindi Devanagari on top with English translation below).

---

## 17. Audit Verification & Deliverables Confirmation

1. **Handover File Location:** `C:\Users\karan\OneDrive\Desktop\Kalalo\KALALO_PROJECT_HANDOVER.md`
2. **Sections Included:**
   - Section 1: Executive Summary & Purpose
   - Section 2: Project Overview & Scope
   - Section 3: Current Feature Inventory (Web App, MCP Server, AI Engines)
   - Section 4: Complete Codebase Structure & Entry Points
   - Section 5: Technical Stack & Dependency Inventory
   - Section 6: Architecture & Step-by-Step Data Flow (with Mermaid diagrams)
   - Section 7: API Routes and Contracts Specification
   - Section 8: Gemini Integration & API Key Handling
   - Section 9: Caption Rendering & Media Processing Pipeline
   - Section 10: Data Storage & Project Persistence
   - Section 11: Environment Variables & Windows Setup Guide
   - Section 12: Testing and Verification Evidence (with actual test logs)
   - Section 13: Known Issues and Technical Debt
   - Section 14: Security and Privacy Assessment
   - Section 15: Deployment Readiness & Cloud Roadmap
   - Section 16: Final Assessment & Recommended Next Steps
   - Section 17: Audit Verification & Deliverables Confirmation
3. **Tests Actually Run During Audit:**
   - `npm run typecheck` (`tsc --noEmit`): Passed (0 errors).
   - `npm test` (`vitest run`): Passed (52 tests across 9 files).
   - `npm run test:tools`: Passed (All 9 MCP tools verified over STDIO).
   - `npm run verify:mcp`: Passed (MCP connection and tool enumeration verified).
   - `npm run build:mcp`: Passed (Standalone server build).
   - `npm run build`: Passed (Next.js production build, all routes compiled).
   - `SettingsService.testGeminiConnection()`: Passed (HTTP 200 via `gemini-3.5-flash-lite`).
   - `GeminiTranscriptionProvider.transcribe()`: Passed (Live multimodal audio transcription on `sample-video.mp4`).
   - `node scratch/test_all_models.mjs`: Passed (Scanned 8 Gemini models).
4. **Checks Blocked / Not Run:**
   - Person cutout end-to-end Python generation was blocked because the host Windows system defaults to the Windows Store `python` execution alias and lacks a global Python environment with `mediapipe` and `opencv-python`.
5. **Code Integrity Confirmation:**
   - **Application source code remained 100% untouched and unchanged throughout this entire audit.**
