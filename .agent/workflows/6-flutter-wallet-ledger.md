---
description: 
---

---
description: Implement the Savings Wallet as a ledger viewer: confirmed balance, pending submissions, period progress, transaction list, and visual cap cues—no withdrawals, no payments.
command: /flutter-wallet-ledger
---

# /flutter-wallet-ledger (GLOBAL)

## Purpose
Deliver a clean “Wallet” experience that:
- shows confirmed savings balance (ledger-based),
- separates Pending vs Confirmed contributions,
- shows progress toward period minimum rule,
- prevents any “withdraw” or “payment” mental model,
- communicates the 500,000 RWF cap clearly.

This workflow does NOT implement any withdrawal or transfer actions (ever).

---

## 0) Constraint confirmation (must output)
Confirm:
- Wallet is savings-only ledger view
- No withdrawal, no payment, no send/transfer
- Balance derived from CONFIRMED ledger entries only
- Pending submissions shown separately
- Wallet cap 500,000 RWF enforced and communicated

Output:
- Constraints confirmed:
- Balance derivation confirmed:

---

## 1) Repo scan (read-only)
Identify:
- existing wallet screens (if any)
- existing models: LedgerEntry, ContributionSubmission
- existing formatting utils for currency and dates
- where “Home” vs “Wallet” fits in navigation

Output:
- Current wallet implementation:
- Current models:
- Gaps:

---

## 2) Mandatory artifacts (before edits)
### 2.1 PLAN
- Goal:
- In scope:
- Out of scope:
- Approach:
- Data queries needed:
- Rollback:

### 2.2 TASK LIST (Done Criteria)
Each task includes:
- files touched
- done criteria
- test evidence

### 2.3 RISKS
- Data correctness (double counting, time window issues):
- UX confusion (pending vs confirmed):
- Performance (long lists):
- Mitigations:

### 2.4 TEST PLAN
- unit tests: balance calculation, cap logic
- widget tests: rendering states
- manual smoke script

---

## 3) Gates
### Gate A — Artifacts Gate
Must PASS before edits.

### Gate B — Clarity Gate
Must PASS before completion:
- No screen implies money can be withdrawn
- Pending/confirmed distinction is obvious
- Balance uses confirmed only

---

## 4) Implementation blueprint (when gates pass)

## 4.1 Wallet screen layout (must implement)
### Header section
- “Savings wallet”
- Confirmed Balance (large)
- Small caption: “Confirmed savings”
- Cap indicator:
  - “Limit: 500,000 RWF”
  - Progress bar showing balance / cap (subtle)

### Period progress section
Based on group rules:
- “This month’s minimum” (or current period)
- Progress bar: confirmed contributions this period
- Show remaining amount

### Pending section
- “Pending confirmations”
- Sum of pending amounts + count
- List of pending submissions (tap → details)

### Transactions list (Confirmed ledger entries)
- List items show:
  - amount
  - date/time
  - label (e.g., “Contribution confirmed”)
  - reference (partial tx id or submission id)

Rules:
- Avoid dense data; keep it readable.
- Support empty states cleanly.

---

## 4.2 Transaction detail screen (optional but recommended)
When user taps an item:
- amount
- status (confirmed/pending/rejected)
- timestamps
- tx id (masked)
- evidence (if they uploaded)
- If rejected → “Fix submission” CTA (routes to edit tx id/evidence)

---

## 4.3 Data logic (must be correct)
Balance:
- sum(confirmed LedgerEntry amounts) for current user in group
Pending total:
- sum(PENDING ContributionSubmission amounts)

Period progress:
- sum(confirmed LedgerEntry amounts within current period window)
Period definition:
- derived from group frequency rule
- do not hardcode “month” if group supports weekly

Cap logic:
- If confirmed balance >= 500,000:
  - show “At limit” state
  - Save flow should block new submissions
- If adding a new amount would exceed cap:
  - block submission (handled in Save workflow)
Wallet should show explanatory copy.

---

## 4.4 Performance + pagination
If transactions can be many:
- implement pagination / infinite scroll
- show skeleton loaders
- cache recent ledger entries locally

---

## 4.5 Formatting + localization
- Currency format: RWF
- Dates localized
- Strings localizable

---

## 5) Deliverables (must provide)
- Change Summary
- Wallet UI map (sections)
- Balance/progress formulas (explicit)
- How to Test:
  - empty wallet
  - pending submissions exist
  - confirmed ledger entries exist
  - cap boundary (near 500,000)
- Evidence:
  - flutter analyze
  - flutter test
  - manual smoke results

---

## 6) Anti-patterns to block
- Showing “available balance” language that implies withdrawal
- Mixing pending and confirmed into one number
- Counting pending as part of confirmed balance
- Allowing any action that moves money

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
