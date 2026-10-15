# Kalalo Local Testing Guide (Windows)

This document provides beginner-friendly, step-by-step instructions for testing and using both the **Kalalo Web Studio Application** and the **Kalalo MCP Server** locally on your Windows PC.

---

## 1. Quick Start: The Kalalo Web Application

Kalalo includes a complete, high-performance web application designed for video creators with a dark-theme studio aesthetic inspired by the top captioning tools in the industry.

### Starting the Web Studio
The web server is currently running locally. To start it at any time:

```powershell
# In PowerShell:
npm start
```
Or for development hot-reloading:
```powershell
npm run dev
```

Open your browser to:
- **[http://localhost:3000](http://localhost:3000)** — Kalalo Public Landing Page
- **[http://localhost:3000/dashboard](http://localhost:3000/dashboard)** — Creator Dashboard & Job Monitor
- **[http://localhost:3000/create](http://localhost:3000/create)** — Project Creator (Drag-and-drop upload & One-Click Sample Media)
- **[http://localhost:3000/editor?sample=true](http://localhost:3000/editor?sample=true)** — 3-Panel Caption Studio (Instant test with verified video)
- **[http://localhost:3000/presets](http://localhost:3000/presets)** — Preset Visual Gallery with interactive live typography tester
- **[http://localhost:3000/diagnostics](http://localhost:3000/diagnostics)** — Real-time Environment Health Dashboard

---

## 2. Zero-Friction Web Studio Walkthrough

You can test the entire pipeline without uploading any file or configuring an API key:

1. **Launch the Editor Directly**:
   Visit **[http://localhost:3000/editor?sample=true](http://localhost:3000/editor?sample=true)**.
   - The verified 2.0-second test video (`samples/sample-video.mp4`) loads automatically.
   - Sample Hinglish and English captions populate instantly in the left panel.
2. **Interactive Video Player**:
   - Hit the Play button or scrub through the timeline.
   - Notice the synchronized subtitle overlay that tracks the active segment in real-time.
   - Switch aspect ratios between **9:16** (Reels/Shorts), **1:1** (Square), and **16:9** (Landscape).
   - Toggle **Safe Guides** to preview title-safe and action-safe overlay margins.
3. **Edit Captions**:
   - Edit timestamps or text in any segment card.
   - Click the **Split** icon to split a segment in two at the current video position.
   - Click the **Merge** icon to combine adjacent segments.
   - The validation badge updates dynamically in real-time.
4. **Change Styling**:
   - In the right panel, click any of the 6 original presets (**Clean Bold**, **Cinema**, **Pop Highlight**, **Editorial**, **Devanagari Clear**, **Minimal White**).
   - Switch to the **Custom Style** tab to tweak font family, font size, text color, outline width, shadow depth, and vertical margin.
5. **Export Subtitles**:
   - Click **Export** in the top bar. Choose **SubRip (.SRT)** or **WebVTT (.VTT)**.
   - Click **Copy to Clipboard** or **Download**.
6. **Burn-In Video Render (FFmpeg)**:
   - Click **Render Video** in the top bar.
   - Click **Start Render**. Real FFmpeg processes the video with ASS subtitles.
   - Once complete, watch the newly rendered video with burned-in captions right in the modal, and click **Download MP4**!

---

## 3. Quick Verification: Automated Test Suites

### 1. Run Vitest Unit & Integration Tests (45 Tests)
```powershell
npm test
```
All 45 tests across schemas, media inspection, caption validation, preset resolution, subtitle export, FFmpeg rendering, and job management run and pass.

### 2. Verify All 9 MCP Tools via STDIO Transport
```powershell
npm run test:tools
```
This launches the server over `StdioClientTransport` (simulating Claude Desktop or Antigravity) and validates:
1. `kalalo_inspect_media`
2. `kalalo_transcribe_media`
3. `kalalo_validate_segments`
4. `kalalo_list_presets`
5. `kalalo_export_subtitles`
6. `kalalo_render_captions`
7. `kalalo_get_job_status`
8. `kalalo_list_jobs`
9. `kalalo_cancel_job`

### 3. TypeScript Type-Checking
```powershell
npm run typecheck
```

### 4. Next.js Production Build
```powershell
npm run build
```

---

## 4. Connecting Kalalo to Claude Desktop, Cursor, or Antigravity

Kalalo is also a standalone MCP server that can be integrated into any MCP-compatible AI client.

### Claude Desktop Configuration
Add the following to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "kalalo": {
      "command": "node",
      "args": [
        "C:\\Users\\karan\\OneDrive\\Desktop\\Kalalo\\dist\\index.js"
      ],
      "env": {
        "KALALO_STT_PROVIDER": "mock"
      }
    }
  }
}
```

---

## 5. Configuring Google Gemini AI Transcription (User-Owned Keys)

Kalalo supports **user-owned Google Gemini API keys**, allowing creators to use their personal Google AI Studio credentials for multimodal transcription without platform markup.

### In the Web Studio:
1. Navigate to **[http://localhost:3000/settings](http://localhost:3000/settings)**.
2. In the **AI Providers & API Keys** section:
   - Enter your personal Google Gemini API Key (`AIzaSy...`).
   - Click **Save API Key** (safely stored locally on your server, masked on all reads).
   - Click **Test Connection** to verify your key against `generativelanguage.googleapis.com`.
3. Select your preferred default model (e.g. `gemini-3.5-flash-lite`).
4. In **Default Studio Preferences**, set Gemini as your default provider, or switch to it dynamically on any upload.

### Obtaining a Google Gemini API Key:
- Visit Google AI Studio: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey).
- Create or copy an API key.

---

## 6. Enabling Real OpenAI Whisper Transcription

By default, Kalalo operates in **offline mode** (`KALALO_STT_PROVIDER=mock`) with deterministic mock transcription.

To enable real speech-to-text with OpenAI Whisper:
1. Open `.env` in the project root:
   ```env
   KALALO_STT_PROVIDER=openai
   OPENAI_API_KEY=sk-proj-your-openai-api-key
   KALALO_STT_MODEL=whisper-1
   ```
2. Restart the server (`npm start` or `npm run dev`).
3. Now any uploaded video or audio will be transcribed using OpenAI Whisper!

---

## 7. 12 Verified Original Typography Presets

Kalalo includes 12 production-grade ASS caption presets:
1. **Clean Bold (`kalalo-clean-bold`)**: High-impact bold typography with a thick outline, ideal for fast-paced vertical video.
2. **Cinema (`kalalo-cinema`)**: Restrained letter-spaced typography with a soft drop shadow and classic cinematic placement.
3. **Pop Highlight (`kalalo-pop-highlight`)**: Vibrant yellow accent typography with strong readability against bright or active backgrounds.
4. **Editorial (`kalalo-editorial`)**: Refined, balanced editorial serif typography tailored for interviews and narrative storytelling.
5. **Devanagari Clear (`kalalo-devanagari-clear`)**: Optimized line heights and glyph metrics engineered specifically for clean Hindi and Marathi rendering.
6. **Minimal White (`kalalo-minimal-white`)**: Crisp modern typography with subtle border emphasis for a distraction-free look.
7. **Creator Classic (`kalalo-creator-classic`)**: Punchy yellow fill with high-contrast black stroke, universally used across viral short-form clips.
8. **News Headline (`kalalo-news-headline`)**: Upper-third banner format with bold sans typography for breaking announcements and news.
9. **Podcast Clean (`kalalo-podcast-clean`)**: Centered, balanced line breaks with generous padding for long-form conversations and podcasts.
10. **Marathi/Hindi Readable (`kalalo-marathi-readable`)**: High-legibility font weight and vertical clearance for complex conjunct characters.
11. **High-Contrast Accessibility (`kalalo-high-contrast`)**: Maximum contrast ratio with solid outline and backdrop isolation for effortless readability.
12. **Minimal Lower Third (`kalalo-minimal-lower-third`)**: Subtle, non-intrusive lower-third placement for documentaries and corporate explainers.

