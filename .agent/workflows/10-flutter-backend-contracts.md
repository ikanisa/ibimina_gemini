---
description: 
---

---
description: Define and enforce backend contracts for the Flutter savings app: schemas, enums, API endpoints, server-side constraints (one-group, caps, privacy), reconciliation pipeline, and typed client generation.
command: /flutter-backend-contracts
---

# /flutter-backend-contracts (GLOBAL)

## Purpose
Make Flutter ↔ Backend integration boring and reliable by:
- defining a single source of truth for contracts (schemas + endpoints),
- enforcing all product rules server-side (never UI-only),
- generating typed clients so the app cannot “drift” from the backend,
- and ensuring privacy rules (private groups) are enforced at query time.

This workflow targets Supabase-style backends (Postgres + RLS + Edge/Functions), but is compatible with any backend.

---

## 0) Constraint confirmation (must output)
Confirm server-side non-negotiables:
- No withdrawal endpoints exist.
- No payment API endpoints exist. Contributions happen outside the app; app submits proof only.
- User must belong to exactly one group to submit contributions.
- Max per contribution = 4,000 RWF.
- Wallet cap = 500,000 RWF (confirmed ledger balance).
- Public groups visible only after staff approval.
- Private groups visible only to members + authorized staff.
- Leaderboards computed from CONFIRMED ledger only.
- Rwanda-first, but schema supports multi-country expansion via config/feature flags.

Output:
- Constraints confirmed:
- Backend pattern assumed (Supabase/RLS + Edge Functions etc.):

---

## 1) Repo scan (read-only)
Check for:
- existing schema migrations
- RLS policies
- Edge/Functions folder
- existing REST/RPC endpoints (PostgREST / RPC)
- current Flutter data layer patterns (repositories, DTOs)
- any typed client generation already present

Output:
- Schema status:
- RLS status:
- Functions status:
- Client status:
- Gaps:

---

## 2) Mandatory artifacts (before edits)
### 2.1 PLAN
- Goal:
- In scope:
- Out of scope:
- Approach:
- Contract format chosen (OpenAPI / PostgREST / RPC spec):
- Rollback strategy:

### 2.2 TASK LIST (Done Criteria)
Each task includes:
- files touched (migrations, RLS, functions, docs, generated client)
- done criteria
- test evidence required

### 2.3 RISKS
- Data integrity risks (double membership, race conditions, ledger edits):
- Security risks (private group leakage, IDOR access):
- Operational risks (breaking changes to client):
- Mitigations:

### 2.4 TEST PLAN
- DB tests (constraints, triggers)
- API tests (authz, visibility)
- Flutter contract tests (generated client compiles)
- manual smoke (key endpoints)

---

## 3) Gates
### Gate A — Artifacts Gate
Must PASS before edits.

### Gate B — Contract Lock Gate
Must PASS before completion:
- Contracts documented
- Typed client generated and checked in (or reproducibly generated)
- Breaking changes prevented (versioning strategy)

### Gate C — Server Enforcement Gate
Must PASS before completion:
- One-group rule enforced in DB
- Caps enforced in DB or function layer
- Private/public visibility enforced via RLS
- Ledger append-only enforced

---

## 4) Canonical data model (must define)
Define these entities (minimum):

### 4.1 users_profile
Fields:
- id (uuid, matches auth user id)
- full_name
- momo_number (string, indexed; uniqueness strategy defined)
- whatsapp_number
- country_code (default RW)
- district/sector (optional)
- created_at, updated_at

### 4.2 groups
Fields:
- id (uuid)
- name
- type (PRIVATE | PUBLIC)
- status (ACTIVE | PENDING_APPROVAL | APPROVED | REJECTED)
- min_contribution_amount
- contribution_frequency (WEEKLY | MONTHLY | FLEXIBLE)
- country_code (RW default)
- created_by (user id)
- created_at, updated_at
- rejection_reason (optional)

Rules:
- PUBLIC groups must be APPROVED to appear in directory.

### 4.3 group_memberships
Fields:
- id (uuid)
- user_id
- group_id
- role (MEMBER | CREATOR)
- joined_at

Hard rule:
- ONE group per user (enforce with unique constraint on user_id).

### 4.4 contribution_submissions
Fields:
- id (uuid)
- user_id
- group_id
- amount
- momo_tx_id
- submitted_at
- status (PENDING | CONFIRMED | REJECTED)
- evidence_url (optional)
- rejection_reason (optional)
- updated_at

Rules:
- amount <= 4000 enforced
- momo_tx_id uniqueness policy defined (per group or per user+group)
- default status = PENDING

### 4.5 ledger_entries (CONFIRMED only)
Fields:
- id (uuid)
- user_id
- group_id
- amount
- confirmed_at
- source_submission_id
- created_at

Append-only:
- no updates, no deletes (enforced via DB trigger).

