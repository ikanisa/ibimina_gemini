# QA / UAT Plan

## Environment Setup
- Supabase schema applied (`supabase/schema.sql`)
- `staff-invite` edge function deployed with `SERVICE_ROLE_KEY`
- Cloudflare Pages env vars set:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_USE_MOCK_DATA=false`

## Smoke Tests
- `npm run typecheck`
- `npm run build`
- Login works with a staff account
- Dashboard loads KPIs without errors
- Navigation between modules is stable (no console errors)
- Offline banner appears when toggling network off

## Auth / RBAC
- PLATFORM_ADMIN can view all institutions and staff
- INSTITUTION_ADMIN can view only their institution data
- Regular staff cannot access admin-only views (Staff, Settings)

## Data Integrity
- Groups list shows real groups; counts match `group_members`
- Members list shows correct balances and group memberships
- Transactions ledger shows member names and status
- Loans list shows correct borrower info and status
- Token wallets sum matches member token balances
- MoMo SMS and NFC logs load from Supabase tables
- Reconciliation issues update status on resolve/ignore

## Settings & Config
- System name / support email / base currency save and reload
- MoMo gateway config save and reload

## Security
- RLS: users cannot access other institutions' data
- Profiles contain correct role/institution mapping

## Regression Checks
- Tables render when data is empty (no crashes)
- Role-based navigation is consistent
- PWA service worker registers in production builds
