---
description: Fullstack refactor + repo/system repair workflow for monorepo Staff/Admin AI-first PWAs (frontend, backend, Supabase, Cloudflare) with phased execution, verification gates, and rollback
---

bash -lc 'set -euo pipefail
DIR="$HOME/.gemini/antigravity/global_workflows"
mkdir -p "$DIR"

cat > "$DIR/fullstack-refactor-repair.md" <<'"'"'EOF'"'"'
---
description: Fullstack refactor + repo/system repair workflow for monorepo Staff/Admin AI-first PWAs (frontend, backend, Supabase, Cloudflare) with phased execution, verification gates, and rollback
---

# Fullstack Refactor + Repair Workflow

## Goal
Transform a messy/brittle codebase into a clean, maintainable, world-class system WITHOUT breaking behavior:
- Monorepo discipline
- Staff/Admin RBAC correctness
- PWA/mobile-first quality where applicable
- Supabase schema/RLS/Edge Functions hygiene
- Cloudflare deployment reliability
- No endless-loading, no env chaos, no UI-only security

## Non-negotiables (must enforce)
- Small diffs, phased execution, no drive-by refactors.
- “Done” requires: Plan + Task List + Walkthrough (verification + risks + rollback).
- RBAC must be enforced in UI + API/server + DB/RLS (when used).
- Every page has loading + empty + error states (no blank screens).
- Mobile-first client apps must feel native-like (touch-first, fast, smooth).

---

# REQUIRED OUTPUT ARTIFACTS

## 1) Baseline Health Snapshot (before touching code)
- Current build status (pass/fail) + exact commands
- Current runtime status (loads? endless spinner? console errors?)
- Known critical flows (Staff + Admin; plus client flows if applicable)
- Deployment status (Cloudflare settings + preview/prod env discipline)
- Supabase status (migrations, RLS posture, Edge Functions)

## 2) Refactor Map (architecture truth)
- Repo structure map (apps/, packages/, supabase/, functions/)
- Module boundaries (what belongs where)
- Data flow diagram (UI → API/Edge → DB)
- Duplication hotspots (types, API clients, UI components, utils)
- Top 5 “pain points” causing bugs/slowness (endless loading, env mismatch, RBAC leaks)

## 3) Invariants & Golden Paths (what must NOT break)
- List of invariant behaviors (auth, routing, core flows, key screens)
- Golden-path checklist:
  - Staff flow #1
  - Staff flow #2
  - Admin flow #1
  - Admin flow #2
  - Client flow #1 (if client-facing)
- Baseline evidence: screenshots/recordings + expected results

## 4) Phased Refactor Plan + Task List
Phases must be independently shippable and rollbackable.

## 5) Final Walkthrough
- What changed, why
- How to verify
- Risks + rollback steps
- Follow-up backlog

---

# PHASE 0 — Stop the bleeding (Repo/System Repair)
Goal: make the system build, run, and be debuggable.
1) Ensure a single source of truth for env config
- List required env vars and where they are used
- Add “fail-fast” checks so missing env fails clearly (no infinite loading)

2) Fix endless-loading class bugs
Common root causes to hunt:
- Unhandled promise / swallowed errors
- Auth redirect loops
- RLS denials that appear as “loading forever”
- Suspense/async init without timeout/error boundary
- Network requests that never resolve + no abort/timeout
Deliver: explicit error UI + retry; ensure logs capture root cause.

3) Establish minimum quality gates (commands must exist)
- lint, typecheck, tests, build, dev
If missing: add minimal scripts.

4) Add baseline observability
- Consistent error logging on client
- Server/Edge logs for privileged operations
- Request IDs or correlation if feasible

Verification: run golden paths; confirm no blank screens.

---

# PHASE 1 — Create safe boundaries (without redesign)
Goal: boundaries first, refactor second.
1) Define layering rules
- UI components
- feature modules
- data-access layer
- domain/business logic layer
- integrations (Supabase, WhatsApp, external APIs)

2) Extract shared code into packages/ (monorepo)
- shared UI components (design system)
- shared types/contracts
- shared utilities
No duplication across apps.

3) Standardize API contracts
- Single typed client where possible
- Consistent error format
- Explicit loading/empty/error handling patterns

Verification: golden paths + regression checks.

---

# PHASE 2 — Remove duplication + simplify (mechanical refactor)
Goal: reduce complexity without functional change.
- Delete dead code (with evidence)
- Remove unused deps
- Consolidate duplicated utilities/components
- Normalize naming conventions and folder structure
- Replace “one-off patterns” with shared primitives

Rules:
- Mechanical changes only in this phase (no behavior change unless explicitly required).

Verification: tests + golden paths.

---

# PHASE 3 — UI/UX system modernization (Soft Liquid Glass + consistency)
Goal: consistent, world-class UI.
- Centralize design tokens (spacing, radius, blur, shadows, typography)
- Standard component set:
  Button, Input, Card, Modal/Drawer, Toast, Skeleton, Table, Tabs, Dropdown
- Ensure every screen has loading/empty/error states
- Motion: subtle and respects prefers-reduced-motion
- Internal portals: clarity > decoration; client apps: touch-first + delight

Verification: screenshot diffs + mobile viewports + reduced-motion spot-check.

---

# PHASE 4 — Supabase correctness (schema/RLS/Edge Functions)
Goal: correctness, least privilege, maintainability.
1) Schema hygiene
- constraints, FKs, indexes, timestamps
- remove duplicate tables/functions/policies
2) RLS alignment
- role × table × operation matrix (staff/admin)
- avoid overly broad policies unless intentional
3) Edge Functions hygiene
- auth checks + input validation + logging
- shared helper lib for common logic
4) Seeds
- deterministic, idempotent seed scripts for demos/UAT

Verification: Staff/Admin access tests + key flows + RLS queries.

---

# PHASE 5 — Performance & PWA hardening (especially client-facing)
Goal: fast, smooth, native-like.
- route-level code splitting
- skeletons over spinners
- virtualize long lists
- image/font optimization (WebP/AVIF where feasible)
- service worker strategy that avoids stale bundle issues
- offline/poor network user experience is intentional

Verification: Lighthouse/DevTools metrics + slow-network sanity + no endless loading.

---

# PHASE 6 — Cloudflare production hardening
Goal: boring deployments.
- correct monorepo Pages settings (root/build/output)
- preview vs prod env discipline
- SPA routing refresh correctness
- headers/caching sane (avoid stale JS)
- rollback readiness

Verification: preview → prod ritual; confirm rollback target.

---

# EXECUTION RULES (how to work day-to-day)
- Use /parallel-split for Phases 1–6 with these roles:
  UI/System, Frontend Wiring, Backend/Edge, DB/RLS, QA/Browser, Cloudflare/Deploy, Mobile Experience (only for client apps).
- Each agent must produce:
  Mini Plan, Mini Task List, File list, Verification evidence, Handoff notes.
- Integrator alone declares DONE and produces final Walkthrough.

---

# DELIVERABLE: PRIORITIZED BACKLOG
At the end, produce:
- P0: must-fix pre-prod (security/RBAC/endless loading/data loss)
- P1: should-fix (maintainability/perf)
- P2: polish (motion, microcopy, optional enhancements)
Each item includes: location, root cause, fix, verify, rollback.
EOF

echo ""
echo "Installed workflow:"
ls -la "$DIR/fullstack-refactor-repair.md"
'
