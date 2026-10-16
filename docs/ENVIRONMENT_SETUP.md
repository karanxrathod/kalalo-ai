# Kalalo AI — Environment Setup & Configuration Guide

This guide details all environment variables used by the **Kalalo AI** application, their exact configuration names, and how to safely validate them in staging and production environments without exposing secret values.

---

## 1. Environment Variable Reference

| Variable Name | Required | Target Environments | Purpose & Source |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | **Yes** | Client & Server | Supabase project URL (`https://<project-ref>.supabase.co`). Found in Supabase Dashboard -> Project Settings -> API. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **Yes** | Client & Server | Public Supabase Anonymous Key for client-side Auth and RLS-enforced queries. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Server-side Only | Elevated Supabase admin key for server-side user provisioning and storage management. **NEVER expose to the client.** |
| `GEMINI_API_KEY` | **Yes** | Server-side Only | Google AI Studio API key for Gemini speech-to-text audio transcription. |
| `JWT_SECRET` | Optional | Server-side Only | Random 32+ character string used to sign session JWTs. Falls back to deterministic hash if omitted. |
| `KALALO_SECRET_KEY` | Optional | Server-side Only | 32+ byte string used for AES-256-GCM encryption of user-supplied API keys at rest. |
| `KALALO_GEMINI_MODEL` | Optional | Server-side Only | Default Gemini model identifier (e.g. `gemini-1.5-flash`, `gemini-2.0-flash`). Defaults to `gemini-1.5-flash`. |
| `PRODUCTION_URL` | Optional | Test Scripts | Canonical URL used by synthetic verification scripts (defaults to `https://kalalo-ai.vercel.app`). |

---

## 2. Where to Configure Variables

### In Local Development
Create `.env.local` in the project root (this file is excluded from Git in `.gitignore`):
```env
NEXT_PUBLIC_SUPABASE_URL=https://khxvrjnbikwgggykhbpk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
GEMINI_API_KEY=AIzaSy...
JWT_SECRET=your-random-32-character-secret-key-here
KALALO_SECRET_KEY=your-32-character-aes-master-key-here
KALALO_GEMINI_MODEL=gemini-1.5-flash
```

### In Vercel Production
1. Navigate to your project in the **Vercel Dashboard**.
2. Go to **Settings** -> **Environment Variables**.
3. Add each variable listed above for the **Production**, **Preview**, and **Development** environments.
4. Redeploy to apply changes to serverless instances.

---

## 3. Safe Validation Without Exposing Secrets

Never print raw environment variables to logs, terminal output, or client bundles. Validate configuration safely using these commands:

### Method 1: Local Diagnostics Validation
```bash
npm run verify:supabase
```
This script checks database connectivity, verifies that keys can sign and query tables, and tests storage access without printing secret values.

### Method 2: Query Live Production Diagnostics API
```bash
curl -s https://kalalo-ai.vercel.app/api/diagnostics | jq .vercelEnvironment
```
Output safely indicates `"status": "CONFIGURED"` or `"status": "MISSING"` for each variable without returning the secret payload.

### Method 3: TypeScript Type & Config Check
```bash
npm run typecheck
```
Ensures that all environment variables accessed through `src/config/env.ts` match Zod schema expectations.
