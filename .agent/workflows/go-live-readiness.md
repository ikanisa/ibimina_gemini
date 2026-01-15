---
description: 
---

bash -lc 'set -euo pipefail
DIR="$HOME/.gemini/antigravity/global_workflows"
mkdir -p "$DIR"

cat > "$DIR/go-live-readiness.md" <<'"'"'EOF'"'"'
---
description: Production readiness + go-live gate for fullstack PWAs (Staff/Admin portal + optional client mobile), Supabase, Cloudflare Pages
---

# GO-LIVE READINESS WORKFLOW (Production Gate)

## Goal
Determine GO / NO-GO for production launch and produce a fix plan that eliminates launch-blocking risks.

## Inputs (confirm fast; if missing, proceed with assumptions and list them)
- App type: Staff/Admin portal OR Client-facing mobile-first OR Both
- Target environment: Preview/Staging OR Production
- URLs: preview/prod URLs (if available) or local dev URL
- Test accounts: Staff + Admin credentials (or auth method)
- Backend: Supabase project/env (dev/stage/prod) + whether RLS is enabled
- Deployment: Cloudflare Pages project name + prod branch + root/build/output

---

# Required Outputs (non-negotiable)
1) **Go-Live Verdict**: GO / NO-GO
2) **Launch Blockers (P0)** list: each with owner, fix steps, verification, rollback
3) **Release Plan**: preview verification → production promotion → monitoring
4) **Rollback Plan**: Cloudflare rollback steps + DB rollback/mitigation (if migrations)
5) **Final Walkthrough**: how to verify, risks, what changed

---

# A) Release Candidate Freeze (stop scope creep)
- Confirm release branch/commit SHA
- Confirm changelog/release notes exist (bullet list is fine)
- Confirm “no large refactors during release” rule
- Confirm feature flags (if any): defaults + rollback switches

PASS criteria:
- You can name exactly what is shipping and what is not.

---

# B) Build & Run Determinism (no “works on my machine”)
Checklist:
- Clean install works (lockfile respected)
- Build works in CI-like mode
- App boots reliably (no blank screen, no infinite spinner)
- Env vars: required list exists + fail-fast if missing (no silent undefined)

Evidence:
- Exact commands to run: lint, typecheck, test, build, dev/preview
- If any are missing: create minimal scripts before GO.

PASS criteria:
- Same commit builds the same way, repeatedly.

---

# C) Auth + RBAC (Staff vs Admin) — MUST be enforced everywhere
1) RBAC Matrix (required artifact)
- List role × capability:
  - Staff: what they can view/do
  - Admin: what extra powers exist (users, institutions, policies, device mgmt, etc.)

2) Enforcement Path (must exist)
- UI: route guards + hidden admin UI for staff
- API/server/edge: authorization checks (never UI-only)
- DB/RLS (if used): policies align with roles + tenant scoping

3) Attack simulation (mandatory)
As Staff:
- Directly navigate to admin routes (deep links + refresh)
- Attempt admin actions discovered in Network calls
Expected:
- Blocked/403/redirect with clear UX

PASS criteria:
- Staff cannot perform Admin actions by any route.

---

# D) Data Integrity (Supabase + migrations + seeds)
Checklist:
- Schema constraints: FKs, required fields, timestamps sane
- Indexes exist for hot queries
- Migrations:
  - forward migration tested
  - rollback plan documented (or mitigation plan if rollback is non-trivial)
- RLS (if enabled):
  - role × table × operation matrix exists
  - verification queries checklist exists
- Seed/demo data (if needed for portal usability):
  - deterministic + idempotent

PASS criteria:
- No “mystery denials” from RLS; no production data loss hazards.

---

# E) Fullstack Correctness (contracts, errors, observability)
Checklist:
- API contracts are consistent (frontend ↔ backend)
- Error format is consistent and user-actionable
- No swallowed errors (especially ones that cause endless loading)
- Idempotency for critical operations (payments/allocations/notifications)
- Observability:
  - structured logs for privileged operations
  - request IDs or correlation notes
  - audit trail table or equivalent for key events (recommended)

