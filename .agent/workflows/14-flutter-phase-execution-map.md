---
description: 
---

---
description: Master execution map tying all workflows together: phases, milestones, acceptance criteria, stop points for review, and a strict “no scope creep” delivery cadence.
command: /flutter-phase-execution-map
---

# /flutter-phase-execution-map (GLOBAL)

## Purpose
Convert the individual workflows into a single delivery program that Antigravity can follow:
- clear phases,
- measurable milestones,
- “stop points” for stakeholder sign-off,
- and acceptance criteria aligned with constraints (no withdrawals, USSD-only, group-only).

This workflow produces a master plan and does not modify code.

---

## 0) Constraints & stakeholders (must output)
Confirm non-negotiables:
- no withdrawals, no in-app payments, MoMo USSD only
- one group per user
- 4,000 RWF cap per tx, 500,000 RWF wallet cap
- public groups require approval
- Rwanda-first, expansion-ready
- no “AI” references in UI

Identify stakeholders (generic):
- end users (members)
- group creators/leaders
- institution staff (approvals + reconciliation)
- ambassadors (sector onboarding)
- internal ops/support

Output:
- Constraints confirmed:
- Stakeholders:

---

## 1) Dependency graph (read-only)
Map workflow dependencies:
- Rules must exist before workflows
- UI system precedes feature screens
- Backend contracts precede deep feature integration
- Auth precedes everything
- Group mgmt precedes contributions
- Contributions precede wallet analytics
- QR and Growth depend on groups
- Release readiness depends on all

Output:
- Ordered dependency list:

---

## 2) Mandatory artifacts (this workflow’s deliverable)
### 2.1 MASTER PLAN (phased)
For each phase include:
- Objective
- Workflows to run
- Deliverables
- Acceptance criteria (must be testable)
- Stop point (who signs off)
- Rollback plan

### 2.2 MILESTONE TABLE
- Milestone name
- Scope
- Entry criteria
- Exit criteria
- Demo script

### 2.3 RISK REGISTER (top 10)
- risk
- likelihood/impact
- mitigation
- owner (role, not person)

### 2.4 PILOT PLAN (Rwanda-first)
- pilot cohort definition (cooperatives)
- onboarding plan
- feedback loop cadence
- success metrics

---

## 3) Gates
### Gate A — Plan Gate
Must PASS before implementation begins:
- phases are sequential and small
- acceptance criteria exist per phase
- stop points exist

### Gate B — Scope Gate
Must PASS per phase:
- no new features added mid-phase
- any new requirement becomes the next phase backlog

---

## 4) Recommended phases (default structure)

## Phase 0 — Foundation (Week 0–1)
Run:
- Starter Rules (workspace)
- General Rules (global)
- /kickoff-mobile-flutter
- /flutter-ui-system

Deliverables:
- UI tokens + theme + components
- Navigation scaffold (tabs)
Acceptance:
- dark mode works
- screens use tokens (no hardcoded styling)
Stop point:
- design/UX review sign-off

---

## Phase 1 — Auth + Onboarding (Week 1–2)
Run:
- /flutter-auth-onboarding
- /flutter-backend-contracts (profile + membership endpoints)

Deliverables:
- login/signup
- passcode + biometrics
- profile + membership lookup routing
Acceptance:
- user cannot reach app without profile completion
- membership found/not found flows correct
Stop point:
- internal team sign-off

---

## Phase 2 — Group Management (Week 2–3)
Run:
- /flutter-group-management
- /flutter-qr-suite (invite + join only; contribution QR optional later)

Deliverables:
- create/join groups
- approval states
- invite link/QR
Acceptance:
- one group per user enforced server-side
- private group not visible to non-members
- public directory shows only approved groups
Stop point:
- staff + cooperative leader sign-off

---

## Phase 3 — Save via USSD (Week 3–4)
Run:
- /flutter-contribution-ussd
- /flutter-security-hardening (for submissions + deep links)

Deliverables:
- amount entry + cap checks
- USSD steps sheet
- tx id submission + statuses
Acceptance:
- cannot submit without membership
- cap 4,000 enforced
- no payment hooks exist
Stop point:
- pilot cohort sign-off (small)

---

## Phase 4 — Wallet/Ledger (Week 4–5)
Run:
- /flutter-wallet-ledger
Deliverables:
- confirmed balance
- pending vs confirmed distinction
- cap visualization
Acceptance:
- confirmed balance uses confirmed ledger only
- wallet cap cues clear, no withdrawal language
Stop point:
- pilot cohort sign-off (expanded)

---

## Phase 5 — Rewards & Growth (Week 5–6)
Run:
- /flutter-gamification-growth
Deliverables:
- top 5 leaderboard
- share cards
- referrals
- ambassador flows
Acceptance:
- private groups not in public leaderboard
- scoring uses confirmed ledger only
Stop point:
- marketing/ops sign-off

---

## Phase 6 — Support + Ops (Week 6–7)
Run:
- /flutter-support-ops
Deliverables:
- help center
- fix rejected flows
- WhatsApp support handoff
- ambassador/staff playbooks
Acceptance:
- users can self-resolve common issues
- WhatsApp messages are privacy-safe by default
Stop point:
- support team sign-off

---

## Phase 7 — Release Readiness (Week 7–8)
Run:
- /flutter-ci-quality-gates
- /flutter-release-readiness
Deliverables:
- CI gates
- QA/UAT scripts
- store metadata docs
- rollout plan
Acceptance:
- P0/P1 = zero
- release builds succeed
- privacy docs ready
Stop point:
- go/no-go decision

---

## 5) Output format (exact)
Return results using this structure:

1) CONSTRAINTS & STAKEHOLDERS
2) DEPENDENCY GRAPH
3) MASTER PLAN (phases)
4) MILESTONE TABLE
5) RISK REGISTER
6) PILOT PLAN
7) GATE STATUS (A/B: PASS/FAIL)
8) NEXT ACTION (single sentence)
