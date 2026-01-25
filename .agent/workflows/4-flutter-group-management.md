---
description: 
---

---
description: Implement group management: create/join group, public group approval states, private invites, directory search, and enforce one-group-per-user (UI + backend).
command: /flutter-group-management
---

# /flutter-group-management (GLOBAL)

## Purpose
Deliver a complete “Group” feature set that enables:
- Create group (Private/Public)
- Public groups require staff approval before discoverable/joinable
- Join public group via directory
- Join private group via invite code / invite QR
- Invite others via link/QR (growth)
- Enforce: user belongs to exactly one group

This workflow does NOT implement contribution submissions or wallet ledger.

---

## 0) Constraint confirmation (must output)
Confirm:
- Group types: Private (active immediately), Public (pending approval)
- Visibility rules:
  - Private visible only to members + staff managing institution
  - Public visible to all users ONLY after approval
- Joining rule: user can belong to only one group
- Group has minimum contribution per period rule (e.g., 5,000/month)
- App is Rwanda-first, localization-ready

Output:
- Group constraints confirmed:
- Visibility rules confirmed:
- One-group enforcement approach:

---

## 1) Repo scan (read-only)
Identify:
- Existing group tables/endpoints
- Role model (user/staff/admin)
- Existing search/filter infrastructure
- Current navigation structure for Group tab

Output:
- Current group data model:
- Existing endpoints:
- Gaps:

---

## 2) Mandatory artifacts (before edits)
### 2.1 PLAN
- Goal:
- In scope:
- Out of scope:
- Approach (UI + backend):
- Data model changes:
- Approval flow:
- Rollback:

### 2.2 TASK LIST (Done Criteria)
Split into small deliverables, each with:
- files touched
- done criteria
- test evidence required

### 2.3 RISKS
- Data integrity (duplicate membership, race conditions):
- Privacy (private group leakage):
- UX (confusing approval states):
- Mitigations:

### 2.4 TEST PLAN
- unit/widget tests
- integration tests (membership rule)
- manual smoke script

---

## 3) Gates
### Gate A — Artifacts Gate
Must PASS before edits.

### Gate B — Integrity Gate
Must PASS before completion:
- One-group-per-user enforced server-side
- Private group visibility enforced server-side
- Public groups only visible after approval

---

## 4) Implementation blueprint (when gates pass)

## 4.1 Screens (must implement)
Group Tab includes:

### A) Group Home (if user is member)
- Group name + type badge (Private/Public)
- Contribution rule summary (min per period, frequency)
- Member count + members list preview
- Invite actions: Share link, Show invite QR, Copy code
- Group status (Active / Pending approval)
- “Leave group” (if allowed; if leaving is disallowed, show “Contact staff”)

### B) Group Setup (if user NOT member)
- Explanation: “You need a group to save.”
- Primary CTA: Join a group
- Secondary CTA: Create a group
- Private join entry: “Enter invite code”

### C) Public Groups Directory
- Search box
- Filters:
  - District/Sector
  - Min contribution range
  - Group size (optional)
- Group cards:
  - Name
  - Members
  - Min per period
  - Join button

### D) Create Group
- Name
- Type: Private/Public
- Contribution rules:
  - Min per period (number input)
  - Frequency: weekly/monthly/flexible
- Description (optional)
- Confirmation screen with one-group warning

### E) Join Confirmation
- Warning: “You can only belong to one group.”
- Confirm join

### F) Pending Approval Screen (Public groups)
- Status: Pending
- Explanation of approval
- “Edit details” (optional)
- “Contact institution” info

## 4.2 One-group-per-user enforcement
Server-side:
- Add a hard constraint or transactional check to prevent multiple memberships.
- Membership creation must be atomic (avoid race conditions from double taps).

Client-side:
- Prevent UI from showing join/create flows when already a member.
- When joining, show explicit warning + confirmation.

## 4.3 Visibility enforcement
Server-side must enforce:
- Private group is only queryable by members + staff.
- Public group directory returns only APPROVED groups.
- Pending public groups visible only to creator + staff.

Client-side:
- Don’t rely on “hidden UI” for privacy; rely on server filters.

## 4.4 Invite system (growth)
Implement:
- Invite code: short code tied to group
- Invite link: deep link opens app to join flow
- Invite QR: encodes invite link or code

Rules:
- For private groups, invite must not expose group details unless the user is eligible or after code is validated.
- For public groups, joining should still require confirmation.

## 4.5 Staff approval integration (minimal)
Even if staff UI is elsewhere:
- Group has status:
  - PRIVATE_ACTIVE
  - PUBLIC_PENDING
  - PUBLIC_APPROVED
  - PUBLIC_REJECTED
- App displays states clearly.
- Rejected shows reason (if provided) and next steps.

## 4.6 Localization + formatting
- All strings localizable.
- Currency formatting in RWF.
- Phone number masking where shown.

---

## 5) Deliverables (must provide)
- Change Summary
- Updated route map for Group flows
- Data model + status enum summary
- How to Test:
  - create private group and invite
  - create public group and see pending state
  - directory shows only approved groups
  - join private via code/QR
  - verify one-group rule blocks second join
- Evidence:
  - flutter analyze
  - flutter test
  - manual smoke results

---

## 6) Anti-patterns to block
- Client-side-only privacy rules (must be server-enforced)
- Directory showing pending/unapproved groups
- Allowing multiple memberships due to missing constraints
- Exposing private group metadata to non-members

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
