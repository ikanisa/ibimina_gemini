---
description: 
---

bash -lc 'set -euo pipefail
DIR="$HOME/.gemini/antigravity/global_workflows"
mkdir -p "$DIR"

cat > "$DIR/frontend-portal-design-impl.md" <<'"'"'EOF'"'"'
---
description: Frontend + UI/UX design + implementation workflow for Staff/Admin PWA portals (world-class, minimalist, responsive, reliable)
---

# Frontend Portal (Staff/Admin) — Design + Implementation Workflow

## Goal
Design and implement a world-class Staff portal with Admin interface as a modern PWA:
- Clarity-first internal UX (tables, filters, workflows)
- Minimalist visual system (Soft Liquid Glass where appropriate, never harming readability)
- Responsive (mobile-friendly) and robust (states everywhere)
- Secure RBAC at the UI level (and aligned with backend + DB/RLS)

## Inputs (confirm quickly; if missing, proceed with assumptions)
- Portal domain: what the portal manages (institutions, groups, members, devices, payments, agents, etc.)
- Roles: Staff vs Admin capabilities (must list)
- Primary flows: top 3 Staff flows + top 3 Admin flows
- Tech stack: (React/Vite/etc), data client (Supabase/REST), routing approach
- Target URLs: local / preview / prod (if available)

---

# Required Outputs (non-negotiable)
1) **UX Spec (short, command-oriented)**
- Role capability matrix (Staff vs Admin)
- Navigation map (IA)
- Screen list + key components per screen
- States inventory (loading/empty/error/success)
- “Done” definition

2) **Design System Pack**
- Tokens: spacing, radius, blur, shadows, typography
- Core components: Button, Input, Select, Textarea, Card, Modal/Drawer, Toast, Skeleton, Tabs, Table, Badge, Dropdown, Tooltip

3) **Implementation Plan + Task List**
- Ordered steps minimizing risk
- Verification steps for each milestone

4) **Final Walkthrough**
- Screens verified (with screenshots)
- RBAC verification notes
- Risks + rollback

---

# Phase 0 — Portal UX foundation (IA + RBAC + navigation)

## 0.1 Role capability matrix (required)
Create a matrix table:
- Staff: view/create/edit actions per entity
- Admin: all staff + admin-only powers (user mgmt, permissions, institution settings, policies)

## 0.2 Navigation architecture (internal portal standard)
- Clear left sidebar (desktop) + compact mobile nav (top/bottom) without losing clarity
- Admin-only sections clearly labeled
- Breadcrumbs for deep screens
- Global search (optional but recommended for portal)

## 0.3 Route guards (UI-level)
- Staff cannot access Admin routes via direct URL
- Admin routes grouped and guarded
- Provide “access denied” UX (not a blank screen)

Deliverable: Navigation map + guarded routes list.

---

# Phase 1 — Screen design (portal-first ergonomics)

For each screen, define:
- Primary action (single)
- Secondary actions
- Data presentation (table/cards)
- Filters/sort/search requirements
- Empty state CTA
- Error state recovery

## Mandatory portal patterns
- Tables: sorting, filtering, pagination (or virtualization), sticky header if needed
- Forms: validation, helper text, disabled states, clear success feedback
- Modals/Drawers: for create/edit flows (prefer drawers on desktop, full-screen sheets on mobile if needed)
- Toasts/snackbars: consistent feedback
- Skeletons: preferred over spinners for content areas

Deliverable: Screen-by-screen spec + component mapping.

---

# Phase 2 — Visual system (minimalist + Soft Liquid Glass, portal-safe)

Rules:
- Glass must not reduce readability; if background is noisy increase opacity/tint or reduce blur.
- Fewer layers; use depth only for hierarchy.
- Internal portal: clarity > decoration; no “over-glass” that reduces contrast.
- Motion: subtle and purposeful; respects prefers-reduced-motion.

Deliverable:
- Token file + component style rules (consistent across portal).

---

# Phase 3 — Implementation (Frontend engineering)

## 3.1 App shell & layout
- Responsive layout: sidebar (desktop), condensed nav (mobile)
- Consistent page header with title + primary CTA
- Error boundary for app-level crashes (show recovery UI)

## 3.2 Data layer & state
- Standardize a data fetching pattern:
  - loading → skeleton
  - success → render
  - empty → CTA
  - error → actionable message + retry
- Never allow “infinite loading”:
  - every async path has timeout/error handling
  - surface root cause (auth failure, RLS denial, network)

## 3.3 Forms & validation
- Centralize validation rules
- Field-level errors + form-level errors
- Disable submit during request; show progress
- Confirmation dialogs for destructive actions

## 3.4 Tables & lists (portal critical)
- Stable columns + alignment
- Sorting + filtering + pagination
- Bulk actions only if needed; must be safe and confirmable
- Large tables: virtualization or pagination (avoid jank)

## 3.5 RBAC UX clarity
- Hide admin-only controls for staff
- Guard admin routes
- If staff tries admin action: show “not permitted” with next step

## 3.6 Accessibility baseline (portal must be usable)
- Keyboard navigation works; focus visible
- Labels for inputs; buttons have names
- Contrast readable (especially with glass effects)
- No hover-only actions

Deliverable: Implemented pages + consistent components + states everywhere.

---

# Phase 4 — PWA specifics (portal-safe defaults)
- Manifest: correct name/icons/theme
- Service worker strategy:
  - For portals, default to safe caching (avoid stale JS issues)
  - Do not introduce aggressive offline-first unless explicitly required
- Offline behavior:
  - If offline: show controlled message and disable destructive actions

Deliverable: PWA assets verified + update behavior safe.

---

# Phase 5 — Quality gates (must run and report)
You must provide the exact commands used:
- lint
- typecheck
- tests (if present)
- build

Browser verification (minimum):
- Staff login → Staff core flow
- Admin login → Admin core flow
- Staff attempts Admin route via direct URL (must be blocked)
- Refresh on a deep route (must work)
- Mobile viewport sanity (no broken layout)

Deliverable:
- Screenshots for key flows
- Console/network sanity notes (no repeated fatal errors)

---

# Done Checklist (explicit)
- Navigation/IA matches spec
- Component system consistent across screens
- Loading/empty/error/success states everywhere
- RBAC: staff blocked from admin actions (UI + verified behavior)
- PWA assets present and safe (no stale bundle traps)
- Walkthrough includes verification + risks + rollback
EOF

echo ""
echo "Installed workflow:"
ls -la "$DIR/frontend-portal-design-impl.md"
'

