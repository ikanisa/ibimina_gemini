# Supabase Schema Inventory

## Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `institutions` | SACCOs/MFIs/Banks | id, name, type, status, code, supervisor, total_assets |
| `profiles` | Staff users | user_id, institution_id, role, email, full_name, branch |
| `groups` | Savings groups | id, institution_id, group_name, status, expected_amount, frequency |
| `members` | SACCO members | id, institution_id, full_name, phone, status, kyc_status |
| `group_members` | Member↔Group join | group_id, member_id, role, status |
| `meetings` | Group meetings | id, group_id, date, type, attendance_count |
| `contributions` | Member contributions | id, group_id, member_id, amount, method |
| `loans` | Member loans | id, member_id, amount, outstanding_balance, status |
| `transactions` | Ledger entries | id, institution_id, member_id, type, amount, channel |
| `sms_messages` | MoMo SMS parsing | id, sender, body, is_parsed, parsed_amount |
| `reconciliation_issues` | Reconciliation queue | id, source, amount, ledger_status, status |
| `settings` | Institution settings | institution_id, system_name, base_currency |
| `branches` | Institution branches | id, institution_id, name, manager_name |
| `incoming_payments` | Unreconciled payments | id, amount, payer_ref, reference |
| `withdrawals` | Withdrawal requests | id, amount, status, payment_reference |
| `payment_ledger` | Payment tracking | id, txn_type, amount, reconciled |

## RLS Policies

All tables use institution-scoped RLS via:
- `public.is_platform_admin()` - full access
- `public.current_institution_id()` - scoped to user's institution

## Migrations Applied

1. `20260102000000_initial_schema.sql` - Core schema
2. `20260102000001_fix_profiles.sql` - Profile fixes
3. `20260102000002_make_admins.sql` - Admin setup
4. `20260102000003_add_institutions.sql` - 475+ Rwanda SACCOs
5. `20260102000004_add_banks.sql` - Banks
6. `20260102000005-007` - RLS fixes
7. `20260102000008_add_payment_ledger.sql` - Payment ledger
8. `20260102000009_add_constraints_and_indexes.sql` - Indexes
9. `20260106000002_remove_wallet_nfc.sql` - Remove NFC/wallet
