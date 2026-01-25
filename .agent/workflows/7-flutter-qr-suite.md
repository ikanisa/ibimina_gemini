---
description: 
---

---
description: Implement the complete QR suite: invite QR + deep link join, join-by-scan, and optional contribution QR that shortcuts to USSD instructions without enabling in-app payments.
command: /flutter-qr-suite
---

# /flutter-qr-suite (GLOBAL)

## Purpose
Use QR codes to reduce friction and grow the network while keeping your rules intact:
- Invite QR: helps users join groups quickly
- Join-by-scan: scan a code to open join confirmation
- Contribution QR (optional): opens USSD instructions pre-filled (no payment API)
- Deep link support for sharing

This workflow must not leak private group metadata to non-members.

---

## 0) Constraint confirmation (must output)
Confirm:
- QR does NOT initiate payment or withdrawal
- Private group details must not be visible to non-members
- User can belong to only one group; join requires confirmation
- Contribution QR only shortcuts instructions; does not “pay”
- No “AI” references in UI

Output:
- QR feature set confirmed:
- Privacy constraints confirmed:

---

## 1) Repo scan (read-only)
Identify:
- existing QR scanning package usage
- deep link handling (firebase dynamic links / app links / uni_links / go_router deep links)
- current group join routes
- any existing invite codes

Output:
- Current QR/deep link stack:
- Gaps:

---

## 2) Mandatory artifacts (before edits)
### 2.1 PLAN
- Goal:
- In scope:
- Out of scope:
- Approach:
- Payload format & security strategy:
- Rollback:

### 2.2 TASK LIST (Done Criteria)
Each task must include:
- files touched
- done criteria
- test evidence

### 2.3 RISKS
- Privacy leakage (private group metadata exposed):
- QR tampering/replay:
- UX confusion (join vs contribute codes):
- Mitigations:

### 2.4 TEST PLAN
- unit tests for payload parsing/validation
- widget tests for scanner UI
- manual smoke tests (scan each code type)
- edge cases (invalid QR, expired invite, already member)

---

## 3) Gates
### Gate A — Artifacts Gate
Must PASS before edits.

### Gate B — Privacy Gate
Must PASS before completion:
- scanning private invite does not reveal group details until validated/authorized
- public directory rules still apply
- no sensitive data embedded in QR

---

## 4) Implementation blueprint (when gates pass)

## 4.1 Define QR “types”
Use a versioned payload envelope:
- qr_version: 1
- type: INVITE | JOIN | CONTRIBUTE
- token: short-lived or opaque identifier (NOT group name)
- optional params: amount_suggestion (<= 4,000), currency, country

Hard rules:
- Never embed group name, member list, institution details in the QR payload.
- Use an opaque token that the server resolves.

## 4.2 Invite QR flow (Group Home)
From Group screen:
- “Show Invite QR”
- “Share Invite Link”
- “Copy Invite Code”

Invite link:
- opens app route: /join?token=<opaque>
- If app not installed: open lightweight web landing that leads to app install (optional, future)

## 4.3 Join-by-scan flow
Scanner recognizes type INVITE/JOIN:
- Parse payload
- Call server to validate token
- If user already belongs to a group:
  - show blocking message “You already belong to a group.”
- Else:
  - show Join Confirmation screen:
    - minimal group summary only after server confirms user can view it
    - warning: “You can only belong to one group.”
    - confirm join

For private groups:
- show only “You’re joining a private group” until server confirms eligibility (e.g., token valid).

## 4.4 Contribution QR (optional)
Purpose: shortcut user into Save flow with:
- suggested amount (<= 4,000)
- group reference ID for USSD instructions
This QR must not:
- initiate payment
- store or expose sensitive group metadata

Flow:
- Scan CONTRIBUTE QR → routes to Save tab
- Pre-fill amount suggestion (cap enforced)
- Open USSD instruction sheet with reference copied-ready

## 4.5 Scanner UX
- Fullscreen scanner
- Clear hint text: “Scan a group code”
- Torch toggle
- Manual entry fallback for invite code
- Haptic feedback on successful scan
- Error states:
  - invalid code
  - expired code
  - not supported

## 4.6 Deep link strategy
Implement app links/universal links:
- /join?token=...
- /contribute?token=... (optional)

Routing rules:
- If not authenticated: store pending deep link, then proceed after login/profile completion.

---

## 5) Deliverables (must provide)
- Change Summary
- QR payload spec (versioned)
- Deep link routes list
- How to Test:
  - invite QR scanning
  - join confirmation
  - private invite privacy check
  - contribution QR opens USSD instructions
- Evidence:
  - flutter analyze
  - flutter test
  - manual smoke results

---

## 6) Anti-patterns to block
- Embedding private group info in QR payload
- Using QR to trigger payments
- Auto-joining without confirmation
- Allowing join if user already belongs to a group

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
