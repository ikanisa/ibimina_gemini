---
description: 
---

---
description: Establish CI quality gates for Flutter: formatting, analyze, tests, contract drift checks, dependency auditing, release build verification, and PR templates.
command: /flutter-ci-quality-gates
---

# /flutter-ci-quality-gates (GLOBAL)

## Purpose
Make quality automatic and non-negotiable:
- every PR runs the same checks,
- contracts can’t drift silently,
- dependency risks get flagged early,
- release builds are verified routinely.

This workflow does NOT add product features.

---

## 0) Constraint confirmation (must output)
Confirm:
- No withdrawal / no in-app payment flows exist
- Membership gating is enforced
- Caps enforced (4,000 / 500,000)
- Localization required
- CI should be reproducible and fast

Output:
- Constraints confirmed:
- CI environment assumptions (GitHub Actions / GitLab / other):

---

## 1) Repo scan (read-only)
Identify:
- existing CI configs
- current lint rules
- current test structure
- codegen presence (build_runner, openapi generator, etc.)
- dependency footprint

Output:
- Current CI:
- Current checks:
- Gaps:

---

## 2) Mandatory artifacts (before edits)
### 2.1 PLAN
- Goal:
- In scope:
- Out of scope:
- Approach:
- Rollback:

### 2.2 TASK LIST (Done Criteria)
Each task includes:
- files touched
- done criteria
- evidence

### 2.3 RISKS
- CI flakiness risks:
- Longer build times:
- False positives blocking PRs:
- Mitigations:

### 2.4 TEST PLAN
- validate pipeline on a test PR
- confirm gates fail when expected

---

## 3) Gates
### Gate A — Artifacts Gate
Must PASS before edits.

### Gate B — CI Gate
Must PASS before completion:
- CI runs automatically on PR
- Required checks are enforced
- Clear failure messages exist

---

## 4) Quality gates blueprint (when gates pass)

## 4.1 Baseline gates (must implement)
- flutter format (or dart format)
- flutter analyze (no warnings ignored)
- flutter test (unit + widget)
- build_runner/codegen check (if used)
- localization check (if applicable)
- “no hardcoded colors/text styles” lint strategy (if enforced via custom lint)

Output evidence:
- commands and logs from CI run

---

## 4.2 Contract drift gate (important)
If using OpenAPI:
- regenerate client in CI and fail if git diff is non-empty
If using Supabase schema-based types:
- schema snapshot check (or typed DTO tests)
- fail if API payload changes without updating client

Goal:
- backend changes must force frontend updates (and vice versa)

---

## 4.3 Dependency audit gate
Add checks:
- outdated dependencies report (informational)
- vulnerability scanning where supported
- prohibit adding heavy packages without justification (policy)

Produce:
- docs/DEPENDENCY_POLICY.md:
  - allowed categories
  - review rules for new deps

---

## 4.4 Release build gate (periodic or on tag)
On main or on release tags:
- flutter build apk (release)
- flutter build appbundle (release)
- flutter build ios (if mac runner available)
- ensure version bump policy

Optional:
- size analysis budget (don’t bloat)

---

## 4.5 PR templates + checklists
Add:
- .github/pull_request_template.md (or equivalent)
Include:
- What changed
- Screenshots (if UI)
- How to test
- Checklist:
  - No withdraw/payment flows
  - Caps enforced
  - Membership gating intact
  - Strings localized
  - Dark mode verified
  - PII not logged

---

## 4.6 Test categories (recommended)
- unit tests:
  - validation rules (caps)
  - balance computations (confirmed only)
- widget tests:
  - onboarding screens
  - group gating screens
  - save flow screens
- integration/smoke (optional):
  - deep link routing
  - QR scan flows (simulated)

---

## 5) Deliverables (must provide)
- CI config changes summary
- New policy docs list
- PR template
- Evidence:
  - a CI run passing on a branch
  - intentional failure case (e.g., formatting) produces clear output

---

## 6) Anti-patterns to block
- CI that only runs on main (must run on PRs)
- Ignoring analyze warnings
- Codegen drift not checked
- Allowing dependencies to grow without review
- Huge “everything changed” PRs without gate discipline

---

## Output format (exact)
Return results using this structure:

1) CONSTRAINT CONFIRMATION
2) REPO SNAPSHOT
3) PLAN
4) TASK LIST
5) RISKS
6) TEST PLAN
7) GATE STATUS (A/B: PASS/FAIL)
8) NEXT ACTION (single sentence)
