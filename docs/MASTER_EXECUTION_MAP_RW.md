# MASTER EXECUTION MAP (Ibimina Flutter App)

**Scope:** Rwanda-First Group Micro-Savings
**Generated:** 2026-01-25

---

## 1) CONSTRAINTS & STAKEHOLDERS

### Non-Negotiable Constraints
1.  **NO Withdrawals:** The app has no withdrawal button or functionality.
2.  **NO In-App Payments:** All contributions occur via MoMo USSD (outside app); app captures proof/ledger only.
3.  **One Group Per User:** Strict 1:1 user-to-group mapping enforced server-side.
4.  **Transaction Caps:** Max 4,000 RWF per contribution.
5.  **Wallet Caps:** Max 500,000 RWF total wallet balance.
6.  **Public Group Approval:** Public groups are invisible until Staff approved.
7.  **No "AI" references:** UI/UX must be human-centric and simple (Soft Liquid Glass).

### Stakeholders
-   **End Users (Members):** Rwanda-based cooperative members. Low-to-mid tech literacy.
-   **Group Leaders:** Creators/Admins of specific savings groups. Responsible for inviting members.
-   **Institution Staff:** Approvers of public groups; reconcilers of ledger discrepancies.
-   **Ambassadors:** Field agents onboarding new sectors/cooperatives.
-   **Internal Ops/Support:** Handling tickets and WhatsApp handoffs.

---

## 2) DEPENDENCY GRAPH

1.  **Rules & Standards** (Foundation)
    -   *Precedes all code.*
2.  **UI System** (`packages/ui`)
    -   *Precedes all feature screens.*
3.  **Auth & Backend Contracts**
    -   *Precedes Profile, Groups, and Contributions.*
4.  **Group Management**
    -   *Precedes Contributions (User must be in a group).*
    -   *Precedes QR (Invite needs Group ID).*
5.  **Contributions (USSD)**
    -   *Precedes Wallet/Ledger (Data source).*
6.  **Wallet & Ledger**
    -   *Precedes Analytics & Leaderboards.*
7.  **Growth & Rewards**
    -   *Dependent on stable Ledger.*
8.  **Release Readiness**
    -   *Dependent on all features completing acceptance.*

---

## 3) MASTER PLAN (Phases)

### Phase 0: Foundation (Week 0-1)
-   **Goal:** Establish design system, workspace rules, and navigation scaffold.
-   **Workflows:** `/flutter-ui-system`
-   **Deliverables:** UI Tokens, Theme (Dark Mode), Tab Scaffold.
-   **Acceptance:** Screens use tokens only; switching themes works; no hardcoded colors.
-   **Stop Point:** Design/UX Review Sign-off.

### Phase 1: Auth + Onboarding (Week 1-2)
-   **Goal:** Secure user identity and profile creation.
-   **Workflows:** `/flutter-auth-onboarding`, `/flutter-backend-contracts`
-   **Deliverables:** Phone/OTP Login (Simulated), Passcode/Bio, Profile Setup.
-   **Acceptance:** Unknown user -> Onboarding -> Profile -> Home.
-   **Stop Point:** Internal Team Sign-off.

### Phase 2: Group Management (Week 2-3)
-   **Goal:** Enable users to form and join single groups.
-   **Workflows:** `/flutter-group-management`, `/flutter-qr-suite` (Invite/Join).
-   **Deliverables:** Create Group, Join (Code/QR), Member List, Leave Group.
-   **Acceptance:** User limited to 1 group. Private groups hidden from search.
-   **Stop Point:** Staff + Co-op Leader Sign-off.

### Phase 3: Save via USSD (Week 3-4)
-   **Goal:** The core loop: logging a contribution made via USSD.
-   **Workflows:** `/flutter-contribution-ussd`
-   **Deliverables:** Contribution Form (> USSD Trigger > Confirm TX ID).
-   **Acceptance:** Cap checks (4k limit). No API payment hooks. Membership check.
-   **Stop Point:** Pilot Cohort Sign-off (Small).