### 4.6 leaderboard_snapshots (optional but recommended)
Fields:
- id
- country_code
- period_start, period_end
- group_id
- score_avg_per_member
- confirmed_total
- member_count
- rank
- created_at

Rules:
- only APPROVED public groups included for public leaderboard.

---

## 5) Server-side enforcement (how to implement)
### 5.1 Database constraints (preferred)
- UNIQUE(user_id) on group_memberships.
- CHECK(amount <= 4000) on contribution_submissions.amount.
- Enforce wallet cap at confirmation time:
  - when inserting ledger_entries, ensure (sum(ledger)+new_amount) <= 500000.
  - best done in a SECURITY DEFINER function or trigger to avoid race conditions.

### 5.2 Append-only ledger trigger
- BEFORE UPDATE/DELETE on ledger_entries: raise exception.
- Also consider immutability of confirmed submissions.

### 5.3 Atomic membership create
- membership creation should be a function (RPC) that:
  - checks existing membership
  - inserts membership
  - returns membership
All in one transaction.

### 5.4 Confirmation pipeline (reconciliation)
Only server can confirm:
- A staff/system function confirms a submission:
  - validates submission exists + pending
  - checks caps (amount + wallet cap)
  - inserts ledger entry
  - updates submission status to CONFIRMED and links source_submission_id
If cap would be exceeded → reject with reason.

---

## 6) Privacy & authorization (RLS policy strategy)
### 6.1 Principles
- “Hidden UI” is not privacy.
- Private group data must be unqueryable by non-members.

### 6.2 RLS policy requirements
- groups:
  - APPROVED public groups: selectable by any authenticated user (for directory)
  - private/pending: selectable only by members + staff
- group_memberships:
  - selectable by the user (self) and staff
- contribution_submissions:
  - selectable by the user (self) and staff for their institution scope
- ledger_entries:
  - selectable by the user (self) and staff
- evidence objects (storage):
  - readable only by owner + staff

Define staff authorization model (e.g., staff table + institution scope) and encode in RLS.

---

## 7) API contracts (endpoints must be explicit)
Choose one style and document it (do not mix casually):
A) PostgREST (tables/views) + RPC functions
B) Edge Functions acting as API façade
C) OpenAPI spec (recommended if you have multiple clients)

Minimum endpoint surface:

### Auth/Profile
- GET /me/profile
- POST /me/profile (create/update)

### Membership
- GET /me/membership (returns group summary or null)
- POST /groups/join (token/code)  [atomic, enforces one-group]
- POST /groups/create             [public or private, returns status]

### Group directory
- GET /groups/public?search=&filters=... (only approved)

### Contributions
- POST /contributions/submit (amount, momo_tx_id, evidence_url?)
- GET /me/contributions?status=&period=
- PATCH /contributions/{id}/fix (tx_id/evidence) [only if rejected]

### Wallet/Ledger
- GET /me/wallet (confirmed_balance, cap, period_progress, pending_total)
- GET /me/ledger?cursor=

### Leaderboard/Rewards
- GET /leaderboard/monthly/top5
- GET /leaderboard/monthly/my-rank
- POST /referrals/track (on conversion events)
- GET /ambassadors/by-sector
- POST /ambassadors/apply

Hard rule:
- There must be NO endpoints for withdrawal/transfer/payment.

---

## 8) Contract versioning strategy (must choose)
Pick one:
- SemVer API versioning: /v1/...
- Schema version header: X-API-Version
- Backward compatible changes only until next major

Rules:
- Additive changes only by default
- Breaking changes require a new version + migration plan

---

## 9) Typed client generation (prevents drift)
Goal: Flutter should use generated types for DTOs and API calls.

Approach options:
- If OpenAPI exists:
  - generate Dart client + models
  - commit generated code or generate in CI deterministically
- If using Supabase/PostgREST + RPC:
  - generate typed models from database schema (or maintain DTOs with strict tests)
  - ensure repository layer maps server payloads into domain models

Deliverables:
- /docs/API_CONTRACT.md (endpoints + payloads + examples)
- /docs/SCHEMA.md (tables + constraints + enums)
- /docs/RLS_MODEL.md (who can see what)
- /docs/VERSIONING.md

Evidence requirement:
- client compiles
- contract tests validate key payloads

---

## 10) What to avoid (critical)
- UI-only validation for caps or membership (must be server enforced).
- “Temporary” payment endpoints “for later”.
- Exposing private group metadata via tokens/QR payload.
- Updating/deleting ledger entries (breaks auditability).
- Storing evidence images in public buckets.
- Mixing business logic across UI, client, and DB inconsistently.

---

## Output format (exact)
Return results using this structure:

1) CONSTRAINT CONFIRMATION
2) REPO SNAPSHOT
3) PLAN
4) TASK LIST
5) RISKS
6) TEST PLAN
7) CONTRACT FORMAT + VERSIONING CHOICE
8) GATE STATUS (A/B/C: PASS/FAIL)
9) NEXT ACTION (single sentence)
