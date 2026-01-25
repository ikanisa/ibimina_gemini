---
description: 
---

---
description: Implement fintech-grade onboarding: login/signup (email, Google, SMS OTP), app passcode + biometrics toggle, profile completion, and group membership lookup + routing.
command: /flutter-auth-onboarding
---

# /flutter-auth-onboarding (GLOBAL)

## Purpose
Deliver a production-ready onboarding flow that is:
- fast (60–90s to “Home”),
- secure (passcode + optional biometrics),
- clear (minimal screens, one primary action),
- aligned with constraints:
  - user MUST belong to exactly one group to contribute later.

This workflow DOES NOT implement contributions, wallet logic, or payments.

---

## 0) Inputs & constraints check (must output)
Confirm:
- Auth methods required: Email, Google, SMS OTP
- Profile fields: full name, MoMo number, WhatsApp number (+ optional district/sector)
- Membership lookup occurs after profile completion
- User may have: group found OR no group (must join/create)
- No “AI” references in UI text

Output:
- Confirmed auth methods:
- Profile fields:
- Membership outcomes:
- UX tone (short, calm, fintech):

---

## 1) Repo scan (read-only)
Identify:
- Existing auth provider (Firebase/Supabase/custom)
- Routing library (go_router, auto_route, Navigator 2)
- State mgmt (Riverpod/BLoC/etc.)
- Existing secure storage usage
- Existing user/profile tables and APIs

Output:
- Current auth stack:
- Routing:
- State management:
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
- API endpoints needed:
- Rollback:

### 2.2 TASK LIST (Done Criteria)
Each task must include done criteria + test evidence.

### 2.3 RISKS
- Security risks (OTP abuse, account takeover, weak passcode handling):
- Privacy risks (phone number exposure):
- UX risks (drop-offs, confusing membership states):
- Mitigations:

### 2.4 TEST PLAN
- flutter test coverage targets
- manual smoke script
- edge cases (wrong OTP, network offline, existing user w/ group, new user no group)

---

## 3) Gates
### Gate A — Artifacts Gate
Must PASS before code changes.

### Gate B — Security Gate
Must PASS before completion:
- passcode stored securely (never plain prefs)
- biometrics gating works
- PII not logged

---

## 4) Implementation blueprint (when gates pass)

## 4.1 Navigation map (must implement)
Screens:
- Welcome
- Sign up / Log in chooser
- Email auth flow (signup/login)
- Google sign-in
- Phone OTP flow
- Create passcode
- Biometrics toggle (optional step or combined)
- Profile completion
- Membership checking
- Membership result:
  - Group found → route to Home
  - No group → route to Group Setup (join/create)

Rule:
- One primary CTA per screen.
- Avoid long forms: use multi-step profile if needed.

## 4.2 Security layer
Implement:
- App lock (passcode gate) on app start/resume
- Optional biometrics to unlock
- Failed attempts throttling (basic)
- Session timeout policy (lightweight)

Storage rules:
- Passcode hash/derivation stored in secure storage (Keychain/Keystore)
- Never store raw passcode
- Use secure storage for sensitive session tokens

## 4.3 Profile + identity rules
- Require MoMo number + WhatsApp number
- Validate formats minimally (Rwanda phone format)
- Mask numbers in UI where appropriate
- momo_number becomes the primary lookup key for membership

## 4.4 Membership lookup
After profile save:
- Show “Checking your membership…” screen with loading state
- Call membership lookup endpoint using momo_number (and fallback keys)
- Outcomes:
  - Found: show group summary card + “Continue”
  - Not found: show explanation + 2 CTAs:
    - Join a group
    - Create a group
  - Error: retry + support message

Hard rule:
- Do NOT route into contribution flows without membership.

## 4.5 Local caching
Cache:
- user profile
- membership summary
So Home loads quickly.

## 4.6 Observability
- Add minimal analytics events (no PII):
  - onboarding_started
  - auth_success
  - profile_completed
  - membership_found / membership_not_found
- Log errors safely with masked identifiers.

---

## 5) Deliverables (must provide)
- Change Summary
- Route map
- Data flow diagram (bullets)
- How to Test:
  - email signup
  - google signup
  - phone OTP signup
  - existing user login
  - membership found / not found scenarios
- Evidence:
  - flutter analyze
  - flutter test
  - manual smoke checklist results

---

## 6) Anti-patterns to block
- No “skip passcode” in fintech mode (unless explicitly allowed by product)
- No printing phone numbers/tokens in logs
- No direct navigation to Home without profile completion
- No membership-dependent features shown when not a member

---

## Output format (exact)
Return results using this structure:

1) INPUTS & CONSTRAINTS
2) REPO SNAPSHOT
3) PLAN
4) TASK LIST
5) RISKS
6) TEST PLAN
7) GATE STATUS (A/B: PASS/FAIL)
8) NEXT ACTION (single sentence)
