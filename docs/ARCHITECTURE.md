# Ibimina Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              IBIMINA SYSTEM                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐         ┌─────────────────────────────────────────────┐   │
│  │  Android    │         │              SUPABASE                        │   │
│  │  Gateway    │─────────▶  Edge Function: sms-ingest                  │   │
│  │  (SMS)      │         │  ┌─────────────────────────────────────────┐│   │
│  └─────────────┘         │  │ 1. Authenticate (API key)               ││   │
│                          │  │ 2. Identify SMS source                  ││   │
│  ┌─────────────┐         │  │ 3. Resolve institution                  ││   │
│  │  Webhook    │─────────▶  │ 4. Compute sms_hash (dedupe)            ││   │
│  │  (External) │         │  │ 5. Insert momo_sms_raw                  ││   │
│  └─────────────┘         │  │ 6. Trigger parse_sms()                  ││   │
│                          │  └─────────────────────────────────────────┘│   │
│                          │                     │                        │   │
│                          │                     ▼                        │   │
│                          │  ┌─────────────────────────────────────────┐│   │
│                          │  │         RPC: parse_sms()                ││   │
│                          │  │ ┌─────────────────────────────────────┐ ││   │
│                          │  │ │ 1. Deterministic parser (regex)     │ ││   │
│                          │  │ │ 2. AI fallback (if enabled)         │ ││   │
│                          │  │ │ 3. Compute txn_fingerprint          │ ││   │
│                          │  │ │ 4. Insert transaction (immutable)   │ ││   │
│                          │  │ │ 5. Update parse_status              │ ││   │
│                          │  │ │ 6. Log to audit_log                 │ ││   │
│                          │  │ └─────────────────────────────────────┘ ││   │
│                          │  └─────────────────────────────────────────┘│   │
│                          │                     │                        │   │
│                          │                     ▼                        │   │
│                          │  ┌─────────────────────────────────────────┐│   │
│                          │  │           DATABASE TABLES               ││   │
│                          │  │ ┌───────────────┐ ┌───────────────────┐ ││   │
│                          │  │ │ momo_sms_raw  │ │   transactions    │ ││   │
│                          │  │ │ (raw input)   │ │ (immutable facts) │ ││   │
│                          │  │ └───────────────┘ └───────────────────┘ ││   │
│                          │  │ ┌───────────────┐ ┌───────────────────┐ ││   │
│                          │  │ │   groups      │ │     members       │ ││   │
│                          │  │ │               │ │                   │ ││   │
│                          │  │ └───────────────┘ └───────────────────┘ ││   │
│                          │  │ ┌───────────────┐ ┌───────────────────┐ ││   │
│                          │  │ │ audit_log     │ │   institutions    │ ││   │
│                          │  │ │               │ │                   │ ││   │
│                          │  │ └───────────────┘ └───────────────────┘ ││   │
│                          │  └─────────────────────────────────────────┘│   │
│                          └─────────────────────────────────────────────┘   │
│                                           │                                 │
│                                           │ RLS-protected queries           │
│                                           ▼                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    CLOUDFLARE PAGES (PWA)                           │   │
│  │  ┌─────────┐ ┌─────────┐ ┌───────────┐ ┌─────────┐ ┌─────────────┐ │   │
│  │  │Dashboard│ │Transact.│ │Reconcile. │ │Directory│ │  Reports    │ │   │
│  │  └─────────┘ └─────────┘ └───────────┘ └─────────┘ └─────────────┘ │   │
│  │  ┌─────────────────────────────────────────────────────────────┐   │   │
│  │  │                    Settings Module                           │   │   │
│  │  │  Institution | Parsing | SMS Sources | Staff | Audit Log    │   │   │
│  │  └─────────────────────────────────────────────────────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### SMS Ingest → Transaction

```
SMS Text                    momo_sms_raw                  transactions
─────────────────────────   ─────────────────────────     ─────────────────────
"You have received         │ id: uuid                    │ id: uuid
5000 RWF from              │ institution_id: uuid        │ institution_id: uuid
0788123456.                │ sender_phone: "MoMo"        │ amount: 5000
Ref: ABC123..."            │ sms_text: "..."             │ currency: "RWF"
        │                  │ sms_hash: sha256            │ payer_phone: "0788..."
        │                  │ parse_status: pending       │ momo_ref: "ABC123"
        ▼                  │ received_at: timestamp      │ allocation_status: unallocated
   sms-ingest              └─────────────────────────    │ source_sms_id: uuid
        │                           │                    │ parse_confidence: 0.95
        ▼                           ▼                    └─────────────────────
   parse_sms()              parse_status: parsed
        │                           │
        └───────────────────────────┴──────────────────────────▶ INSERT
```

