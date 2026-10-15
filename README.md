# Kalalo AI — Video Captioning Studio & MCP Server

AI-powered video captioning and editing platform with automatic transcription, editable subtitles, customizable caption styles, and FFmpeg-based video rendering.

Kalalo is engineered for short-form and long-form video creators who need accurate subtitles for Hinglish, Hindi, and English content, styled with viral creator presets and rendered directly into high-quality MP4 videos. It operates both as a modern web application and as a Model Context Protocol (MCP) server for AI assistants like Claude Desktop, Cursor, and Google Antigravity.

---

## Features Actually Implemented

### 1. Multilingual Speech-to-Text Transcription
- **Google Gemini REST Integration:** Uses official Google Generative Language API (`v1beta`) with `gemini-3.5-flash-lite` (or custom models).
- **Hinglish, Hindi & English First:** Preserves Devanagari script (`हिंदी`), colloquial mixed Hinglish, and standard English words without phonetic degradation.
- **Timestamped Segments:** Automatically extracts start and end timestamps at high precision.
- **Deterministic Mock Provider:** Built-in offline testing provider for instant, zero-cost development and testing.
- **OpenAI Whisper Support:** Alternate provider supporting standard Whisper transcription.

### 2. Interactive Caption Studio & Timeline Editor
- **Editable Segments:** Edit caption text, adjust start/end timestamps, add new segments, delete segments, and re-order.
- **Split & Merge:** Split long captions into punchy phrases or merge adjacent lines.
- **Timeline Synchronization:** Subtitles render on top of the live video player with frame-accurate timing.
- **Canvas Drag & Positioning:** Position captions vertically or horizontally using direct drag or X/Y controls.
- **Aspect Ratio Switching:** Live preview in 9:16 vertical (Reels/TikTok/Shorts), 1:1 square, and 16:9 widescreen formats.

### 3. Typography Presets & Custom Styling
- **28 Original Typography Styles:** Includes `kalalo-clean-bold`, `kalalo-cinema`, `kalalo-pop-highlight`, `kalalo-editorial`, `kalalo-devanagari-clear`, `kalalo-creator-classic`, `kalalo-neon-outline`, `kalalo-marathi-readable`, `kalalo-high-contrast`, `kalalo-minimal-lower-third`, and 18 additional styles.
- **Granular Customization:** Font family, font size, primary color, secondary highlight color, outline width/color, drop shadow offset/blur, and vertical margin adjustments.
- **ASS Subtitle Formatting:** Generates Advanced SubStation Alpha (`.ass`) style blocks compatible with FFmpeg.

### 4. Person Cutout & Layered Rendering ("Captions Behind Speaker")
- **3-Layer Compositing:** Renders captions between the background video and the foreground speaker silhouette:
  1. *Layer 1 (Bottom):* Original video background.
  2. *Layer 2 (Middle):* Styled caption subtitles.
  3. *Layer 3 (Top):* Foreground person extracted with alpha channel via MediaPipe & OpenCV.
- **Reliable Fallback:** Seamlessly falls back to crisp normal burn-in rendering if cutout is toggled off or unavailable.

### 5. Standards Subtitle Export & FFmpeg Video Rendering
- **Subtitle Exports:** Export clean, standards-compliant SRT and WebVTT (`.vtt`) files with copy-to-clipboard and file downloads.
- **FFmpeg Video Burn-In:** Encodes styled subtitles directly into H.264/AAC MP4 video with real-time job progress tracking (0–100%) and instant browser preview & download.

### 6. Authentication & Multi-Tenant Isolation
- **Secure Sessions:** Stateless HS256 JWT tokens with HTTP-only cookies (`kalalo_session`) and optional Authorization Bearer headers.
- **Password Security:** Salted `bcryptjs` hashing.
- **Per-User Isolation:** Each user's projects, media files, and settings are strictly isolated.
- **Encrypted Credentials at Rest:** User Gemini API keys are encrypted with AES-256-GCM.
- **Onboarding Demo:** New accounts automatically receive a pre-configured sample walkthrough project.

### 7. Model Context Protocol (MCP) Server
- **9 Canonical Tools:** Exposes STDIO JSON-RPC tools for AI developer agents:
  1. `kalalo_inspect_media`: Inspect media streams, duration, and codecs using FFprobe.
  2. `kalalo_transcribe_media`: Speech-to-text with Gemini, OpenAI, or Mock.
  3. `kalalo_validate_segments`: Validate timing monotonicity, overlap, and durations.
  4. `kalalo_list_presets`: Query typography presets with filtering.
  5. `kalalo_export_subtitles`: Generate SRT and WebVTT files.
  6. `kalalo_render_captions`: Execute FFmpeg burn-in video rendering.
  7. `kalalo_get_job_status`: Track background rendering progress.
  8. `kalalo_list_jobs`: List background jobs.
  9. `kalalo_cancel_job`: Propagate cancellation signals to child processes.

---

## Technology Stack

- **Frontend & App Framework:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons.
- **Speech Recognition:** Google Gemini REST API (`v1beta`), Node.js native fetch.
- **Media Processing:** FFmpeg, FFprobe (`@ffmpeg-installer/ffmpeg`, `@ffprobe-installer/ffprobe`).
- **Computer Vision / Segmentation:** Python 3.11, Google MediaPipe (`selfie_segmenter.tflite`), OpenCV (`opencv-python`), NumPy.
- **Security & Data:** AES-256-GCM authenticated encryption, `bcryptjs`, `jose` JWT, atomic JSON database with tenant scoping.
- **MCP Integration:** `@modelcontextprotocol/sdk` (STDIO transport).
- **Testing:** Vitest, custom automated E2E test suites with real media.