PASS criteria:
- Failures are visible, diagnosable, and do not strand users in loading states.

---

# F) UI/UX Quality Gate (world-class portal/mobile web app)
Non-negotiables:
- Every screen has: loading + empty + error + retry (no blank screens)
- Forms:
  - validation
  - disabled states
  - success feedback (toast/snackbar)
- Internal portal tables:
  - sorting/filtering/pagination where needed
  - readable density and spacing
- Visual system consistency:
  - tokens used (spacing/radius/typography)
  - component consistency (Button/Input/Card/Modal/Toast/Skeleton/Table)
- Motion:
  - subtle
  - respects prefers-reduced-motion

PASS criteria:
- The product feels intentional and consistent, not “stitched together.”

---

# G) Accessibility Gate (minimum viable AA direction)
Checklist (spot-check on key flows):
- Keyboard navigation works (focus visible, no traps)
- Form labels + error messages are accessible
- Contrast readable (glass must not reduce legibility)
- No hover-only controls

PASS criteria:
- Core flows usable without a mouse.

---

# H) PWA Gate (installability + offline strategy + update safety)
Checklist:
- Manifest correct (name, icons, start_url, display, theme)
- Service worker strategy is intentional:
  - no stale-bundle loops
  - update flow does not break users
- Offline/poor network behavior:
  - controlled fallback (not blank)
  - clear messaging

If client-facing mobile-first:
- touch targets, thumb-reachable nav, smooth transitions, fast perceived speed

PASS criteria:
- PWA works like a product, not a demo.

---

# I) Performance Gate (practical, not theoretical)
Checklist:
- Route-level splitting exists (or a plan to reduce first-load)
- No giant blocking requests at boot
- Images optimized (WebP/AVIF when feasible)
- Long lists are virtualized where needed (feeds, menus, vendors)
- “Slow network” test on 2 key flows: still usable (no infinite loading)

PASS criteria:
- App stays responsive and feels fast on mobile.

---

# J) Testing + UAT Gate
Minimum required:
- Unit tests for critical domain logic (or a plan with quick wins)
- E2E smoke tests OR deterministic manual smoke checklist for:
  - login
  - staff core flow
  - admin core flow
  - (if client-facing) primary client flow
- UAT checklist: step-by-step + expected results + pass/fail

PASS criteria:
- There is a repeatable way to prove the app works.

---

# K) Cloudflare Pages Production Gate (deployment discipline)
Checklist:
- Correct monorepo settings:
  - root directory, build command, output dir
  - production branch locked
- Preview vs Production env vars:
  - only env differs, not build logic
  - no secrets exposed to frontend
- SPA routing refresh works (deep links)
- Headers/caching sane:
  - hashed assets can be cached long
  - entry/manifest/service-worker revalidate to avoid stale JS
- Rollback readiness:
  - previous good deployment identified
  - rollback steps documented

PASS criteria:
- Deployments are boring and reversible.

---

# L) Operations Gate (launch day survival)
Checklist:
- Monitoring:
  - error tracking (client + server/edge)
  - key logs for auth/privileged operations
- Support readiness:
  - admin can diagnose common issues
  - runbook exists (top failures + fixes)
- Data safety:
  - backup posture understood (who/where/how often)
- Incident plan:
  - define “stop the line” triggers
  - rollback procedure rehearsed

PASS criteria:
- You can handle the first bad day.

---

# Final Decision Rules (GO / NO-GO)
NO-GO if any P0 exists in:
- RBAC/security breach
- Endless loading / app boot instability
- Broken auth/session
- RLS blocks critical flows unexpectedly
- Deployment cannot rollback quickly
- Data integrity risk (migrations without safe plan)

GO if:
- P0 = none
- P1 items have plan + owners + dates
- Release + rollback + verification are documented

---

# Deliver final Walkthrough
Include:
- URLs tested
- Accounts used (roles only; never paste secrets)
- Smoke flows executed + results
- Issues fixed + evidence
- Risks + rollback
EOF

echo ""
echo "Installed workflow:"
ls -la "$DIR/go-live-readiness.md"
'

