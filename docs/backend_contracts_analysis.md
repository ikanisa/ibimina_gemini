# Backend Contracts Analysis & Plan

## 1) CONSTRAINT CONFIRMATION
- **No Withdrawal Endpoints**: CONFIRMED. No code exists for withdrawals.
- **No Payment APIs**: CONFIRMED. App handles only proof of payment, relies on external MoMo USSD.
- **One Group Per User**: CONFIRMED. Enforced via `join_group_via_invite` RPC and `idx_group_members_single_active` unique index.
- **Max Contribution 4,000 RWF**: NEEDS ENFORCEMENT. Currently not explicitly visible in DB constraints in scanned files (needs `CHECK(amount <= 4000)`).
- **Wallet Cap 500,000 RWF**: NEEDS ENFORCEMENT. Logic likely in application layer, needs DB/Trigger enforcement.
- **Group Privacy**: Partially enforced. Public groups filtered by `APPROVED`. Private groups logic relies on RLS (to be verified).
- **Leaderboards**: `view_leaderboard_monthly` exists, bases rank on `transactions` table (confirmed status).

**Backend Pattern**: Supabase (Postgres + RLS + RPC).

## 2) REPO SNAPSHOT
- **Schema**:
    - `groups` (active, structure matches requirements).
    - `members` (linked to `auth.users`).
    - `group_members` (junction).
    - `transactions` (seems to be the main table for contributions/ledger).
    - `ledger` table defined in `20260126000001_ibimina_schema.sql` (need to confirm if this is redundant or the target implementation).
- **RLS**: Enabled on major tables. `ledger_select_own` policies seen.
- **Functions**: `join_group_via_invite` exists. `enforce_ledger_immutability` trigger exists on `ledger` table.
- **Client**: Manual Repositories (`GroupRepository`). Manual Models (`Group`, `GroupMembership`). **No typed client generation**.
- **Gaps**:
    - Discrepancy between `transactions` and `ledger` tables. Workflow asks for `ledger_entries`. `transactions` seems to be used for leaderboards.
    - Missing explicit `CHECK` constraints for 4k limit on `transactions` or `contribution_submissions`.
    - No `users_profile` table (logic uses `members` or `profiles` interchangeably in code).
    - No typed client generation workflow.

## 3) PLAN
- **Goal**: Standardize backend contracts and enforce rules server-side.
- **Scope**:
    - Resolve `transactions` vs `ledger` vs `contribution_submissions` naming (Standardize on `contribution_submissions` for requests and `ledger_entries` for confirmed).
    - Add missing DB constraints (4k limit, wallet cap).
    - Implement/Verify RLS for strict privacy.
    - Set up Typed Client generation (or strict DTOs if generation is too heavy for current stack).
- **Approach**:
    1.  Align Schema: Rename/Migrate `transactions` -> `contribution_submissions` + `ledger_entries` OR map them clearly.
    2.  Apply Constraints: Add check constraints and triggers.
    3.  Generate Docs: Create `docs/API_CONTRACT.md`.
    4.  Update Flutter: Refactor `GroupRepository` to use standardized models.

## 4) TASK LIST
- [ ] **Schema Standardization**
    - [ ] Create/Update `contribution_submissions` table (or alias `transactions`).
    - [ ] Ensure `ledger_entries` exists and is immutable (trigger confirmed).
    - [ ] Add `CHECK (amount <= 4000)`.
    - [ ] Add trigger for Wallet Cap (500k).
- [ ] **RLS & Privacy**
    - [ ] Verify `groups` RLS (Private vs Public).
    - [ ] Verify `members` RLS (Self + Staff).
- [ ] **Data Access Layer (Backend)**
    - [ ] Create RPC `submit_contribution` (handle logic, caps check).
    - [ ] Create RPC `confirm_contribution` (staff only, moves to ledger).
- [ ] **Flutter Integration**
    - [ ] Define `Group` and `Contribution` DTOs matching exact schema.
    - [ ] Refactor `GroupRepository` to use new RPCs.
    - [ ] Add Unit Tests for Repository.
    - [ ] Verify Leaderboard view uses correct table.

## 5) RISKS
- **Data Integrity**: Migration from `transactions` to `ledger` + `submissions` might break existing views (`view_leaderboard_monthly`).
    - *Mitigation*: Update view to point to `ledger_entries`.
- **Breaking Changes**: Changing table names affects the mobile app immediately.
    - *Mitigation*: Use Views/RPCs to mask DB changes or coordinate app update.
- **Privacy**: Misconfigured RLS could expose private group names.
    - *Mitigation*: Test RLS with "negative" tests (checking what anon/unauthorized users CANNOT see).

## 6) TEST PLAN
- **DB Tests**:
    - Try inserting > 4000 RWF (expect fail).
    - Try inserting > 500k RWF total balance (expect fail).
    - Try updating a `ledger_entry` (expect fail).
- **API Tests**:
    - User A tries to join Group B when already in Group A (expect fail).
    - User tries to read private group headers without membership (expect fail).
- **Flutter**:
    - Test `joinGroup` returns correct error messages.
    - Test `searchPublicGroups` returns only approved groups.

## 7) CONTRACT FORMAT + VERSIONING
- **Format**: Supabase/PostgREST + RPC.
- **Versioning**: Additive changes only. New RPCs for breaking behavior.

## 8) GATE STATUS
- **Artifacts Gate**: PASS (This document).
- **Contract Lock Gate**: FAIL (Contracts not yet fully documented/standardized).
- **Server Enforcement Gate**: PARTIAL (One-group is enforced; Caps are missing).

## 9) NEXT ACTION
- Resolve `transactions` vs `ledger` confusion and finalize `contribution_submissions` schema.