---

## Local Development Instructions

### Prerequisites
- Node.js 18+ (Node.js 20 or 22 recommended)
- Python 3.11 with MediaPipe and OpenCV (required for person cutout feature):
  ```bash
  # Using uv or pip in project root:
  python -m venv .venv
  .venv\Scripts\activate    # Windows
  # source .venv/bin/activate # macOS/Linux
  pip install mediapipe opencv-python numpy
  ```

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/karanxrathod/kalalo-ai.git
   cd kalalo-ai
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   Add your Gemini API key (or configure it in the web UI at `/settings`):
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   JWT_SECRET=your_random_256_bit_secret
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Tests and Build Commands

```bash
# Type check all TypeScript files
npm run typecheck

# Run unit and integration tests (Vitest)
npm test

# Run MCP tools validation test suite (all 9 tools)
npm run test:tools

# Verify MCP server STDIO connection
npm run verify:mcp

# Build MCP server standalone distribution
npm run build:mcp

# Build Next.js production web application
npm run build

# Run comprehensive end-to-end media and Gemini test
node scripts/e2e-workflow-test.mjs
```

---

## MCP Server Setup

To connect Kalalo to an MCP client such as Claude Desktop or Cursor, build the MCP server:

```bash
npm run build:mcp
```

Add the server to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "kalalo": {
      "command": "node",
      "args": ["C:/path/to/kalalo-ai/dist/index.js"],
      "env": {
        "GEMINI_API_KEY": "your_gemini_api_key_here",
        "KALALO_STT_PROVIDER": "gemini"
      }
    }
  }
}
```

---

## Vercel Import and Deployment Guide

### Importing to Vercel
1. Log in to [Vercel](https://vercel.com).
2. Click **Add New** → **Project**.
3. Import `karanxrathod/kalalo-ai` from GitHub.
4. Keep the default settings:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** `./`
   - **Build Command:** `npm run build`
   - **Install Command:** `npm install`
5. Configure Environment Variables in Vercel Project Settings:
   - `JWT_SECRET`: Random 32+ character string for secure session signing.
   - `GEMINI_API_KEY`: Default Google Gemini API key (fallback if users haven't configured their own).
   - `KALALO_STT_PROVIDER`: Set to `gemini`.
   - `KALALO_GEMINI_MODEL`: Set to `gemini-3.5-flash-lite`.
6. Click **Deploy**.

---

## Architecture & Differences: Vercel vs. Dedicated Worker

When deployed on Vercel Serverless:
1. **Frontend, Editor, Authentication & Presets:** Work 100% identically to local. Users can sign up, log in, preview sample projects, customize typography, drag captions, export SRT/VTT, and manage settings.
2. **AI Speech Transcription:** Works directly on Vercel because it communicates over HTTPS with the Google Gemini API.
3. **Serverless Limitations to Note:**
   - **Serverless Execution Timeouts:** Vercel Hobby accounts enforce a 10-second limit; Vercel Pro allows up to 60–300 seconds. Longer videos (e.g. >60s) undergoing video encoding may exceed serverless execution limits.
   - **Payload Limits:** Vercel limits incoming request bodies to 4.5MB. Direct upload of large video files (>4.5MB) through the serverless `/api/upload` endpoint will fail on Vercel without direct-to-cloud S3/R2 presigned upload URLs.
   - **Ephemeral Storage (`/tmp`):** In serverless execution, only `/tmp` is writable. Rendered videos and local JSON databases are ephemeral and do not persist across multiple cold starts.
   - **Person Cutout on Vercel:** MediaPipe and OpenCV require a Python runtime. Vercel Node.js serverless functions do not provide Python with native C-extensions.
4. **Recommended Production Architecture for Video Rendering:**
   - Deploy the web UI on Vercel.
   - For high-volume or long-duration video rendering and Python person cutout, run a background worker on Docker, Railway, Render, Fly.io, or an AWS EC2 / DigitalOcean droplet, or connect to an S3/Cloudflare R2 bucket for persistent storage.

---

## Environment Variables Reference

| Variable | Description | Default | Required for Vercel |
|---|---|---|---|
| `GEMINI_API_KEY` | Google Gemini API key for speech-to-text | None | Recommended |
| `JWT_SECRET` | Secret key for signing user session tokens | Auto-generated in dev | **Required in Prod** |
| `KALALO_SECRET_KEY` | Master key for encrypting user credentials at rest | Auto-generated in dev | Recommended |
| `KALALO_STT_PROVIDER` | STT engine (`gemini`, `openai`, `mock`) | `gemini` | Optional |
| `KALALO_GEMINI_MODEL` | Gemini model identifier | `gemini-3.5-flash-lite` | Optional |
| `KALALO_OUTPUT_DIR` | Output directory for renders and subtitles | `./output` | Optional |
| `KALALO_TEMP_DIR` | Temporary processing directory | `./tmp` | Optional |
| `KALALO_PYTHON_PATH` | Path to Python 3.11 executable for MediaPipe | Auto-detected | Local / Worker only |

---

## Known Limitations

1. **Vercel Request Body Limit (4.5MB):** Large video uploads require direct S3/R2 presigned upload architecture in high-scale cloud production.
2. **Serverless Ephemeral Storage:** The atomic JSON database resets across cold starts on serverless hosts without a persistent database like PostgreSQL/Supabase.
3. **Person Cutout Runtime:** Requires Python with MediaPipe; operates on local machines and dedicated Docker/VM hosts.
