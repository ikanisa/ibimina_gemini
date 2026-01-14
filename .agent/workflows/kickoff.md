---
description: Kick off any task in our AI-first Staff/Admin monorepo PWAs with a plan, task list, and verification gates
---

# Kickoff Workflow

Use this workflow to properly start any new task or feature work in the Ibimina project.

## 1. Understand the Request

- Clarify the user's objective
- Identify which area of the system is affected (frontend, backend, database, deployment)
- Check if this relates to existing roadmap items in `docs/IMPLEMENTATION_PLAN.md`

## 2. Research & Discovery

- Review relevant existing code and documentation
- Check for existing tests (E2E in `e2e/`, unit tests in `tests/`)
- Identify dependencies and potential conflicts
- Review recent conversation history for related work

## 3. Create Implementation Plan

Write `implementation_plan.md` in the artifacts directory with:

- **Goal Description**: What we're building and why
- **User Review Required**: Any breaking changes or decisions needing approval
- **Proposed Changes**: Grouped by component, with file links
- **Verification Plan**: Exact commands and manual steps

## 4. Create Task List

Write `task.md` in the artifacts directory with:

- Detailed checklist of work items
- Use `[ ]` for uncompleted, `[/]` for in-progress, `[x]` for done
- Group by logical phases (setup, implementation, testing)

## 5. Get User Approval

- Use `notify_user` to request review of `implementation_plan.md`
- Set `BlockedOnUser: true` to wait for approval
- Address feedback before proceeding

## 6. Execute Implementation

- Switch to EXECUTION mode
- Update `task.md` as you progress
- Follow the implementation plan strictly
- Handle errors gracefully

## 7. Verify Changes

- Switch to VERIFICATION mode
- Run all specified tests
- Perform manual verification steps
- Document results in walkthrough

## 8. Create Walkthrough

Write `walkthrough.md` in the artifacts directory with:

- Summary of changes made
- Screenshots/recordings for UI changes
- Test results and validation
- Rollback instructions if applicable

---

## Quick Reference: Key Project Files

| Area | Path |
|------|------|
| Main App | `src/App.tsx` |
| Components | `src/components/` |
| Hooks | `src/hooks/` |
| Supabase | `supabase/` |
| Migrations | `supabase/migrations/` |
| Edge Functions | `supabase/functions/` |
| E2E Tests | `e2e/` |
| Unit Tests | `tests/` |
| Docs | `docs/` |

## Quick Reference: Common Commands

```bash
// turbo-all
# Development
npm run dev

# Build & Preview
npm run build
npm run preview

# Type Check
npm run typecheck

# Tests
npm run test           # Unit tests (Vitest)
npm run e2e            # All E2E tests
npm run e2e:smoke      # Smoke tests only
npm run e2e:ui         # E2E with UI

# Supabase
supabase start         # Local Supabase
supabase db push       # Apply migrations
supabase functions deploy  # Deploy Edge Functions
```
