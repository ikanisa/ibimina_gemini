---
description: 
---

bash -lc 'set -euo pipefail
DIR="$HOME/.gemini/antigravity/global_workflows"
mkdir -p "$DIR"

cat > "$DIR/fullstack-audit.md" <<'"'"'EOF'"'"'
---
description: Robust full-stack repo/system audit for AI-first Staff/Admin monorepo PWAs (UI/UX, frontend, backend, Supabase, PWA, Cloudflare readiness)
---

## Goal
Produce a rigorous, actionable audit of the current repo/system with a go-live readiness verdict and a prioritized fix plan.

## Before you start (state explicitly)
- Target app(s) in monorepo: (list)
- Audience: (Staff/Admin portal) OR (Client-facing mobile-first) OR (Both)
- Runtime: local dev OR preview deployment OR prod URL (if available)
- Backend: Supabase? (yes/no) + which project/env (dev/stage/prod)
If missing but not blocking: proceed with assumptions and mark them.

---

# Output requirements (non-negotiable)
You MUST produce these artifacts:

1) **Audit Executive Summary**
- Go-live readiness: GREEN / YELLOW / RED
- Top 10 risks (security, reliability, RBAC, data integrity, PWA)
- Quick wins (≤ 48h)
- Medium plan (1–2 weeks)
- Longer plan (3–6 weeks)

2) **Findings Report** (structured sections below)
3) **Prioritized Backlog**
- P0 (must-fix pre-prod), P1, P2
- Each item includes: symptom, root cause, fix steps, verification, rollback

4) **Verification Plan**
- Minimum smoke flows for Staff + Admin
- If client-facing: mobile-first flows (Discovery/DineIn style)

---

# Audit method (how to inspect the repo)
Use @ to pull in context as needed. Prioritize:
- README / docs
- package.json (scripts, deps), lockfile
- app entry points (main.tsx, router, auth bootstraps)
- Supabase folder (migrations, policies, edge functions)
- Deployment configs (Cloudflare, env injection, redirects/headers)
- Any “core” domain modules

Avoid broad refactors during audit. Only propose changes.

---

# A) Repo + architecture audit
- Monorepo structure sanity:
  - apps/ packages/ shared libs boundaries
  - duplication hotspots (types, API clients, UI components)
  - dependency graph smell (circular deps, “god” modules)
- Architecture clarity:
  - where business logic lives
  - where auth/role checks live
  - how data flows (UI → API/Edge → DB)
- Maintainability:
  - naming consistency
  - folder conventions
  - dead code / unused deps
Deliver: architecture map + “what belongs where” recommendations.

---

# B) Frontend implementation audit (PWA web app)
- Routing:
  - SPA routing correctness (deep links, refresh, notFound handling)
  - route-level splitting and lazy loading
- State + data fetching:
  - infinite loading / suspense misuse / missing error boundaries
  - caching strategy (react-query, swr, custom)
  - retries, timeouts, error surfaces
- Reliability:
  - consistent loading/empty/error states (no blank screens)
  - toast/feedback patterns
- Forms:
  - validation, disabled states, optimistic updates with rollback
Deliver: list of “endless loading” root causes + fixes.

---

# C) UI/UX audit (world-class, minimalist, Soft Liquid Glass)
- Visual system:
  - tokenization (spacing, radius, blur, shadows, typography)
  - component consistency (Button/Input/Card/Modal/Toast/Skeleton/Table)
- Ergonomics:
  - internal portals: clarity > decoration (tables, filters, density)
  - client apps: touch-first nav + thumb reachability + delight
- Motion:
  - subtle, purposeful; respects prefers-reduced-motion
- Accessibility baseline:
  - keyboard nav where relevant
  - contrast/readability (glass must not harm legibility)
Deliver: UI issues list + component system plan.

---

# D) PWA + mobile-first audit
- Manifest: icons, name, theme, display mode
- Service worker strategy:
  - update flow, stale bundle risk, offline behavior clarity
- Performance:
  - bundle sizes, largest chunks, unused deps
  - image/font optimization
  - jank sources (long lists without virtualization)
- Mobile-first (if client-facing):
  - bottom nav/thumb reachability
  - touch targets ≥ 44px
  - keyboard overlays for inputs
Deliver: “Native-feel PWA” checklist status + top fixes.

---

# E) Backend/API/Edge audit (fullstack correctness)
- API contracts:
  - types/schemas alignment (frontend ↔ backend)
  - error formats consistent + actionable
- Auth & RBAC:
  - Staff/Admin enforced server-side (never UI-only)
  - privilege escalation paths (direct API call attempts)
- Idempotency:
  - retries safe (payments/allocations/notifications)
- Observability:
  - logs, request IDs, audit trails
Deliver: RBAC attack-sim findings + remediation.

---

# F) Supabase audit (DB schema, RLS, Edge Functions)
- Schema quality:
  - table normalization, constraints, indexes
  - timestamp consistency, enum usage, FK integrity
- RLS:
  - least privilege policies
  - tenant scoping if present (institution_id/owner_id)
  - no “USING true” unless explicitly intended
- Edge Functions:
  - naming, duplication, shared utilities
  - auth checks, input validation
  - logging/audit trail patterns
- Data seeding:
  - deterministic, idempotent seed scripts for demos/UAT
Deliver: RLS matrix (role × table × operation) + verification queries checklist.

---

# G) Security audit (practical)
- Secrets hygiene:
  - no secrets in client-exposed env vars
  - no leaking keys in logs or bundles
- Injection risks:
  - prompt injection surfaces (if AI features)
  - HTML rendering / markdown rendering sanitization
- Dependency risks:
  - outdated critical deps (flag only; don’t upgrade blindly)
Deliver: top security findings + concrete fixes.

---

# H) Testing + QA + UAT readiness
- Unit tests: coverage gaps in core business logic
- Integration tests: auth flows, role checks, key data operations
- E2E smoke tests: Staff flow + Admin flow (+ mobile flows if client-facing)
- UAT checklist: step-by-step, verifiable
Deliver: minimum test suite required for “go live”.

---

# I) Cloudflare production readiness (Pages)
- Build settings correctness:
  - root dir (monorepo), build command, output dir
- Preview vs prod env discipline:
  - no secret leakage; env mismatch prevention
- SPA routing + headers:
  - deep link refresh works
  - caching doesn’t cause stale JS
- Rollback readiness:
  - last known good deployment identifiable
Deliver: Cloudflare settings table + rollout/rollback plan.

---

# Scoring rubric (include in report)
Score each category 0–5 and justify:
- Architecture & maintainability
- Frontend reliability
- UI/UX quality
- PWA/mobile experience
- Backend correctness
- Supabase schema/RLS/Edge
- Security posture
- Testing readiness
- Cloudflare production readiness

---

# Final instruction
Do not end the audit with vague advice.
Every finding must include:
- exact location (file/module/route) when possible
- root cause hypothesis
- fix approach
- verification steps
- rollback notes (when relevant)
EOF

echo ""
echo "Installed workflow:"
ls -la "$DIR/fullstack-audit.md"
'

