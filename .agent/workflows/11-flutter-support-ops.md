---
description: 
---

---
description: Add support + operations readiness: in-app help, FAQs, dispute flows for rejected submissions, WhatsApp support handoff, ambassador/staff playbooks, and incident-ready ops docs.
command: /flutter-support-ops
---

# /flutter-support-ops (GLOBAL)

## Purpose
Make the product operable in the real world:
- Users will mistype MoMo tx IDs.
- Public groups will be pending/rejected.
- Ambassadors will need onboarding scripts.
- Support needs fast resolution flows without exposing sensitive data.

This workflow adds:
- In-app Help center (FAQs + guided fixes)
- Dispute/fix flow for rejected submissions
- WhatsApp support handoff (direct)
- Operational playbook docs for staff/ambassadors
- Basic incident readiness (service status messaging)

No new financial functionality. No withdrawals. No in-app payments.

---

## 0) Constraint confirmation (must output)
Confirm:
- Support via WhatsApp (direct), no Twilio references
- Users can fix rejected submissions (edit tx id, re-upload evidence)
- Private group privacy preserved in support flows
- No PII leakage in logs, screenshots, support exports
- Rwanda-first operational model (district/sector ambassadors)

Output:
- Support channels confirmed:
- Dispute scope confirmed:
- Privacy constraints confirmed:

---

## 1) Repo scan (read-only)
Identify:
- existing Settings/Profile screen
- existing “Contact us” points
- current error handling + empty states
- existing FAQ/help docs or CMS usage
- how errors are surfaced (snackbars/dialogs)

Output:
- Current support entry points:
- Current error UX:
- Gaps:

---

## 2) Mandatory artifacts (before edits)
### 2.1 PLAN
- Goal:
- In scope:
- Out of scope:
- Approach:
- Help content strategy (static markdown vs remote config):
- Rollback:

### 2.2 TASK LIST (Done Criteria)
Each task includes:
- files touched
- done criteria
- test evidence

### 2.3 RISKS
- Privacy risk (users sharing screenshots with sensitive info):
- Support load risk (too many manual escalations):
- Abuse risk (spam WhatsApp):
- Mitigations:

### 2.4 TEST PLAN
- widget tests for help flows
- manual smoke for WhatsApp handoff
- edge cases: offline, rejected submission fix, pending group approval

---

## 3) Gates
### Gate A — Artifacts Gate
Must PASS before edits.

### Gate B — Privacy Gate
Must PASS before completion:
- Help flows never reveal private group info to non-members
- Support handoff messages do not include full PII by default
- Screenshots/evidence handled safely

---

## 4) Implementation blueprint (when gates pass)

## 4.1 In-app Help Center (must implement)
Location:
- Profile/Settings → Help

Sections:
1) Getting started
2) Groups (create/join/public approval)
3) Contributing via MoMo USSD
4) Pending/confirmed/rejected statuses
5) Wallet limits (4,000 per tx; 500,000 cap)
6) QR invites
7) Rewards & ambassadors
8) Troubleshooting

Design:
- searchable list
- each article short, step-by-step
- include inline “Fix it” buttons linking to the right screen

Content storage:
- Prefer local markdown/JSON first (fast + predictable)
- Optionally support remote config later

---

## 4.2 “Fix rejected submission” guided flow
From Contribution history or Wallet:
- Rejected item → “Fix submission” CTA
Wizard steps:
1) Explain why rejected (reason shown)
2) Re-enter tx id (format help)
3) Optional: re-upload evidence
4) Submit update
5) Show status back to Pending

Safeguards:
- Throttle repeated edits (anti-spam)
- Keep audit trail of edits (server-side)

---

## 4.3 “Why is my contribution pending?” flow
Provide a clear explanation:
- Pending means staff/system hasn’t matched yet
- expected time window (configurable)
- “If it’s been too long” CTA:
  - check tx id format
  - resubmit evidence
  - contact support

---

## 4.4 WhatsApp support handoff (direct)
Provide “Contact support on WhatsApp” buttons in:
- Help center
- Rejected flow
- Pending-too-long flow
- Group approval screens

Message template (privacy-safe):
- Include:
  - app user ID (not phone)
  - group ID (if member)
  - submission ID (if applicable)
  - short problem category
Avoid:
  - full phone numbers
  - full tx id unless user explicitly chooses “include tx id”

Add toggles:
- “Include my transaction ID” (off by default)
- “Include screenshot evidence link” (off by default)

---

## 4.5 Ambassador operational playbooks (docs)
Create docs for field onboarding:

- docs/AMBASSADOR_PLAYBOOK_RW.md
  - how to onboard a group
  - how to help users install app
  - how to help profile setup
  - how to share invite QR/link
  - how to explain USSD contributions
  - how to handle common errors

- docs/STAFF_SUPPORT_PLAYBOOK.md
  - public group approvals
  - reconciling submissions
  - handling duplicates
  - rejecting with reasons
  - privacy do/don’t

- docs/FAQ_CONTENT.md (source of truth)

---

## 4.6 In-app status messaging (lightweight)
Add a simple “Service status” area in Help:
- “All systems operational” / “Partial issues”
- Powered by a remote config flag (optional)
So support can reduce ticket volume during incidents.

---

## 4.7 Support analytics (privacy-safe)
Track events (no PII):
- help_opened
- faq_opened_topic
- whatsapp_support_clicked
- rejected_fix_started/completed
- pending_help_opened

Use this to identify where users get stuck.

---

## 5) Deliverables (must provide)
- Change Summary
- Help Center IA (topic list)
- WhatsApp templates (with privacy toggles)
- Operational docs list + file paths
- How to Test:
  - open help, search, open article
  - rejected submission fix flow
  - pending help → WhatsApp handoff
- Evidence:
  - flutter analyze
  - flutter test
  - manual smoke results

---

## 6) Anti-patterns to block
- Pre-filling WhatsApp messages with full phone numbers or secrets
- Encouraging users to share sensitive screenshots publicly
- Support screens that expose private group info to non-members
- “Contact support” as the only solution (must provide self-serve fixes)

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
