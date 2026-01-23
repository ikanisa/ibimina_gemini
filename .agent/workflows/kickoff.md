---
description: 
---

bash -lc 'set -euo pipefail
FILE="$HOME/.gemini/antigravity/global_workflows/kickoff.md"
mkdir -p "$(dirname "$FILE")"

cat > "$FILE" <<'"'"'EOF'"'"'
---
description: Universal kickoff for our AI-first monorepo PWAs — ALWAYS output Execution Contract + Implementation Plan + Task List + Gates before work begins
---

# /kickoff (GLOBAL)

## Hard rule (mandatory)
Before doing ANY implementation work, you MUST output (in this exact order):
1) Execution Contract
2) Implementation Plan
3) Task List (with “How to verify” per task)
4) Quality Gates (commands + minimum browser checks)

If you cannot produce (1–4), STOP and ask only the minimum blocking questions.

---

## 0) Triage in 30 seconds
Pick ONE primary type:
FEATURE | BUGFIX | AUDIT | REFACTOR | GO-LIVE | DEPLOY | PERFORMANCE | SECURITY | UX-POLISH | DOCS

Then recommend the next workflow chain (do not run yet; only propose):
- Multi-area / multi-agent work → /parallel-split
- Any MCP/tool usage → /mcp-preflight
- Comprehensive QA → /qa-comprehensive
- Browser testing loop → /browser-fullstack-test
- Supabase build (schema/RLS/edge/seeds) → /supabase-implementation
- Cloudflare Pages shipping → /cloudflare-pages-setup + /cloudflare-pages-env-vars + /cloudflare-pages-spa-routing + /cloudflare-pages-release + /cloudflare-pages-rollback
- Full system/repo audit → /fullstack-audit (or /worldclass-pwa-audit)
- Refactor/repair → /fullstack-refactor-repair (or /refactor-safely for small)
- Go-live decision → /go-live-readiness
- README overhaul → /readme-comprehensive
- Standards sync → /apply-standards

---

## 1) Execution Contract (MUST OUTPUT)
Produce a concise contract:
- **Goal (1 sentence)**
- **In-scope** (3–7 bullets)
- **Out-of-scope** (bullets)
- **Repo + app path(s)** (monorepo locations)
- **App audience/type**: Staff/Admin portal OR Client-facing mobile-first OR Both
- **Environments**: local/preview/prod (URLs if known)
- **Constraints**: timeline, stack choices, “must not change” items
- **Assumptions** (only if needed; list clearly)

Only ask blocking questions. If not blocked, proceed under assumptions.

---

## 2) Universal Non-Negotiables (apply to ALL projects)
- Core roles must exist: **Staff + Admin** (additional roles allowed).
- **RBAC is layered**: UI guards + server/edge authorization + DB/RLS (when used). Never UI-only.
- Every screen/route has: **loading + empty + error + retry** (no blank screens).
- **No infinite loading**: timeouts + error boundaries + surfaced root cause.
- Minimalist modern UI; “Soft Liquid Glass” only if readability/contrast remains high.
- Motion respects **prefers-reduced-motion**.
- Small diffs, phased changes; no drive-by refactors.
- “Done” requires: **Plan + Task List + Walkthrough (verify + risks + rollback)** with evidence.

---

## 3) Baseline Snapshot (required for BUGFIX / AUDIT / GO-LIVE / DEPLOY)
Capture current state before changes:
- Build/Run: lint/typecheck/tests/build (or state missing scripts)
- Runtime: does app load? any endless spinner? any console errors?
- Network: any 401/403/5xx? any requests stuck pending?
- Auth: login works? refresh loops?
- Supabase (if used): any RLS “permission denied” symptoms?
Output a short “Baseline” block.

---

## 4) Implementation Plan (MUST OUTPUT)
Write a structured plan (include only applicable sections):

### A) Architecture touchpoints
- Frontend: routing, layout shell, data layer/state, error boundaries, UX states
- Backend/Edge: endpoints/functions, authz checks, validation, error format, logs
- DB/Supabase: schema, migrations, RLS/policies, indexes, seeds
- PWA: manifest, service worker/caching strategy, offline policy, update safety
- Deploy: Cloudflare settings, env strategy, SPA routing, headers/caching, rollback

### B) RBAC enforcement path (explicit)
- Role matrix: Staff vs Admin capabilities
- UI: route guards + control gating (UX only)
- Server/Edge: authorization checks (security)
- DB/RLS: least privilege policies (if used)
- Attack simulation plan: Staff tries admin via URL + API replay

### C) UX design notes
- Portal vs client navigation pattern
- State inventory: loading/empty/error/success + retry
- Component/token changes (if needed)
- Motion + reduced-motion

### D) Reliability & observability
- Logging/audit for privileged actions
- Error surfacing (no swallowed errors)
- Timeouts/retries policy

### E) Performance & perceived speed (when relevant)
- code splitting, list virtualization, skeletons vs spinners, heavy dependency control

### F) Risks + mitigations
List the top risks (RBAC, RLS, deploy caching, data loss) and mitigations.

### G) Rollback plan
- Code rollback (revert / rollback deploy)
- DB rollback or mitigation steps
- Service worker/update safety if touched

---

## 5) Task List (MUST OUTPUT)
Produce small, verifiable tasks in safe order. EVERY task must include “How to verify” (1–3 bullets).
Recommended ordering:
1) Baseline + repro evidence (console/network) [for bugs]
2) Contracts/types first (reduce churn)
3) Backend/Edge implementation + authz checks
4) DB migrations/RLS (if needed) + idempotent seeds/dummy data
5) Frontend wiring + UX states + component updates
6) Tests: unit/integration/e2e-smoke OR deterministic checklist
7) Browser verification (desktop + mobile) + RBAC attack simulation
8) Deploy checklist (if applicable) + rollback readiness

---

## 6) Quality Gates (MUST OUTPUT)
List exact commands (or state they do not exist and propose minimal additions):
- lint:
- typecheck:
- tests:
- build:
- dev/preview:

Minimum browser checks:
- Staff: login → core flow works
- Admin: login → admin-only action works
- Staff direct admin URL → blocked (redirect/denied)
- Staff API replay of admin action → blocked (403)
- Deep-link refresh works (nested route refresh)
- No blank screens; errors surfaced with retry

If client-facing:
- 360×800 + 390×844 core journey
- touch targets >=44px, thumb-friendly nav
- slow network sanity: usable, clear errors, retry works

---

## 7) Execution Rules (how to operate)
- Use Planning mode for multi-file work, auth/RBAC/RLS, migrations, deploy, debugging.
- Use Fast mode only for tiny edits.
- If work spans UI + backend + DB + QA + deploy, recommend /parallel-split and assign:
  - UI System, Frontend Wiring, Backend/Edge, DB/RLS, QA, Deploy
  - Add Mobile Experience + Performance for client apps
- Never run destructive actions without explicit approval (drops/deletes/force pushes).

---

## 8) Completion Walkthrough (required at the end)
When work is complete, output:
1) What changed (UI / backend / DB / deploy)
2) How to verify (exact steps + URLs)
3) Evidence (screenshots/recordings + status codes if relevant)
4) Risks
5) Rollback steps

Declare DONE only if gates pass and verification is documented.
EOF

echo "Updated: $FILE"
echo -n "Chars: " && wc -c < "$FILE"
'
