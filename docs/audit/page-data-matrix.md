# Page–Data Contract Matrix

## PWA Routes/Pages

| Route | Component | Table(s) | Status | Mock Usage |
|-------|-----------|----------|--------|------------|
| `/dashboard` | Dashboard.tsx / SupabaseDashboard.tsx | profiles, groups, members, loans, transactions | **done** | Uses Supabase aggregates when VITE_USE_MOCK_DATA=false |
| `/saccos` | Saccos.tsx | institutions, branches, members | **done** | Queries real institutions table |
| `/groups` | Groups.tsx | groups, group_members, meetings, contributions | **done** | Fully wired to Supabase |
| `/members` | Members.tsx | members, group_members | **done** | Wired to Supabase |
| `/loans` | Loans.tsx | loans, members | **done** | Wired to Supabase |
| `/transactions` | Transactions.tsx | transactions, members | **done** | Wired to Supabase |
| `/momo` | MoMoOperations.tsx | sms_messages | **done** | Wired to Supabase via useSmsMessages hook |
| `/reconciliation` | Reconciliation.tsx | reconciliation_issues, payment_ledger | **done** | Wired to Supabase |
| `/staff` | Staff.tsx | profiles | **done** | Wired to Supabase |
| `/settings` | Settings.tsx | settings | **done** | Wired with upsert support |
| `/profile` | Profile.tsx | profiles | **done** | Uses current user from context |
| `/login` | Login.tsx | auth | **done** | Supabase Auth |

## Data Access Pattern

All pages use:
```typescript
const useMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true';
```

When `VITE_USE_MOCK_DATA=true`: Uses MOCK_* arrays from constants.ts
When `VITE_USE_MOCK_DATA=false`: Queries Supabase directly

## Required: Domain Data Layer

Create centralized data access modules:
- `lib/data/institutions.ts`
- `lib/data/members.ts`  
- `lib/data/groups.ts`
- `lib/data/sms.ts`

## RLS Requirements

| Table | Required Access |
|-------|-----------------|
| institutions | Public read (RLS disabled) |
| profiles | Institution-scoped read/write |
| groups | Institution-scoped |
| members | Institution-scoped |
| All others | Institution-scoped |
