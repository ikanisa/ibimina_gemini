# Ibimina (SACCO+) — MoMo SMS Ledger + Reconciliation PWA

Ibimina is a **minimalist, operations-first** web app for SACCOs and group savings.
It ingests **Mobile Money (MoMo) SMS**, parses them into **immutable transactions**, and provides a clean workflow for staff to **allocate** transactions to **members and groups**, then generate **institution/group/member reports**.

This system is **not AI-first**. AI (optional) is only used as a **fallback inside SMS parsing** when deterministic parsing fails.

---

## What this system does

### Core workflow

1. **SMS Ingest**: MoMo SMS arrives from an approved SMS source (Android gateway/webhook).
2. **Raw Storage (Idempotent)**: SMS is stored in `momo_sms_raw` with strict dedupe.
3. **Parsing (Deterministic-first)**:
   - Extracts amount, payer, reference, time, tx id (when available)
   - Optional AI fallback parsing only if enabled in institution settings
4. **Transactions (Immutable)**: Parsed output becomes a row in `transactions` (no edits to facts).
5. **Reconciliation & Allocation**:
   - Unallocated transactions appear in a work queue
   - Staff allocates a transaction to an existing member (implies group)
6. **Reports**:
   - Institution summary, group breakdown, member statements
   - Export CSV

---

## Roles & access model (multi-tenant)

Ibimina is multi-tenant by institution. All sensitive rows are scoped by `institution_id` with strict **Supabase RLS**.

### Roles

| Role | Access |
|------|--------|
| **PLATFORM_ADMIN** | Full access across all institutions. Creates institutions, assigns MoMo code(s), manages all staff. |
| **INSTITUTION_ADMIN** | Manages staff + directory (groups/members) for their institution. Controls institution settings. |
| **INSTITUTION_STAFF / TREASURER** | Daily operations (transactions, allocation, directory updates). |
| **INSTITUTION_AUDITOR** | Read-only access to ledger + reports + audit log. |

> **Important rule**: Every staff user belongs to exactly **one institution**, except `PLATFORM_ADMIN`.

---

## Main modules (UI)

### Settings (control plane)
- Institution profile & **MoMo code(s)**
- Parsing thresholds & dedupe rules
- SMS sources/devices (health/last seen)
- Staff management (admin only)
- Audit log (admin/auditor)

### Dashboard (operational)
- KPIs (today + last N days)
- "Needs attention" items:
  - Unallocated transactions
  - Parse errors
  - Duplicates
  - SMS source offline
  - MoMo code missing

### Transactions (ledger)
- List with filters (date, status, group, member)
- Transaction detail drawer
- Allocate action (unallocated only)

### Reconciliation (workbench)
- Tabs: Unallocated | Parse errors | Duplicates
- Fast resolution actions with audit trail

### Directory
- Groups (wizard + CSV import)
- Members (wizard + CSV import)

### Reports
- Institution / Group / Member scopes
- Breakdown + ledger
- CSV export

---

## Data model (high level)

> The key is: **institution-scoped truth with immutable transactions**.

### Institutions & staff
- `institutions`
- `institution_momo_codes` (supports primary/active codes)
- `institution_settings` (parsing mode, thresholds)
- `profiles` (auth user profile: role + institution_id + status)
- `staff_invites`
- `audit_log`

### Directory
- `groups` (institution-scoped)
- `members` (belongs to exactly one group + institution)

### Pipeline
- `sms_sources` (approved devices/webhooks, last_seen_at)
- `momo_sms_raw` (raw inbound SMS, idempotent)
- `sms_parse_attempts` (parse attempt logging)
- `transactions` (parsed facts, immutable)

---

## Security & data integrity (non-negotiable)

### Supabase RLS
- RLS enabled on all sensitive tables
- Staff sees only rows where `institution_id = profiles.institution_id`
- PLATFORM_ADMIN can access all institutions
- Helper functions: `current_institution_id()`, `is_platform_admin()`, `can_write()`

### Immutability
Transactions are immutable facts. The database rejects updates to:
- `amount`, `occurred_at`, `momo_tx_id`, `momo_ref`, payer identity fields

Allowed updates:
- Allocation fields (`member_id`, `group_id`, `allocation_status`)
- Flag/duplicate metadata
- Notes

### Audit logging
All important actions write an `audit_log` event:
- Settings updates
- Institution changes
- Staff invitations/role changes
- SMS ingested/parsed
- Transaction allocation
- Duplicate marking
- Parse error resolution

---

## SMS ingestion & parsing

### Edge Functions
- `sms-ingest`: Secure entrypoint for SMS payloads (idempotent, API key authenticated)
- `parse-momo-sms`: Parses pending SMS (deterministic-first, AI fallback optional)

### Dedupe strategy
- Raw SMS dedupe by `sms_hash` (SHA256 of sender + text + time bucket)
- Transaction dedupe by `momo_tx_id` (preferred), else `txn_fingerprint`

### Parsing modes
Configured per institution in `institution_settings`:
- `deterministic` — Rule-based parsing only
- `fallback_enabled` — AI fallback when deterministic fails

---

## Getting started (local development)

