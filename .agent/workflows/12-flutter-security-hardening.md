---
description: 
---

---
description: Security hardening for the Flutter group-savings app: threat model, privacy controls, RLS/IDOR checks, secure storage, QR token expiry, rate limiting, and anti-abuse measures.
command: /flutter-security-hardening
---

# /flutter-security-hardening (GLOBAL)

## Purpose
Harden the system against real-world threats while preserving product constraints:
- No withdrawals, no in-app payments.
- MoMo USSD only, proof capture only.
- Private groups must remain private.
- Ledger must remain auditable (append-only).
- Support and ambassadors must not become a privacy leak.

This workflow is about *reducing risk*, not adding features.

---

## 0) Constraint confirmation (must output)
Confirm:
- No withdraw/payment endpoints exist (must remain true)
- One-group-per-user enforced server-side
- Amount cap 4,000 enforced server-side
- Wallet cap 500,000 enforced at confirmation time server-side
- Private group data never accessible to non-members
- QR payloads are opaque tokens (no metadata embedded)
- WhatsApp support messages are privacy-safe by default

Output:
- Constraints confirmed:
- Environment assumptions (Supabase/RLS? custom backend?):

---

## 1) Repo scan (read-only)
Check:
- auth/session handling
- secure storage usage
- logging (PII exposure)
- file upload + storage access policy (evidence)
- QR deep link parsing and validation
- rate limiting mechanisms (server)
- RLS policies and any SECURITY DEFINER functions
- error reporting payloads (PII)

Output:
- Security posture snapshot:
- High-risk hotspots:
- Missing controls:

---

## 2) Mandatory artifacts (before edits)
### 2.1 PLAN
- Goal:
- In scope:
- Out of scope:
- Approach:
- Security acceptance criteria:
- Rollback:

### 2.2 TASK LIST (Done Criteria)
Each task includes:
- where the fix lives (client/backend/db)
- done criteria
- evidence required

### 2.3 RISKS
- Remaining risks after mitigations
- Operational risks (false positives blocking users)
- Mitigation plan

### 2.4 TEST PLAN
- authz tests (RLS/IDOR)
- abuse tests (rate limit / replay)
- privacy tests (no PII in logs/events)
- manual red-team checklist

---

## 3) Gates
### Gate A — Artifacts Gate
Must PASS before edits.

### Gate B — Security Gate
Must PASS before completion:
- No IDOR access paths (cannot access others’ submissions/ledger/groups)
- Private group leakage prevented (server-enforced)
- Evidence storage access controlled
- QR deep links validated + tokens expire
- Rate limits present on high-abuse endpoints

---

## 4) Threat model (must produce)
Create a concise threat model with:
- Assets:
  - user identity (MoMo/WhatsApp numbers)
  - group privacy
  - submission records + evidence
  - ledger integrity
- Actors:
  - normal users
  - malicious users
  - compromised devices
  - curious ambassadors
  - rogue staff (insider risk)
- Entry points:
  - login
  - deep links/QR scans
  - submit contribution proof
  - evidence upload
  - group join/create
  - leaderboard/referral endpoints

Output:
- Top 10 threats ranked by impact × likelihood
- Mitigations mapped to each threat

---

## 5) Hardening blueprint (when gates pass)

## 5.1 Authorization & IDOR prevention (server-side)
Rules:
- Every read/write checks ownership or role.
- Never accept client-provided user_id/group_id without verifying it matches session.

Tests:
- Attempt to fetch another user’s submissions by ID → must fail
- Attempt to fetch private group details without membership → must fail

---

## 5.2 RLS policy audit (if using Supabase)
Checklist:
- groups:
  - approved public visible to all authed users
  - private/pending visible to members + staff only
- memberships:
  - users can only read their own membership rows
- submissions + ledger:
  - users can only read their own
- storage objects (evidence):
  - private bucket + policy owner/staff only

Output:
- RLS matrix table (resource × role × allowed actions)

---

## 5.3 Rate limiting + abuse controls
Protect endpoints:
- /auth/otp/request (SMS OTP abuse)
- /groups/join (spam joins)
- /contributions/submit (spam submissions)
- /contributions/fix (repeat edits)
- /referrals/track (gaming)

Approach:
- server-side throttles by user + device + IP (if available)
- exponential backoff on OTP requests
- cooldown periods (e.g., max N submissions per minute)

Log:
- rate-limit events (no PII)

---

## 5.4 Anti-replay & duplication controls (tx IDs)
Policies:
- momo_tx_id should be unique per user+group (or per group) for a time window
- duplicates go to a review state or auto-reject with reason
- maintain an audit trail for edits

Edge cases:
- same tx id reused legitimately? define policy and document.

---

## 5.5 Evidence upload hardening
Rules:
- evidence is optional; tx id required
- store evidence in private storage with signed URLs
- limit file types and size
- scan/validate MIME type
- strip metadata if possible (EXIF)
- do not expose direct public URLs

Client:
- show privacy warning before upload
- do not auto-share evidence links

---

## 5.6 Deep links / QR token security
Rules:
- token must be opaque, short-lived, and revocable
- validate token server-side before revealing any group summary
- bind token to intent (JOIN vs CONTRIBUTE)
- prevent open redirects
- store pending deep link securely if user not logged in

---

## 5.7 Secure storage + app lock
Client:
- passcode hash stored in secure storage only
- biometrics unlock uses OS APIs
- session tokens in secure storage
- block screenshots on sensitive screens? (optional; consider UX tradeoff)

---

## 5.8 Logging & analytics privacy
Rules:
- never log MoMo/WhatsApp full numbers
- never include tx id in analytics by default
- mask identifiers
- avoid stack traces that print request payloads

Add a “PII lint” checklist for new logs.

---

## 5.9 Insider risk notes (staff/ambassadors)
- staff access must be scoped (institution)
- ambassadors should not have admin visibility by default
- all staff actions logged (audit log)

---

## 6) Deliverables (must provide)
- Threat model summary
- RLS/authz matrix
- Abuse controls list + rate limits
- Deep link token policy (expiry, revocation)
- Evidence upload policy
- How to Test (red-team checklist):
  - private group leakage attempts
  - IDOR attempts
  - replay tx id
  - spam OTP
- Evidence:
  - automated security tests (where possible)
  - manual red-team results

---

## 7) Anti-patterns to block
- Relying on client-side checks for privacy
- Public evidence URLs
- Long-lived join tokens
- Logging tx IDs or phone numbers
- “Security later” plans with no gating

---

## Output format (exact)
Return results using this structure:

1) CONSTRAINT CONFIRMATION
2) REPO SNAPSHOT
3) THREAT MODEL (Top threats + mitigations)
4) PLAN
5) TASK LIST
6) RISKS
7) TEST PLAN (incl. red-team script)
8) GATE STATUS (A/B: PASS/FAIL)
9) NEXT ACTION (single sentence)
