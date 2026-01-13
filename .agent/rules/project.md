# Workspace Rules — ibimina_gemini

## Identity
- Monorepo internal system with TWO primary profiles: Staff and Admin.
- AI-first autonomous agent system delivered as a modern PWA.

## UX/Design non-negotiables
- Minimalist, enforce consistency, “Soft Liquid Glass” where appropriate.
- Responsive across breakpoints.
- Subtle motion (must respect reduced-motion).
- Every page: loading + empty + error states (no blank screens).

## Security non-negotiables
- Staff/Admin RBAC must be enforced in UI + API/server + DB/RLS (when used).
- Never UI-only permissions.
- Least privilege for tools, tokens, and browser access.

## Quality gates (must list exact commands in Walkthrough)
- lint:
- typecheck:
- tests:
- build:
- manual smoke:
  - Staff core flow:
  - Admin core flow:

## Repo boundaries (fill in as you discover)
- apps/ contains:
- packages/ contains:
- supabase/ contains:
