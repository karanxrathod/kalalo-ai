# Kalalo AI — Production Incident Response Plan

This document outlines the standard operating procedures for detecting, triaging, containing, resolving, and documenting production incidents affecting **Kalalo AI**.

---

## 1. Incident Severity Levels

| Severity | Definition | Target Response Time | Examples |
|---|---|---|---|
| **P1 — Critical** | Total outage, data breach, cross-tenant leak, or private media exposed publicly. | Immediate (< 15 mins) | Application down, unauthorized access to user media, database corruption. |
| **P2 — High** | Core feature broken for all users, but site is reachable. | < 1 hour | Gemini transcription failing globally, video uploads rejected, exports broken. |
| **P3 — Medium** | Partial degradation, workaround available. | < 4 hours | Specific video format failing, UI alignment glitch on mobile, preset style rendering error. |
| **P4 — Low** | Minor cosmetic issue, non-critical defect. | Next release cycle | Minor typography issue, typo in settings page description. |

---

## 2. Incident Response Workflow

```
[Detect / Alert] -> [Triage & Severity] -> [Containment] -> [Investigation & Fix] -> [Verification] -> [Post-Mortem]
```

### Phase 1: Detection & Triage
1. Check live status:
   ```bash
   curl -sI https://kalalo-ai.vercel.app/
   curl -s https://kalalo-ai.vercel.app/api/diagnostics | jq .
   ```
2. Run automated verification suite to pinpoint failing subsystem:
   ```bash
   node scripts/verify-production-backend.mjs
   ```

### Phase 2: Containment
- **If private media is exposed or compromised:**
  1. Verify the Supabase bucket configuration: ensure `kalalo-media` bucket is set to `public: false`.
  2. If an API key or service-role token was exposed, immediately execute the **Credential Rotation Protocol** below.
- **If a bad deployment broke production:**
  1. In the Vercel Dashboard, go to **Deployments**.
  2. Locate the previous verified healthy deployment (e.g. commit `6ed75ad`) and click **Instant Rollback**.

### Phase 3: Investigation & Hotfix Development
1. Reproduce the defect locally:
   ```bash
   npm run dev
   npm test
   ```
2. Implement a targeted fix on branch `main`.
3. Validate locally:
   ```bash
   npm run typecheck
   npm test
   ```

### Phase 4: Deployment & Verification
1. Commit with descriptive prefix (`fix: ...` or `security: ...`):
   ```bash
   git add <files>
   git commit -m "fix(prod): describe issue and resolution"
   git push origin main
   ```
2. Wait for Vercel deployment to finish.
3. Run the live verification suite against production:
   ```bash
   node scripts/verify-production-backend.mjs
   ```

---

## 3. Credential Rotation Protocol

If any production credential is leaked or suspected of being compromised:

### 1. Rotating Google Gemini API Key
1. Go to **Google AI Studio** -> **Get API key**.
2. Click **Create API key** or delete the compromised key.
3. Copy the new key and update `GEMINI_API_KEY` in **Vercel Project Settings -> Environment Variables**.
4. Redeploy the application.
5. Verify with `curl -s https://kalalo-ai.vercel.app/api/diagnostics | jq .services.gemini`.

### 2. Rotating Supabase Service Role Key
1. Open the **Supabase Dashboard** -> **Project Settings** -> **API**.
2. Under **Project API keys**, select **Rotate secret key** for the `service_role` key.
3. Update `SUPABASE_SERVICE_ROLE_KEY` in **Vercel Project Settings**.
4. Redeploy the application.
5. Run `npm run verify:supabase` to verify the new key.

### 3. Rotating JWT Session Secret
1. Generate a new 32-character random string.
2. Update `JWT_SECRET` in Vercel Project Settings.
3. Redeploy. Existing user sessions will be invalidated and prompted to log in again.
