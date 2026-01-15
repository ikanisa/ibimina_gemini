---
description: 
---

bash -lc 'set -euo pipefail
DIR="$HOME/.gemini/antigravity/global_workflows"
mkdir -p "$DIR"

cat > "$DIR/worldclass-pwa-audit.md" <<'"'"'EOF'"'"'
---
description: World-class mobile-first PWA fullstack audit + fix plan (UI/UX, Accessibility, PWA core, Performance, Security, Supabase, Cloudflare)
---

# WORLDCLASS PWA AUDIT WORKFLOW

## Goal
Audit a web-based mobile app/PWA end-to-end and produce an actionable, prioritized plan that upgrades it to a world-class, native-like experience.

## Inputs (confirm quickly; if missing, proceed with stated assumptions)
- App type: (A) Client-facing mobile-first (Discovery/DineIn) OR (B) Internal Staff/Admin portal
- Target URL(s): local / preview / prod
- Auth method: test accounts for Staff + Admin if applicable
- Stack assumptions: (React/Vite/etc), Supabase usage (schema/RLS/Edge Functions), Cloudflare Pages deployment

## Non-negotiables (must enforce)
- Mobile-first and responsive (client-facing must feel native-like)
- Performance and reliability (no blank screens; states everywhere)
- Accessibility (WCAG AA target)
- Security (OWASP principles; least privilege; safe storage)
- RBAC: Staff/Admin enforced in UI + API/server + DB/RLS when used (never UI-only)
- Evidence-based verification: screenshots/recordings + console/network proof for bugs

---

# REQUIRED OUTPUT ARTIFACTS

## 1) Executive Scorecard (0–5 each + justification)
- UI/UX & Mobile ergonomics
- Accessibility
- PWA fundamentals
- Performance (Core Web Vitals + perceived speed)
- Security
- Fullstack correctness (API contracts, error handling)
- Supabase quality (schema, RLS, Edge Functions)
- Deployment readiness (Cloudflare Pages)
- Testing readiness (unit/integration/e2e)
Verdict: GO / NO-GO (with conditions).

## 2) Findings Report (structured sections below)

## 3) Prioritized Backlog
- P0 must-fix pre-production
- P1 should-fix
- P2 improvements
Each item must include:
- Symptom
- Repro steps
- Root cause hypothesis (UI/API/RLS/Env/Perf/etc.)
- Fix approach
- Verification steps
- Risk + rollback notes

## 4) Verification Plan
- Minimum smoke flows (must include Staff + Admin if applicable)
- Mobile-first flows if client-facing (thumb navigation + key journeys)

---

# A) UI/UX + Mobile-first Checklist (native-like experience)

## Viewports to test (minimum)
- Mobile: 360×800
- Mobile large: 390×844
- Tablet: 768×1024
- Desktop: 1366×768 and 1440+

## Must-checks
- Touch targets: >= 44px (or ~48dp). No tiny icon-only actions without padding.
- Navigation ergonomics:
  - Client-facing: thumb-friendly primary nav (often bottom nav), clear back behavior, minimal cognitive load.
  - Portals: clarity > decoration; tables/filters/pagination must be usable.
- Scrolling model: mostly vertical, no accidental horizontal scroll.
- Gestures (client-facing): swipe-to-close sheets/modals, safe back behavior.
- Content states: loading (skeleton), empty (clear CTA), error (actionable + retry) on every route.

Deliver:
- UI/UX issues list + screenshots
- Component consistency gaps (Button/Input/Card/Modal/Toast/Skeleton/Table)

---

# B) Accessibility Checklist (WCAG AA target)
Run both automated + manual checks.

## Automated
- Run axe checks (or equivalent) on key screens:
  - login
  - main staff flow
  - main admin flow
  - client-facing core flow (if applicable)

## Manual
- Keyboard navigation: tab order, focus visible, no traps.
- Screen reader sanity: headings, labels, button names, form errors announced.
- Color contrast: text contrast readable; glass effects must not reduce legibility.
- No hover-only actions.

