---
description: 
---

---
description: Implement the MoMo USSD-only contribution flow: amount entry with 4,000 cap, USSD instruction sheet, tx-id capture, optional evidence, submission statuses, and reconciliation-ready data.
command: /flutter-contribution-ussd
---

# /flutter-contribution-ussd (GLOBAL)

## Purpose
Deliver the core “Save” experience without any payment API:
- User enters amount (<= 4,000 RWF)
- App shows MoMo USSD instructions (outside-app payment)
- User returns and submits proof:
  - transaction ID (required)
  - optional screenshot/evidence
- Submission tracked with statuses: Pending / Confirmed / Rejected
- Enforce membership required to access Save flow

This workflow does NOT implement staff approval tooling; it only prepares data for reconciliation.

---

## 0) Constraint confirmation (must output)
Confirm these must be enforced:
- Must be a member of exactly one group to contribute
- Max per contribution tx: 4,000 RWF
- Unlimited transactions/day
- Wallet max: 500,000 RWF (block when exceeded)
- No payment API; MoMo USSD only
- App never uses “Pay/Withdraw/Send” language

Output:
- Constraints confirmed:
- UX copy style (calm, clear):

---

## 1) Repo scan (read-only)
Identify:
- existing wallet/ledger models (if any)
- file storage approach (if evidence screenshots allowed)
- existing validation utilities
- routing to Save tab and gating patterns

Output:
- Current models:
- Storage:
- Gaps:

---

## 2) Mandatory artifacts (before edits)
### 2.1 PLAN
- Goal:
- In scope:
- Out of scope:
- Approach:
- Data model changes:
- Evidence storage policy:
- Rollback:

### 2.2 TASK LIST (Done Criteria)
Each task must include:
- files likely touched
- done criteria
- test evidence required

### 2.3 RISKS
- Data integrity (duplicate tx IDs, mismatched amounts):
- Fraud/misuse (fake tx ID, screenshot reuse):
- Privacy (evidence images):
- UX drop-offs:
- Mitigations:

### 2.4 TEST PLAN
- unit tests for validation + caps
- widget tests for Save flow
- manual smoke script
- edge cases (offline, max balance, typos in tx id)

---

## 3) Gates
### Gate A — Artifacts Gate
Must PASS before edits.

### Gate B — Compliance Gate
Must PASS before completion:
- No in-app payments introduced
- All caps enforced (4,000 / 500,000)
- Membership required before any submission

---

## 4) Implementation blueprint (when gates pass)

## 4.1 Save Tab states (must implement)
### State 1: Not a member
- Show locked screen:
  - “You need a group to save.”
  - CTA: Go to Group Setup
No amount entry shown.

### State 2: Member
Show:
- “This period target” (from group rule)
- Progress (confirmed ledger only; pending separate)
- Primary action: “Contribute via MoMo USSD”

---

## 4.2 Contribution entry (amount + validation)
UI:
- amount field (numeric)
- quick chips: 1,000 / 2,000 / 4,000
- helper text: “Max per transaction: 4,000 RWF”
Validation:
- amount > 0
- amount <= 4,000
- If wallet_balance + amount > 500,000 → block with message

---

## 4.3 USSD instructions (Bottom Sheet)
When user taps “Show MoMo steps”:
- Present a bottom sheet with:
  - Step-by-step USSD instructions
  - Group reference ID (copy button)
  - “I have completed the MoMo step” CTA

Rules:
- No hardcoding sensitive USSD flow if it varies; use server-configurable instruction templates.
- Keep to “Dial *182#” + abstracted menu steps where possible.

---

## 4.4 Proof capture (tx id + optional evidence)
After user returns:
- Required: Transaction ID input
- Optional: Add screenshot (upload)
- Optional: Notes (short)
- Submit button: “Submit contribution”

Client-side safeguards:
- tx id format basic validation (length/allowed chars)
- prevent double submit (disable button while sending)

Server-side safeguards:
- idempotency: prevent same tx id for same user/group (or flag duplicates)
- status default = PENDING

---

## 4.5 Submission status UI
Contribution history list with:
- amount
- date/time
- status pill: Pending / Confirmed / Rejected
- tx id (masked or partial)
- “Fix” action for Rejected:
  - edit tx id
  - re-upload evidence (optional)

---

## 4.6 Reconciliation-ready data model (must exist)
Minimum entities:
- ContributionSubmission:
  - id, user_id, group_id
  - amount
  - momo_tx_id
  - submitted_at
  - status (PENDING/CONFIRMED/REJECTED)
  - evidence_url (optional)
  - rejection_reason (optional)
- LedgerEntry (confirmed only):
  - id, user_id, group_id
  - amount
  - confirmed_at
  - source_submission_id
Append-only rule for LedgerEntry.

---

## 4.7 UX copy rules (hard)
Use:
- “Contribute”
- “Submit”
- “Savings wallet”
Never use:
- Pay / Withdraw / Transfer / Send

---

## 5) Deliverables (must provide)
- Change Summary
- Save flow route map + state diagram (bullets)
- Validation rules checklist
- How to Test:
  - member vs non-member gating
  - amount cap (4,000)
  - wallet cap (500,000)
  - tx id capture + status list
- Evidence:
  - flutter analyze
  - flutter test
  - manual smoke results

---

## 6) Anti-patterns to block
- Implementing payment API hooks “for later”
- Allowing contribution submission without membership
- Trusting client-only validation for caps
- Storing evidence publicly accessible
- Editing confirmed ledger entries instead of append-only

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
