# Kalalo AI — Release Checklist & Quality Gate

This document defines the mandatory pre-release and post-deployment checklist that must be executed for every production release of **Kalalo AI**.

---

## 1. Pre-Deployment Quality Gates (Local / CI)

All pre-deployment checks must pass with exit code `0` before pushing to `main`:

```bash
# 1. Typecheck: Zero TypeScript errors
npm run typecheck

# 2. Automated Tests: All Vitest suites passing
npm test

# 3. Supabase Integration Audit: Local connection & RLS test
npm run verify:supabase

# 4. Production Build: Next.js clean compilation
npm run build
```

### Git & Secrets Audit
- [ ] No uncommitted files or dirty git status (`git status`).
- [ ] No `.env`, `.env.local`, or plain-text credentials in staged files (`git diff --staged`).
- [ ] Meaningful commit message following conventional commits format (`fix: ...`, `feat: ...`, `security: ...`).

---

## 2. Deployment Execution

```bash
git push origin main
```
- [ ] Monitor the deployment in the **Vercel Dashboard**.
- [ ] Confirm the deployment completes successfully without build errors.
- [ ] Record the deployment commit hash and timestamp.

---

## 3. Post-Deployment Production Verification

Run the automated live production suite immediately after deployment:

```bash
# Run synthetic verification against live production URL
node scripts/verify-production-backend.mjs
```

Verify that all 9 steps pass:
- [x] Step 1: User Registration
- [x] Step 2: Session Restoration (`/api/auth/me`)
- [x] Step 3: Profile Update Persistence
- [x] Step 4: Remote Project Creation & Storage Link
- [x] Step 5: Caption Edit & Project Save Persistence
- [x] Step 6: SRT & WebVTT Subtitle Exports
- [x] Step 7: Multi-Tenant Isolation (Cross-tenant read/delete blocked)
- [x] Step 8: Private Media Streaming Authorization (HTTP 401 unauthenticated, 404/403 cross-tenant)
- [x] Step 9: Teardown & Cleanup of Test Project

### Visual / Browser Spot Check
- [x] Open `https://kalalo-ai.vercel.app/login` in browser.
- [x] Sign in and verify Dashboard loads existing projects.
- [x] Open Editor, verify video playback, and confirm caption timeline synchronization.
- [x] Test Subtitle Export modal (SRT and VTT formats).
- [x] Sign out and confirm redirect to `/login`.

---

## 4. Release Decision Matrix

- **READY:** All pre-deployment and post-deployment checks pass with evidence.
- **NOT READY:** Any regression in core flows (auth, transcription, editor saving, exports).
- **BLOCKED:** Unresolved external dependencies (e.g. missing Google Cloud OAuth credentials for Google Login, or external worker container for server-side MP4 burning).
