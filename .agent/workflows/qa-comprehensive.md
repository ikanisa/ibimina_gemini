---
description: 
---

bash -lc 'set -euo pipefail
DIR="$HOME/.gemini/antigravity/global_workflows"
mkdir -p "$DIR"

cat > "$DIR/qa-comprehensive.md" <<'"'"'EOF'"'"'
---
description: Comprehensive QA review workflow for fullstack PWAs (Staff/Admin portals + optional client-facing mobile), incl RBAC, endless-loading, PWA, performance, deploy checks
---

# /qa-comprehensive

## Goal
Run a world-class QA review that is evidence-driven, reproducible, and fullstack-aware:
- UI/UX correctness + accessibility basics
- Auth + RBAC (Staff/Admin) enforcement
- Backend/API/Edge correctness + error handling
- Supabase/RLS denial detection (no endless loading)
- PWA behavior (install/offline/update) when applicable
- Performance sanity + regression prevention
- Deploy preview/prod parity checks

---

## 0) Inputs (confirm quickly; if missing, proceed with assumptions)
- App type: Staff/Admin portal OR client-facing mobile-first OR both
- Environments to test: local / preview / prod
- Roles available: Staff + Admin (credentials or test accounts)
- Critical journeys (3–7)
- Any known-risk areas (auth loops, RLS, stale bundles)

---

## 1) QA Outputs (non-negotiable)
1) **QA Test Plan** (short, scoped)
2) **Issue Log** (table): ID, severity (P0/P1/P2), repro, expected vs actual, evidence, suspected cause, owner, status
3) **Verification Pack**: checklist of passed tests + evidence references
4) **Release Recommendation**: GO / NO-GO + top risks + rollback notes

Evidence must include screenshots/recordings AND console/network notes for P0/P1 bugs.

---

## 2) Preflight (do first)
### 2.1 Build/Run sanity
- Confirm: lint/typecheck/tests/build (or note missing scripts)
- Confirm app boots with correct env vars (fail-fast if missing)

### 2.2 Instrumentation
- Open DevTools: Console + Network (Preserve log)
- Enable throttling for one pass: “Fast 3G” (client apps) OR normal for portals
- Note browser + device viewport used

---

## 3) Smoke Tests (must pass before deeper QA)
### 3.1 Auth & Session
- Login as Staff → session persists on refresh
- Logout → cannot access protected routes
- Session expiry handling: user sees clear message, not a blank screen

### 3.2 Staff journey
- Complete 1–3 core Staff actions end-to-end
- Verify mutations succeeded (UI updates + network 2xx)

### 3.3 Admin journey
- Complete 1–3 admin-only actions end-to-end
- Verify audit/visibility where relevant

### 3.4 Deep-link refresh
- Navigate to a nested route, refresh → must load (SPA routing ok)

Evidence: 1 short recording per role (or screenshots if impossible).

---

## 4) RBAC Attack Simulation (mandatory)
As Staff:
1) Attempt direct admin route URL
2) Attempt admin action by replaying request from Network tab (same payload)

Expected:
- Route blocked (redirect/denied)
- API blocked (403)
- User sees actionable message (no endless spinner)

Capture:
- status codes, response bodies (redact secrets), UI screenshot.

---

## 5) Endless Loading / “Black Hole” Diagnostics (mandatory if any spinner > 2–5s)
When a page loads forever:
1) Network tab:
   - any pending requests? which endpoints?
   - any 401/403/5xx?
2) Console:
   - uncaught errors? hydration/router errors?
3) Supabase/RLS suspicion:
   - 401/403 with “permission denied” patterns
4) UI state:
   - is error state missing? retry absent?

Output:
- Root-cause hypothesis + exact fix recommendation (frontend vs backend vs RLS).

---

## 6) UI/UX Review (world-class baseline)
### 6.1 States inventory
For each key page:
- loading + empty + error + retry + success feedback exist
- forms: validation, disabled submit, clear errors

### 6.2 Design consistency
- spacing/typography consistent
- “Liquid Glass” doesn’t harm contrast/readability
- no clipped content; no horizontal scroll

### 6.3 Mobile sanity (client apps mandatory; portals recommended)
Test at:
- 360×800 and 390×844
Checks:
- tap targets comfortable (>=44px)
- keyboard doesn’t hide inputs
- primary actions reachable (thumb zone)

Evidence: screenshots for each viewport.

---

## 7) Accessibility Quick Gate (practical)
- Keyboard navigation works for core flows (Tab/Shift+Tab)
- Focus visible
- Inputs have labels
- No hover-only controls
- Contrast acceptable (especially on glass surfaces)

If possible: run an axe/lighthouse accessibility pass and record findings.

---

## 8) Backend/API/Edge QA (fullstack correctness)
For each critical action:
- Request returns expected status code
- Error handling:
  - invalid input → 422 (or consistent equivalent)
  - unauth → 401
  - forbidden → 403
- Response shape consistent (no random nulls)
- Idempotency where needed (double submit doesn’t duplicate)

Capture: 1–3 representative network traces.

---

## 9) Supabase/DB/RLS QA (if used)
- Confirm Staff cannot access other-tenant data (if multi-tenant)
- Confirm Admin elevation works as intended
- Identify any RLS denies that cause UI to hang
- Verify indexes are sufficient for main list pages (no extreme latency)

Evidence: status codes + screenshots (no secrets).

---

## 10) PWA QA (only if PWA features enabled)
- Installability (manifest/icons ok)
- Offline behavior matches policy (read-only vs actions)
- Update behavior:
  - new deploy does not cause stale JS loops
  - refresh/load remains stable

If service worker exists: verify it doesn’t trap users on old bundle.

---

## 11) Performance Sanity (not a full perf audit)
- Initial load “feels fast” (no 10s blank)
- No janky scrolling on long lists (virtualization if needed)
- Images not huge; layout stable (CLS direction)

Record quick notes from Lighthouse or DevTools if available.

---

## 12) Regression Protection (minimum)
Choose one:
- E2E smoke test script (preferred)
OR
- Deterministic manual checklist that can be repeated in 10–15 minutes

Must include:
- Staff flow
- Admin flow
- RBAC negatives
- Deep-link refresh

---

## 13) Release Decision (GO/NO-GO)
- P0: security/RBAC bypass, endless loading, broken core flows, deploy break → NO-GO
- P1: major UX break, frequent errors, major perf regressions → usually NO-GO
- P2: minor UI polish → GO with tracked backlog

Output:
- GO/NO-GO
- Top 5 risks
- Rollback steps (Cloudflare + DB mitigation if applicable)

---

## Output format requirement
Always output in this order:
1) QA Test Plan
2) Issue Log (table)
3) Verified Pass Checklist
4) GO/NO-GO decision + risks + rollback
EOF

echo "Installed: $DIR/qa-comprehensive.md"
wc -c "$DIR/qa-comprehensive.md" | awk "{print \"Chars:\", \$1}"
'
