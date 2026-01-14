---
description: Multi-agent orchestration template (UI / Backend / QA / Integrator)
---

# Parallel-Split Workflow

Use this workflow when a task is large enough to benefit from parallel execution across multiple focus areas.

## Roles

| Role | Focus | Key Files |
|------|-------|-----------|
| **UI Agent** | Components, pages, styling, animations, responsive fixes | `src/components/`, `src/design/`, `tailwind.config.js` |
| **Backend Agent** | Supabase schema, RLS, Edge Functions, hooks, API | `supabase/`, `src/hooks/`, `src/lib/` |
| **QA Agent** | E2E tests, unit tests, fixtures, coverage | `e2e/`, `tests/`, `vitest.config.ts` |
| **Integrator** | Merge, conflict resolution, final verification | All areas |

## Workflow Steps

### 1. Scope Definition (Integrator)
- Review the feature/fix request
- Break work into track-specific briefs
- Define shared contracts (types, API shape, mock data)
- Assign briefs to agents

### 2. Agent Briefs (Integrator creates for each agent)
Each brief must include:
```markdown
## [Agent Role] Brief: [Feature Name]

### Objective
[What this agent must deliver]

### Scope (files to touch)
- [ ] File 1
- [ ] File 2

### Dependencies
- Needs [X] from [other agent]
- Must not break [existing feature]

### Deliverables
1. Mini Plan (what you'll change)
2. Mini Task List (checkboxes)
3. Implementation (code changes)
4. Verification evidence (test results, screenshots)
5. Handoff notes (what Integrator needs to know)
```

### 3. Parallel Execution
- Each agent works independently
- No drive-by refactors outside scope
- Small diffs, incremental commits
- Update mini task list as you progress

### 4. Handoff to Integrator
Each agent provides:
- [ ] List of files changed
- [ ] Test commands run + results
- [ ] Screenshots/recordings (for UI)
- [ ] Known issues or risks
- [ ] Merge conflicts (if any)

### 5. Integration (Integrator only)
- Merge all changes
- Resolve conflicts
- Run full test suite
- Verify RBAC (UI + API + DB/RLS)
- Create consolidated walkthrough

### 6. Final Verification
- Run `/audit` workflow
- Address top issues
- Verify deployment readiness
- Integrator declares "DONE"

---

## Quick Commands

```bash
// turbo-all
# Development
npm run dev

# Type check
npm run typecheck

# Unit tests
npm run test

# E2E tests
npm run e2e
npm run e2e:smoke

# Build verification
npm run build
npm run preview
```

## Non-Negotiables

1. **Artifacts**: Every agent produces Implementation + Task List + Handoff
2. **RBAC**: Staff/Admin enforced in UI + API + DB/RLS
3. **States**: Loading + Empty + Error states on every page
4. **Motion**: Subtle, purposeful, respects reduced-motion
5. **Mobile-first**: Touch-friendly, responsive
6. **No duplicates**: Extend existing tables/functions/components
