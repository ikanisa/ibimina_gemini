---
description: 
---

bash -lc 'set -euo pipefail
cat > ~/.gemini/antigravity/global_workflows/kickoff.md <<'"'"'EOF'"'"'
---
description: Universal kickoff for our AI-first Staff/Admin monorepo PWAs — execution contract, plan, tasks, gates, and next-best workflow chain
---

# /kickoff (GLOBAL)

## 0) Triage (classify the request in 30s)
Pick one primary type:
- FEATURE | BUGFIX | AUDIT | REFACTOR | GO-LIVE | DEPLOY | PERFORMANCE | SECURITY | UX-POLISH

Then immediately recommend the chain (don’t run yet—just propose):
- If multi-area work: /parallel-split
- If any tool/MCP usage: /mcp-preflight
- If browser QA needed: /browser-fullstack-test
- If Cloudflare involved: /cloudflare-pages-setup + /cloudflare-pages-env-vars + /cloudflare-pages-spa-routing + /cloudflare-pages-release
- If system audit requested: /fullstack-audit or /worldclass-pwa-audit
- If refactor/repair requested: /fullstack-refactor-repair
- If launch decision requested: /go-live-readiness

## 1) Execution Contract (must output first)
Produce a short contract:
- Goal (1 sentence)
- In-scope (bullets)
- Out-of-scope (bullets)
- Repo + app path(s) in monorepo
- Audience: Staff/Admin portal OR Client-facing mobile-first OR Both
- Environments: local/preview/prod (URLs if known)
- Constraints: timeline/tech choices/non-negotiables

Ask ONLY the minimum questions needed to avoid wrong work.
If not blocked, proceed with explicit assumptions.

## 2) Non-negotiables (apply to every project)
- Two core roles: Staff + Admin (roles flexible beyond that, but Staff/Admin must exist).
- RBAC enforced in UI + API/server + DB/RLS when used (never UI-only).
- UX: modern minimalist “Soft Liquid Glass” where appropriate; internal portals prioritize clarity.
- Every route/screen has: loading + empty + error + retry (no blank screens).
- Client-facing apps (Discovery/DineIn): mobile-first, native-like touch experience.
- No drive-by refactors. Small diffs. Keep scope tight.
- “Done” requires: Plan + Task List + Walkthrough (verification + risks + rollback).

## 3) Implementation Plan (required artifact)
Write an Implementation Plan with these headings (fill only what applies):
- Architecture touchpoints
  - Frontend: routing, layout shell, data layer/state, error boundaries
  - Backend/Edge: endpoints/functions, auth checks, validation
  - DB/Supabase: schema, migrations, RLS/policies, indexes
  - PWA: manifest, caching/service worker strategy, offline behavior (if needed)
  - Deploy: Cloudflare Pages settings, env strategy, SPA routing, headers/caching, rollback
- RBAC enforcement path (Staff vs Admin)
  - UI guards + server checks + DB/RLS checks (when used)
  - Attack simulation plan (Staff attempts Admin via direct URL + direct API)
- UX design notes
  - navigation pattern (portal vs client app)
  - states inventory (loading/empty/error/success)
  - component system changes (tokens/components)
  - motion + reduced-motion
- Reliability & observability
  - logging/audit trail for key operations
  - error surfacing (no swallowed errors)
- Performance & perceived speed
  - code splitting, list virtualization (if needed), skeletons vs spinners
- Risks + mitigations
- Rollback plan (code + deploy + DB)

## 4) Task List (required artifact)
Produce a Task List with small, verifiable steps in safe order:
1) Baseline + repro (for bugs): capture console/network evidence
2) Contracts/types first (reduce churn)
3) Backend/Edge implementation + auth checks
4) DB migrations/RLS (if needed) + seed/dummy data (idempotent)
5) Frontend wiring + UX states + component updates
6) Tests (unit/integration/e2e-smoke or deterministic checklist)
7) Browser verification (mobile + desktop) + RBAC attack simulation
8) Deploy checklist (if applicable) + rollback readiness
Each task MUST include “How to verify” (1–3 bullets).

## 5) Quality Gates (must be explicit)
List exact commands (or state they don’t exist and propose minimal additions):
- lint:
- typecheck:
- tests:
- build:
- dev/preview:

Minimum browser checks:
- Staff: login → core flow
- Admin: login → admin-only action
- Staff attempts admin route via direct URL (must be blocked)
- Refresh on deep link (must work)
- Mobile viewport sanity (no broken layout)

If client-facing:
- Touch targets, thumb nav, slow-network sanity (no infinite loading)

## 6) Execution Rules (how to operate)
- Prefer Planning mode for anything multi-file, auth/RBAC/RLS, migrations, deploy, or debugging.
- Use Fast mode only for tiny edits.
- If work spans UI + backend + DB + QA, recommend /parallel-split and assign:
  - UI System, Frontend Wiring, Backend/Edge, DB/RLS, QA/Browser, Deploy (and Mobile Experience for client apps).
- Never run destructive actions without explicit approval (deletes, drops, force pushes).

## 7) Definition of Done (must output at end)
Declare Done only if:
- Build passes
- Key flows verified (Staff/Admin + client flows if applicable)
- RBAC verified (no privilege escalation via URL/API)
- No blank screens; states everywhere
- Walkthrough includes verification evidence + risks + rollback

## 8) Walkthrough template (required on completion)
- What changed (by area: UI, backend, DB, deploy)
- How to verify (exact steps + URLs)
- Evidence (screenshots/recordings for UI)
- Risks
- Rollback steps
EOF

echo "Updated: ~/.gemini/antigravity/global_workflows/kickoff.md"
ls -la ~/.gemini/antigravity/global_workflows/kickoff.md
'