### Allocation Flow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  UNALLOCATED    │     │   STAFF ACTION  │     │   ALLOCATED     │
│  Transaction    │────▶│  allocate_tx()  │────▶│  Transaction    │
│                 │     │                 │     │                 │
│ member_id: null │     │ • Search member │     │ member_id: uuid │
│ group_id: null  │     │ • Confirm       │     │ group_id: uuid  │
│ status: unalloc │     │ • Audit log     │     │ status: alloc   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

---

## Role Matrix

| Action | PLATFORM_ADMIN | INSTITUTION_ADMIN | STAFF/TREASURER | AUDITOR |
|--------|----------------|-------------------|-----------------|---------|
| **Institutions** |
| Create institution | ✅ | ❌ | ❌ | ❌ |
| Update any institution | ✅ | ❌ | ❌ | ❌ |
| View all institutions | ✅ | ❌ | ❌ | ❌ |
| **Own Institution** |
| Update institution settings | ✅ | ✅ | ❌ | ❌ |
| Manage MoMo codes | ✅ | ✅ | ❌ | ❌ |
| Manage SMS sources | ✅ | ✅ | ❌ | ❌ |
| **Staff Management** |
| Invite staff (any institution) | ✅ | ❌ | ❌ | ❌ |
| Invite staff (own institution) | ✅ | ✅ | ❌ | ❌ |
| Update staff roles | ✅ | ✅ | ❌ | ❌ |
| Deactivate staff | ✅ | ✅ | ❌ | ❌ |
| **Directory** |
| Create/update groups | ✅ | ✅ | ✅ | ❌ |
| Create/update members | ✅ | ✅ | ✅ | ❌ |
| Bulk import | ✅ | ✅ | ✅ | ❌ |
| **Transactions** |
| View transactions | ✅ | ✅ | ✅ | ✅ |
| Allocate transactions | ✅ | ✅ | ✅ | ❌ |
| Mark duplicates | ✅ | ✅ | ✅ | ❌ |
| **Reconciliation** |
| Retry parse | ✅ | ✅ | ✅ | ❌ |
| Mark ignored | ✅ | ✅ | ✅ | ❌ |
| Resolve errors | ✅ | ✅ | ✅ | ❌ |
| **Reports** |
| Generate reports | ✅ | ✅ | ✅ | ✅ |
| Export CSV | ✅ | ✅ | ✅ | ✅ |
| **Audit Log** |
| View audit log | ✅ | ✅ | ❌ | ✅ |

---

## RLS Policy Summary

### Core Policies

```sql
-- Institution scoping (applied to most tables)
institution_id = current_institution_id()
OR is_platform_admin()

-- Write protection for auditors
can_write() -- Returns false for INSTITUTION_AUDITOR
```

### Table-Specific Policies

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| `institutions` | All (admin only) | Platform admin | Platform admin | — |
| `profiles` | Own + admin | Auth trigger | Own + admin | — |
| `groups` | Institution scoped | Can write + inst | Can write + inst | — |
| `members` | Institution scoped | Can write + inst | Can write + inst | — |
| `transactions` | Institution scoped | Can write + inst | Can write + inst (limited) | — |
| `momo_sms_raw` | Institution scoped | System + inst | System + inst | — |
| `audit_log` | Institution scoped | System insert | — | — |
| `sms_sources` | Institution scoped | Admin only | Admin only | — |
| `institution_settings` | Institution scoped | Admin only | Admin only | — |

### Helper Functions

```sql
-- Get current user's institution
current_institution_id() → uuid

-- Check if user is platform admin
is_platform_admin() → boolean

-- Check if user can write (not auditor)
can_write() → boolean

-- Check if user can manage institution
can_manage_institution(p_institution_id) → boolean
```

---