Deliver:
- Accessibility issues table + fixes + retest plan

---

# C) PWA Fundamentals Checklist
- HTTPS (mandatory)
- Manifest: name, icons, theme colors, display mode, start_url
- Service worker strategy:
  - caching policy is intentional
  - update flow does not cause stale bundle issues
- Offline/poor network behavior:
  - user sees a controlled fallback (not blank)
  - client-facing apps handle weak connectivity gracefully

Optional (only if needed):
- IndexedDB for offline persistence
- Background sync (where safe and supported)

Deliver:
- PWA compliance status + missing items + recommended strategy (simple and safe)

---

# D) Performance Checklist (Core Web Vitals + perceived speed)

## Perceived speed must-haves
- Skeletons for content loads (avoid long spinners)
- Avoid infinite loading (always timeout + error path)
- Route-level code splitting
- Virtualize long lists (feeds/menus/vendors)

## Measure and diagnose
- Lighthouse/DevTools: identify LCP/CLS/INP issues
- Biggest JS chunks and why (bloat)
- Render-blocking resources
- Image formats: WebP/AVIF where feasible
- Fonts: avoid blocking; subset if needed

Deliver:
- Performance findings + “Top 10 performance fixes”
- Budget targets (bundle + route chunks) and how to enforce them

---

# E) Security Checklist (practical)
- Auth:
  - secure session handling
  - no storing passwords locally
  - tokens handled safely (avoid unsafe storage patterns)
- Input validation/sanitization:
  - server-side validation where applicable
  - safe rendering (no unsafe HTML)
- Least privilege:
  - client sees only public-safe keys
  - backend checks authorization
- Dependency hygiene:
  - flag risky deps and insecure patterns (do not upgrade blindly without plan)

Deliver:
- Security findings + concrete remediation steps

---

# F) Fullstack correctness (frontend ↔ backend ↔ DB)
- API contracts: payload shapes consistent, typed if possible
- Error format: consistent and user-actionable
- Retries are safe (idempotency for critical operations)
- Observability:
  - logs for key operations
  - request IDs / trace correlation if available

Deliver:
- Contract mismatch list + fixes
- “endless loading” root causes (most common: swallowed errors, unresolved promises, auth loops, RLS denials not surfaced)

---

# G) Supabase Audit (schema, RLS, Edge Functions)
- Schema:
  - constraints, FKs, indexes, timestamps
  - naming consistency and avoiding duplicates
- RLS:
  - Staff/Admin policy alignment
  - tenant scoping (institution_id) if applicable
  - no overly-broad policies unless explicitly intended
- Edge Functions:
  - auth checks
  - input validation
  - logging/audit trail

Deliver:
- RBAC/RLS matrix (role × table × operation)
- Verification checklist (queries and app behaviors)
- Seed/dummy data plan (idempotent) if needed for demos/UAT

---

# H) Deployment Audit (Cloudflare Pages)
- Root directory/build command/output dir correct for monorepo
- Preview vs Production env discipline (only env differs)
- SPA routing refresh and deep links correct
- Headers/caching sane (avoid stale JS after deploy)
- Rollback readiness confirmed

Deliver:
- Exact Cloudflare settings + release ritual + rollback steps

---

# I) Testing + UAT readiness
Minimum:
- Unit tests for critical logic
- e2e-smoke tests for:
  - login
  - staff core flow
  - admin core flow
  - client-facing core flow (if applicable)
- UAT checklist: step-by-step with expected results

Deliver:
- Minimal test suite required to go live + how to run it

---

# Fix Loop (if requested in same run)
If asked to fix issues:
- Use evidence-driven /bugfix per issue
- Keep diffs small
- Add regression protection (tests or deterministic checklists)
- Re-run the exact repro steps and mark Verified
- End with Walkthrough (verification + risks + rollback)

EOF

echo ""
echo "Installed workflow:"
ls -la "$DIR/worldclass-pwa-audit.md"
'

