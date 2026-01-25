---
description: 
---

---
description: Kickoff workflow for a Flutter mobile app — produces plan/tasks/risks/tests, establishes gates, and sets the repo up for safe, high-quality iteration.
command: /kickoff-mobile-flutter
---

# /kickoff-mobile-flutter (GLOBAL)

## Purpose
Create a *repeatable* kickoff that:
- prevents scope creep,
- enforces guardrails,
- produces artifacts before edits,
- and ensures every phase ends with proof (tests + verification).

This workflow MUST NOT modify code until the "Artifacts Gate" is passed.

---

## 0) Triage (30–90 seconds)
Classify the request into ONE primary category:
- FEATURE | BUGFIX | REFACTOR | AUDIT | GO-LIVE | PERFORMANCE | SECURITY | UX-POLISH | DATA-MODEL

Then label the impacted surfaces (select all):
- UI | STATE | AUTH | DATA | STORAGE | NETWORK | DEPLOY | QA | ANALYTICS | SECURITY

Output:
- Primary category:
- Surfaces:
- Success definition (1–2 sentences):

---

## 1) Repo scan (read-only)
Do a fast scan of:
- `/lib` structure
- state management approach (Riverpod/BLoC/etc.)
- routing (go_router/auto_route/etc.)
- theme system
- current auth approach
- existing models & services
- tests folder presence and quality

Deliver a **Repo Snapshot**:
- App entrypoint:
- Routing:
- State mgmt:
- Theme:
- Data layer:
- Tests:
- Build targets:

Do NOT propose changes yet.

---

## 2) Constraints extraction (non-negotiables)
Extract and list constraints from workspace rules (GEMINI.md) + user request.
Split into:
- Product constraints
- Security/privacy constraints
- Data integrity constraints
- UX constraints

Then produce **Constraint Tests** (yes/no checks) like:
- “Is there any withdraw button?” → must be NO
- “Can a user contribute without a group?” → must be NO

---

## 3) Architecture sketch (one page)
Produce a clean architecture sketch (no diagrams needed; just bullets):
- Navigation map (tabs + key screens)
- Data model (entities + relationships)
- State boundaries (what lives where)
- Services (API clients, local cache, analytics)
- Feature flags & localization strategy
- Logging + error handling approach

Keep it implementable.

---

## 4) Deliver the required artifacts (MANDATORY)
### 4.1 PLAN
- Goal:
- In scope:
- Out of scope:
- Approach:
- Dependencies:
- Key decisions:
- Rollback strategy:

### 4.2 TASK LIST (with Done Criteria)
Break tasks into small, verifiable chunks.
Each task MUST have:
- files likely touched
- done criteria (objective)
- test evidence required

### 4.3 RISKS
- Data integrity risks:
- Security/privacy risks:
- UX regressions:
- Operational risks:
- Mitigations:

### 4.4 TEST PLAN
- Automated (unit/widget/integration):
- Manual smoke test script:
- Edge cases:
- Performance checks (if relevant):

---

## 5) Gates (must pass before edits)
### Gate A — Artifacts Gate
Pass if:
- PLAN/TASKS/RISKS/TEST PLAN exist,
- constraints are explicit,
- there’s a clear definition of “done”.

### Gate B — Change Budget Gate
Pass if:
- scope is small enough for one iteration,
- anything “big” is split into phases.

If a gate fails → revise artifacts, do not code.

---

## 6) Execution protocol (when gates pass)
When allowed to proceed:
1) Create branch: `feat/<area>-<shortname>` or `fix/<area>-<shortname>`
2) Implement tasks in order
3) After each task:
   - run tests
   - record evidence
   - update notes

Deliver after implementation:
- Change Summary
- Evidence (commands + results)
- How to Test
- Known limitations

---

## 7) Quality checklist (fintech-grade)
Before declaring “done”:
- No withdrawal flows exist (UI + routes)
- No in-app payments implemented
- Contribution requires group membership
- Amount cap enforced (<= 4,000)
- Wallet cap enforced (<= 500,000)
- Logs do not expose personal data
- Dark mode works
- Strings are localizable
- No dead code / unused deps

---

## 8) What to avoid (common failure modes)
- “Helpful” features not requested
- Big refactors during feature delivery
- Adding heavy packages without justification
- Mixing UI redesign + backend rewrite in one pass
- Any terminal deletes/moves without a dry-run

---

## Output format (exact)
Return results using this structure:

1) TRIAGE
2) REPO SNAPSHOT
3) CONSTRAINTS + CONSTRAINT TESTS
4) ARCHITECTURE SKETCH
5) PLAN
6) TASK LIST
7) RISKS
8) TEST PLAN
9) GATE STATUS (A/B: PASS/FAIL)
10) NEXT ACTION (single sentence)