### Phase 4: Wallet & Ledger (Week 4-5)
-   **Goal:** Visualize the savings.
-   **Workflows:** `/flutter-wallet-ledger`
-   **Deliverables:** Wallet Screen, Transaction History (Pending vs Confirmed).
-   **Acceptance:** Balance accuracy. Clear "No Withdraw" messaging.
-   **Stop Point:** Pilot Cohort Sign-off (Expanded).

### Phase 5: Rewards & Growth (Week 5-6)
-   **Goal:** Drive engagement.
-   **Workflows:** `/flutter-gamification-growth`
-   **Deliverables:** Leaderboards (Top 5), Share Cards.
-   **Acceptance:** Private groups excluded from global leaderboards.
-   **Stop Point:** Marketing/Ops Sign-off.

### Phase 6: Support + Ops (Week 6-7)
-   **Goal:** Ensure sustainment and support.
-   **Workflows:** `/flutter-support-ops`
-   **Deliverables:** Help Center, WhatsApp Redirects.
-   **Acceptance:** User can find help without calling.
-   **Stop Point:** Support Team Sign-off.

### Phase 7: Release Readiness (Week 7-8)
-   **Goal:** Ship to stores.
-   **Workflows:** `/flutter-ci-quality-gates`, `/flutter-release-readiness`
-   **Deliverables:** Store Assets, Privacy Policy, Release Build.
-   **Acceptance:** Critical Bugs = 0.
-   **Stop Point:** GO/NO-GO Decision.

---

## 4) MILESTONE TABLE

| Milestone | Scope | Entry Criteria | Exit Criteria |
| :--- | :--- | :--- | :--- |
| **M1: Alpha** | Phases 0-2 (Auth, UI, Groups) | Dev Env Ready | User can login, create profile, create/join group. |
| **M2: Beta (Functioning)** | Phases 3-4 (Contributions, Ledger) | M1 Signed-off | User can "save" (log USSD tx), see balance update (pending). |
| **M3: Release Candidate** | Phases 5-6 (Growth, Support) | M2 Signed-off | Feature complete, Leaderboards live, Support active. |
| **M4: Gold Master** | Phase 7 (Quality) | M3 Audit Pass | No P0/P1 bugs. Store approval. |

---

## 5) RISK REGISTER

| Risk | Likelihood/Impact | Mitigation | Owner |
| :--- | :--- | :--- | :--- |
| **Fake Transaction IDs** | High / High | Manual reconciliation by Staff (Ledger = Pending until confirmed). | Ops |
| **User confusion on "No Withdraw"** | Med / High | Explicit microcopy; "Group-only" messaging during onboarding. | Product/UX |
| **Wallet Cap exceeded (>500k)** | Low / High | Hard server-side enforcement; block contributions at 496k+. | Backend Lead |
| **Expansion blocked by hardcoding** | Low / Med | Use config for currency/regex; Avoid "RW" strings in code logic. | Tech Lead |
| **USSD Offline/Changed** | Med / High | App only provides instructions; user dials manually. Low tech dependency. | Ops |

---

## 6) PILOT PLAN (Rwanda-First)

-   **Cohort:** 3 Selected Cooperatives (approx. 50 users total).
-   **Onboarding:** In-person with Ambassadors (Phase 6 playbook).
-   **Feedback:** Weekly WhatsApp check-ins with Group Leaders.
-   **Success:** 80% active contribution rate (weekly) over 4 weeks.

---

## 7) GATE STATUS

-   **Gate A (Plan Gate):** **PASS** ✅
    -   *Phases are sequential, criteria defined, stop points set.*
-   **Gate B (Scope Gate):** **PASS** ✅
    -   *Scope rigidly locked to constraints (No withdrawals, USSD only).*

---

## 8) NEXT ACTION

Begin **Phase 0** by running `/flutter-ui-system` to establish the visual foundation.
