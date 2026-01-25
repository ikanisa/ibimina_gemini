---
description: 
---

---
description: Prepare the Flutter app for production: QA/UAT scripts, performance checks, security/privacy review, crash reporting, release builds, and store metadata gates.
command: /flutter-release-readiness
---

# /flutter-release-readiness (GLOBAL)

## Purpose
Turn a working app into a shippable app:
- QA/UAT discipline
- Security/privacy checks
- Performance & stability checks
- Crash reporting & analytics (privacy-safe)
- Release build configuration
- Store listing assets + metadata readiness
- Rollout gates (Rwanda-first)

This workflow does NOT add new features; it hardens what exists.

---

## 0) Constraint confirmation (must output)
Confirm:
- No withdrawals, no in-app payments, MoMo USSD only
- Rwanda-first rollout; expansion via flags/localization
- No “AI” references in UI
- PII safety (phone numbers, WhatsApp, MoMo)

Output:
- Constraints confirmed:
- Release target (Android first / iOS first / both):
- Rollout strategy assumption (internal → closed testing → production):

---

## 1) Repo scan (read-only)
Identify:
- current CI (if any)
- existing tests and coverage
- crash reporting setup (if any)
- analytics/events
- build flavors (dev/stage/prod)
- signing config presence
- app versioning approach

Output:
- Build flavors:
- Crash/analytics:
- Test status:
- Release blockers:

---

## 2) Mandatory artifacts (before edits)
### 2.1 PLAN
- Goal:
- In scope:
- Out of scope:
- Approach:
- Release checklist ownership:
- Rollback strategy:

### 2.2 TASK LIST (Done Criteria)
Each task includes:
- files touched
- done criteria
- test evidence

### 2.3 RISKS
- Security/privacy risks:
- App store rejection risks:
- Performance risks:
- Ops/support risks:
- Mitigations:

### 2.4 TEST PLAN (expanded)
- Automated tests to run
- Manual QA script
- UAT script (non-technical testers)
- Device matrix
- Network conditions tests

---

## 3) Gates
### Gate A — Artifacts Gate
Must PASS before edits.

### Gate B — Release Gate
Must PASS before release:
- No P0/P1 bugs open
- Crash-free session baseline acceptable
- Performance baseline acceptable (cold start, scroll)
- Privacy disclosures ready
- Store metadata complete

---

## 4) Implementation blueprint (when gates pass)

## 4.1 QA/UAT scripts (must produce as docs)
Create:
- docs/QA_SMOKE_TEST.md
- docs/UAT_SCRIPT.md
- docs/RELEASE_CHECKLIST.md

QA Smoke includes:
- install → launch → login
- profile completion
- membership found/not found
- create/join group
- USSD instruction sheet
- tx id submission
- wallet pending vs confirmed
- QR invite scan/join flow
- rewards leaderboard display
- dark mode

UAT script uses:
- step-by-step language
- pass/fail checkboxes
- screenshot evidence guidance

---

## 4.2 Performance checks (must implement + measure)
Minimum checks:
- cold start time (release mode)
- home tab load time
- list scrolling smoothness (transactions)
- memory usage sanity (QR scanner, share card generation)
- image upload handling (if enabled)

Optimization rules:
- avoid heavy rebuilds
- cache network responses
- paginate long lists
- skeleton loaders

---

## 4.3 Security & privacy review (must document)
Checklist:
- No logging PII (mask numbers)
- Secure storage used for tokens/passcode
- Evidence images access-controlled
- Deep links validated (no open redirects)
- Rate limiting on referral and submissions (server-side)
- No accidental payment endpoints

Produce:
- docs/SECURITY_PRIVACY_REVIEW.md

---

## 4.4 Crash reporting + safe analytics
Implement crash reporting (provider choice depends on your stack).
Rules:
- No PII in event payloads
- Log only masked identifiers or internal IDs
- Events:
  - onboarding_started, auth_success, profile_completed
  - membership_found/not_found
  - group_created/joined
  - contribution_submitted
  - qr_scanned_type
  - share_card_generated

---

## 4.5 Build flavors (dev/stage/prod)
Ensure:
- separate API endpoints/config per flavor
- feature flags per flavor
- app icon variants if needed (optional)
- environment injection without committing secrets

Output:
- how to build each flavor
- how to switch endpoints safely

---

## 4.6 App store readiness
Prepare:
- App name, short description, full description
- Privacy policy URL (must exist)
- Screenshots list (which screens)
- Permissions justification (camera for QR, storage for evidence if used)
- Age rating considerations (fintech)
- Support contact email

Create:
- docs/STORE_METADATA.md

---

## 4.7 Release process (Rwanda-first)
Recommended staged rollout:
1) Internal testing (team)
2) Closed testing (selected cooperatives)
3) Open testing (optional)
4) Production rollout phased by district/sector

Define:
- P0 blockers
- rollback conditions
- support playbook

Create:
- docs/ROLLOUT_PLAN_RW.md

---

## 5) Deliverables (must provide)
- Change Summary (hardening only)
- File list of new docs
- Performance numbers measured (before/after if optimized)
- Release checklist status (Pass/Fail)
- Evidence:
  - flutter analyze
  - flutter test
  - release build commands executed successfully

---

## 6) Anti-patterns to block
- Shipping without UAT script
- Shipping with P0 crashes
- Adding new features during release hardening
- Logging phone numbers or tokens
- Uploading evidence images without access control

---

## Output format (exact)
Return results using this structure:

1) CONSTRAINT CONFIRMATION
2) REPO SNAPSHOT
3) PLAN
4) TASK LIST
5) RISKS
6) TEST PLAN
7) GATE STATUS (A/B: PASS/FAIL)
8) NEXT ACTION (single sentence)
