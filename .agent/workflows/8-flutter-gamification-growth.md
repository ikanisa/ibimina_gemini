---
description: 
---

---
description: Implement growth + gamification safely: monthly top groups leaderboard, share cards, referrals, WhatsApp channel CTA, and ambassador program by sector with anti-abuse protections.
command: /flutter-gamification-growth
---

# /flutter-gamification-growth (GLOBAL)

## Purpose
Increase adoption without contaminating core fintech UX:
- All gamification lives in a dedicated “Rewards” tab (or section).
- Leaderboards use CONFIRMED ledger only (no pending).
- Create viral share artifacts (clean images/cards).
- Referrals + ambassador program to drive sector-level onboarding.
- Anti-abuse protections (spam, fake referrals, leaderboard gaming).

This workflow does NOT change savings rules (no withdrawals, no in-app payments).

---

## 0) Constraint confirmation (must output)
Confirm:
- Leaderboards based on confirmed ledger only
- Metric: “average saving per member” per month (or chosen period)
- Top 5 groups monthly
- Referral invites exist (link/code/QR)
- WhatsApp channel CTA exists (no Twilio; direct WhatsApp)
- Ambassador mapping by sector (1 per sector target)
- No “AI” references in UI

Output:
- Gamification scope confirmed:
- KPI targets (assumptions):
- Anti-abuse posture:

---

## 1) Repo scan (read-only)
Identify:
- existing analytics/events
- existing share functionality
- any leaderboard endpoints
- existing group/member counts
- routing + tab structure for Rewards

Output:
- Current growth features:
- Data availability:
- Gaps:

---

## 2) Mandatory artifacts (before edits)
### 2.1 PLAN
- Goal:
- In scope:
- Out of scope:
- Approach:
- Leaderboard computation strategy (server snapshot vs live query):
- Referral tracking strategy:
- Rollback:

### 2.2 TASK LIST (Done Criteria)
Each task includes:
- files touched
- done criteria
- test evidence required

### 2.3 RISKS
- Data integrity (incorrect ranking):
- Privacy (public exposure of private groups):
- Abuse (fake invites, bot signups):
- UX risk (too “gamey” for fintech):
- Mitigations:

### 2.4 TEST PLAN
- unit tests for scoring formulas
- widget tests for Rewards screens
- manual smoke tests
- edge cases: private group, new group, low members, ties

---

## 3) Gates
### Gate A — Artifacts Gate
Must PASS before edits.

### Gate B — Privacy & Fairness Gate
Must PASS before completion:
- Private groups never appear publicly
- Rankings use confirmed ledger only
- Anti-abuse safeguards exist (at least basic)

---

## 4) Implementation blueprint (when gates pass)

## 4.1 Rewards tab IA (must implement)
Rewards Home:
- “Top groups this month” (Top 5)
- “Your group rank” (if member)
- Referral card (“Invite friends”)
- WhatsApp channel card (join)
- Ambassador card (find/apply)

Keep it calm + premium: subtle animation only on success states.

---

## 4.2 Leaderboards (monthly)
### Metric definition (must be explicit)
For each group in the month:
- confirmed_total = sum(confirmed ledger amounts for group in month)
- active_members = number of members (or members with ≥1 confirmed contribution this month — choose one and document)
- score = confirmed_total / active_members  (average saving per member)

Rules:
- Exclude groups not PUBLIC_APPROVED from public leaderboard.
- Private groups can have an internal leaderboard shown only to members + staff.

### Computation strategy (recommendation)
- Prefer server-generated monthly snapshots:
  - scheduled job calculates leaderboard daily or weekly
  - writes LeaderboardSnapshot table
This prevents expensive queries and makes ranking stable.

Display:
- Rank, group name (only if allowed), score (avg/member), member count
- Badges for Top 3 (subtle)

Ties:
- handle ties deterministically (e.g., by total confirmed, then earliest group creation date)

---

## 4.3 Share cards (viral but clean)
Generate a shareable image:
- “Our group saved X RWF this month”
- “Rank #Y in our district” (optional)
- Include app logo + invite code/QR
- No personal names; no phone numbers; no sensitive data

Implementation:
- Render a widget to image and share (platform share sheet)
- Provide “Copy invite link” fallback

---

## 4.4 Referrals
Track:
- referrer_user_id
- referred_user_id
- attribution timestamp
- source: link/QR/code
- conversion:
  - installed app
  - completed profile
  - joined a group (primary)
  - first confirmed contribution (strongest)

Rules:
- A referral only counts when the referred user completes a meaningful conversion (choose and document).

Anti-abuse:
- rate-limit invites
- ignore self-referrals
- detect repeated device/account patterns (basic heuristic)
- optional: staff review for suspicious spikes

---

## 4.5 WhatsApp Channel CTA (direct)
- “Join WhatsApp Channel” button
- opens WhatsApp deep link
No Twilio references or dependencies.

---

## 4.6 Ambassador program (by sector)
Screens:
- “Find your sector ambassador”
  - uses user’s sector to show contact card
- “Become an ambassador”
  - simple application form
  - status: pending/approved/rejected
Ambassador metrics:
- groups onboarded
- members onboarded
- confirmed contributions in first 30 days (optional)

Safeguards:
- ambassadors never see private group data unless they are members/staff
- ambassador contact shown as WhatsApp link only (avoid exposing raw number if possible)

---

## 4.7 UX guardrails
- Keep Rewards visually separate from Wallet/Save
- No “gamified” popups during saving
- No pressure tactics; keep copy positive and optional

---

## 5) Deliverables (must provide)
- Change Summary
- Leaderboard formula + eligibility rules
- Referral attribution model
- Ambassador model + privacy limits
- How to Test:
  - leaderboard excludes private/unapproved public groups
  - share card generated and share sheet opens
  - referrals recorded correctly
  - WhatsApp channel opens
- Evidence:
  - flutter analyze
  - flutter test
  - manual smoke results

---

## 6) Anti-patterns to block
- Showing private groups on public leaderboards
- Using pending submissions in scores
- Reward popups inside contribution flow
- Exposing personal member data in share cards

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