## Database Schema (Core Tables)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           INSTITUTION LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  institutions ──┬──▶ institution_momo_codes (1:N)                           │
│       │         └──▶ institution_settings (1:1)                             │
│       │                                                                     │
│       ├──▶ profiles (1:N) ──▶ staff_invites (1:N)                          │
│       │                                                                     │
│       ├──▶ sms_sources (1:N)                                               │
│       │                                                                     │
│       └──▶ audit_log (1:N)                                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                            DIRECTORY LAYER                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  institutions ──▶ groups (1:N) ──▶ members (1:N)                            │
│                                        │                                    │
│                   Constraint: member.institution_id = group.institution_id  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                           TRANSACTION LAYER                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  sms_sources ──▶ momo_sms_raw (1:N) ──▶ transactions (1:1)                 │
│                        │                      │                             │
│                        │                      ├──▶ members (N:1, nullable)  │
│                        │                      └──▶ groups (N:1, nullable)   │
│                        │                                                    │
│                        └──▶ sms_parse_attempts (1:N)                        │
│                                                                             │
│  IMMUTABILITY: transactions cannot modify amount, occurred_at, momo_tx_id   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Edge Functions

### `sms-ingest`

**Purpose**: Secure entry point for SMS payloads

**Authentication**: `x-api-key` header

**Flow**:
1. Validate API key
2. Lookup SMS source by `device_identifier`
3. Resolve institution (from source or MoMo code in SMS)
4. Compute `sms_hash` for deduplication
5. Insert into `momo_sms_raw` (idempotent)
6. Update `sms_sources.last_seen_at`
7. Call `parse_sms()` RPC

**Idempotency**: Returns success for duplicate SMS without re-inserting.

### `parse-momo-sms`

**Purpose**: Trigger SMS parsing

**Flow**:
1. Fetch SMS record
2. Call `parse_sms()` RPC
3. Return parsing result

**Note**: Most parsing logic is in the database RPC for transactional safety.

---

## Views (Reporting)

| View | Purpose |
|------|---------|
| `vw_transactions_enriched` | Transactions + member + group + institution joins |
| `vw_institution_totals_daily` | Daily aggregates per institution |
| `vw_group_totals_daily` | Daily aggregates per group |
| `vw_member_totals_daily` | Daily aggregates per member |
| `vw_duplicate_candidates` | Transactions with matching fingerprints |

---

## Audit Events

| Event | When | Payload |
|-------|------|---------|
| `SMS_INGESTED` | New SMS received | source_id, sender_phone |
| `SMS_PARSED` | SMS successfully parsed | sms_id, confidence |
| `SMS_PARSE_FAILED` | Parsing failed | sms_id, error |
| `TX_ALLOCATED` | Transaction allocated | tx_id, member_id, group_id |
| `TX_MARKED_DUPLICATE` | Marked as duplicate | tx_id, canonical_id |
| `MEMBER_CREATED` | New member | member_id, group_id |
| `GROUP_CREATED` | New group | group_id |
| `SETTINGS_UPDATED` | Settings changed | setting_key, old/new values |
| `STAFF_INVITED` | Staff invite sent | email, role |
| `INSTITUTION_CREATED` | New institution | institution_id |

---

## Performance Indexes

| Table | Index | Purpose |
|-------|-------|---------|
| `transactions` | `(institution_id, occurred_at DESC)` | Dashboard queries |
| `transactions` | `(institution_id, allocation_status, occurred_at DESC)` | Filtered queries |
| `transactions` | `(institution_id, allocation_status)` WHERE `status='unallocated'` | Queue count |
| `momo_sms_raw` | `(institution_id, parse_status, received_at DESC)` | Parse error queue |
| `audit_log` | `(institution_id, created_at DESC)` | Audit log pagination |
| `members` | `(institution_id, phone_primary)` | Phone lookups |
| `sms_sources` | `(institution_id, last_seen_at DESC)` | Health checks |

---

## Security Considerations

### Secrets Management
- **Supabase Anon Key**: Frontend only (safe)
- **Supabase Service Role Key**: Edge Functions only (never in frontend)
- **OpenAI/Gemini API Keys**: Edge Functions only
- **Ingest API Key**: Shared with SMS gateway devices

### Data Protection
- All sensitive data is RLS-protected
- Transaction immutability enforced at DB level
- Audit trail for all admin actions
- No PII in client-side logging

### Authentication
- Supabase Auth (email/password)
- Session-based with JWT tokens
- Role stored in `profiles` table
- Institution assignment controls data access

