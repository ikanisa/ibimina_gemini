# Database Schema

## Core Tables

### 1. `groups`
- `id`: uuid (PK)
- `type`: text (PUBLIC / PRIVATE)
- `status`: text (ACTIVE / PENDING /...)
- `group_code`: text (Unique per institution)

### 2. `members`
- `id`: uuid (PK)
- `user_id`: uuid (FK auth.users)
- `group_id`: uuid (FK groups)
- `status`: text

### 3. `transactions` (Ledger)
- `id`: uuid (PK)
- `amount`: numeric
- `status`: text (pending / confirmed / rejected)
- `group_id`: uuid
- `member_id`: uuid

## Key Constraints
1. **One Group Per User**:
   - Enforced via Unique Index on `members(user_id)` where status is active?
   - OR Unique Index on `group_members(member_id)` if using junction table.
   (Implemented in `20260126130000_backend_contracts_gapfill.sql`)

2. **Financial Safety**:
   - `trigger_enforce_transaction_limits` checks 4k cap and 500k wallet cap.

## Views
1. **`view_leaderboard_monthly`**:
   - Aggregates confirmed transactions for active public groups.
   - Used for Rewards tab.