### Requirements
- Node.js **20.19.0+** (see `.nvmrc`)
- npm or pnpm
- Supabase CLI
- A Supabase project (local or remote)

### 1) Install dependencies

```bash
npm install
```

### 2) Configure environment variables

Create `.env.local` for the frontend app:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> ⚠️ **Never put Supabase service role key in the frontend.**

For Edge Functions, set secrets via Supabase CLI:

```bash
supabase secrets set OPENAI_API_KEY=sk-...
supabase secrets set GEMINI_API_KEY=AIza...
supabase secrets set INGEST_API_KEY=your-secure-key
```

### 3) Apply database schema/migrations

```bash
# Start local Supabase
supabase start

# Apply migrations
supabase db push

# Or reset with seed data
supabase db reset
```

### 4) Run the app

```bash
npm run dev
```

App will be available at `http://localhost:5173`

---

## Seeding demo data (staging/local)

Staging/local environments should include seed data so pages are testable:
- 2 institutions
- 10+ groups + 100+ members per institution
- 300+ transactions with unallocated items
- Parse errors + duplicates for reconciliation testing

Seed files are in `supabase/seed/`.

> ⚠️ **Production should not auto-seed.**

---

## Testing

### Unit tests (Vitest)

```bash
npm run test
npm run test:coverage
```

### E2E tests (Playwright)

Critical flows covered:
- Login → Dashboard loads
- Transactions filter + allocation
- Reconciliation parse error resolution
- Create group/member wizard
- Reports export

```bash
# Run all E2E tests
npm run e2e

# Run specific suites
npm run e2e:critical   # Critical flows
npm run e2e:security   # Security/auth tests
npm run e2e:rls        # RLS policy tests
npm run e2e:smoke      # Smoke tests

# Interactive mode
npm run e2e:ui
```

### RLS / security tests

The `e2e/rls.spec.ts` suite asserts:
- Staff cannot access other institutions' data
- Institution admin cannot manage other institutions
- Auditor is read-only
- Platform admin can view all

---

## Deployment

### Cloudflare Pages

Key requirements:
- SPA routing fallback configured (`public/_redirects`)
- Safe environment variables only (`VITE_*`)
- No secrets in client bundle
- Error boundary enabled for runtime errors

Build:

```bash
npm run build
```

Output: `dist/`

### Supabase

```bash
# Deploy Edge Functions
supabase functions deploy

# Apply migrations
supabase db push
```

---

## Operational checklist (production readiness)

Before go-live:

- [ ] RLS enabled & validated for all sensitive tables
- [ ] Audit log events emitted for all admin + reconciliation actions
- [ ] SMS ingest authenticated (API key) + sources restricted
- [ ] Parsing idempotency verified (no duplicates on retry)
- [ ] Cloudflare build stable (no blank screens / infinite loading)
- [ ] UAT checklist completed on staging (see `docs/UAT.md`)
- [ ] Rollback plan documented (see `docs/RELEASE_RUNBOOK.md`)

See `docs/redesign/PRODUCTION_READINESS_CHECKLIST.md` for detailed checklist.

---

## Project structure

```
├── src/
│   ├── components/       # React components
│   ├── contexts/         # React contexts (Auth, etc.)
│   ├── hooks/            # Custom hooks
│   ├── lib/              # Supabase client, utilities
│   └── types.ts          # TypeScript types
├── supabase/
│   ├── migrations/       # Database migrations
│   ├── functions/        # Edge Functions
│   └── seed/             # Seed data
├── e2e/                  # Playwright E2E tests
├── docs/                 # Documentation
│   ├── UAT.md            # User acceptance testing checklist
│   ├── RELEASE_RUNBOOK.md # Deployment guide
│   └── redesign/         # Architecture & implementation docs
├── public/               # Static assets + _redirects
└── package.json
```

---

## Documentation

| Document | Purpose |
|----------|---------|
| `docs/UAT.md` | User acceptance testing checklist |
| `docs/RELEASE_RUNBOOK.md` | Production deployment runbook |
| `docs/redesign/PRODUCTION_READINESS_CHECKLIST.md` | Pre-launch checklist |
| `docs/redesign/QA_GAP_REPORT.md` | Test coverage audit |
| `docs/redesign/FINAL_SCHEMA.md` | Database schema documentation |
| `docs/redesign/ROUTES_PAGES_MAP.md` | Frontend routes map |

---

## Contributing

### Guiding principles

1. **Minimal UI, strong correctness** — Prefer simplicity over features
2. **DB constraints + RLS over frontend "trust"** — Security at the data layer
3. **No duplicate tables** — Always audit existing schema first
4. **Transactions are immutable facts** — Parse once, allocate many times
5. **Audit everything** — Every important action gets logged

### Development workflow

1. Create feature branch from `main`
2. Implement changes following existing patterns
3. Add/update tests
4. Run `npm run typecheck` and fix any errors
5. Run `npm run e2e:smoke` to verify basics
6. Create PR for review

---

## Tech stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Vite
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions, RLS)
- **Hosting**: Cloudflare Pages
- **Testing**: Playwright (E2E), Vitest (Unit)
- **PWA**: vite-plugin-pwa

---

## License

TBD

---

## Support

For issues or questions, please open a GitHub issue.
