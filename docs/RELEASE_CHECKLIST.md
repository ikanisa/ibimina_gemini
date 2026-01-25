# Release Checklist (Production)

**Version:** ________________
**Date:** ________________

## 1. Pre-Build Gates
- [ ] **Git:** Branch merged to `main`. Tag created (e.g., `v1.0.0`).
- [ ] **Tests:** `flutter test` passed (100%).
- [ ] **Lint:** `flutter analyze` passed (0 errors).
- [ ] **Version:** `pubspec.yaml` version bumped.

## 2. Configuration & Secrets
- [ ] **Env:** Production `.env` or secrets injected in CI.
- [ ] **Keys:** Release keystore (`.jks`) verified and available.
- [ ] **Sentry:** DSN set for production.
- [ ] **Supabase:** Pointing to PROD project (not local/staging).

## 3. Build
- [ ] Command: `flutter build apk --flavor prod --release`
- [ ] Command: `flutter build appbundle --flavor prod --release` (for Play Store)

## 4. Verification (The "Don't Get Fired" Checks)
- [ ] **Install:** Install the *actual* release APK on a physical device.
- [ ] **Smoke Test:** Run `docs/QA_SMOKE_TEST.md`.
- [ ] **Upgrade:** Install OVER the previous version. Does it keep data (if valid)?
- [ ] **Crash:** Trigger a safe exception (if enabled) -> Check Sentry dashboard.

## 5. Store Assets
- [ ] **Screenshots:** high-res, up-to-date, no debug banners.
- [ ] **Text:** "What's New" updated.
- [ ] **Privacy:** URL is active.

## 6. Rollout
- [ ] Upload to Play Console (Closed Testing / Internal Track first).
- [ ] Promote to Production (Staged Rollout: 20%).
- [ ] Monitor Sentry for 24h.
