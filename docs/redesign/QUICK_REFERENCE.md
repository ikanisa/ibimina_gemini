# Quick Reference Guide

## Migration Files

1. **20260107000000_redesign_consolidated_schema.sql**
   - Creates new tables and enums
   - Migrates data from old tables
   - Sets up RLS policies
   - Creates database functions

2. **20260107000001_drop_old_tables.sql**
   - Drops old duplicate tables (run after verification)

## Edge Functions

### parse-momo-sms
**Purpose:** Parse MoMo SMS and create transactions

**Endpoint:** `https://<project>.supabase.co/functions/v1/parse-momo-sms`

**Request:**
```json
{
  "sms_id": "uuid",
  "sms_text": "You have received 5000 RWF...",
  "sender_phone": "+250788123456",
  "received_at": "2025-01-07T10:00:00Z",
  "institution_id": "uuid" // optional
}
```

**Response:**
```json
{
  "success": true,
  "transaction_id": "uuid",
  "parsed_data": {
    "amount": 5000,
    "currency": "RWF",
    "momo_ref": "ABC123",
    "payer_name": "John Doe",
    "confidence": 0.95
  }
}
```

### bulk-import-groups
**Purpose:** Import multiple groups from CSV

**Endpoint:** `https://<project>.supabase.co/functions/v1/bulk-import-groups`

**Request:**
```json
{
  "groups": [
    {
      "group_name": "Ibimina ya Gasabo",
      "code": "GAS001",
      "expected_amount": 5000,
      "frequency": "Weekly",
      "meeting_day": "Friday",
      "currency": "RWF"
    }
  ],
  "institution_id": "uuid" // optional
}
```

**Response:**
```json
{
  "success": true,
  "total": 1,
  "success_count": 1,
  "error_count": 0,
  "results": [
    { "row": 1, "success": true, "id": "uuid" }
  ]
}
```

### bulk-import-members
**Purpose:** Import multiple members from CSV

**Endpoint:** `https://<project>.supabase.co/functions/v1/bulk-import-members`

**Request:**
```json
{
  "members": [
    {
      "full_name": "Jean Mukamana",
      "phone": "+250788123456",
      "group_name": "Ibimina ya Gasabo",
      "member_code": "MEM001",
      "branch": "Kigali"
    }
  ],
  "institution_id": "uuid" // optional
}
```

**Response:**
```json
{
  "success": true,
  "total": 1,
  "success_count": 1,
  "error_count": 0,
  "results": [
    { "row": 1, "success": true, "id": "uuid" }
  ]
}
```

## Database Functions

### parse_momo_sms()
**Purpose:** Parse SMS and create transaction

```sql
SELECT parse_momo_sms(
  'sms-uuid'::uuid,
  'institution-uuid'::uuid,
  5000::numeric,
  'RWF'::text,
  '+250788123456'::text,
  'John Doe'::text,
  'REF123'::text,
  NOW()::timestamptz,
  0.95::numeric
);
```

### allocate_transaction()
**Purpose:** Allocate unallocated transaction to member

```sql
SELECT allocate_transaction(
  'transaction-uuid'::uuid,
  'member-uuid'::uuid
);
```

## Key Tables

### transactions
**New columns:**
- `allocation_status` (enum: unallocated | allocated | error | duplicate | reversed)
- `momo_sms_id` (FK → momo_sms_raw)
- `occurred_at` (actual transaction time)
- `payer_phone`, `payer_name`, `momo_ref`
- `parse_confidence` (0.0-1.0)

**Query unallocated:**
```sql
SELECT * FROM transactions
WHERE allocation_status = 'unallocated'
  AND institution_id = current_institution_id()
ORDER BY occurred_at DESC;
```

### momo_sms_raw
**New table** (replaces `sms_messages`)

```sql
SELECT * FROM momo_sms_raw
WHERE institution_id = current_institution_id()
  AND parse_status = 'pending';
```

### transaction_allocations
**New table** (audit trail)

```sql
SELECT * FROM transaction_allocations
WHERE transaction_id = 'transaction-uuid';
```

## Frontend Components

### AllocationQueue
**Location:** `components/AllocationQueue.tsx`
**Route:** `ViewState.ALLOCATION_QUEUE`
**Purpose:** Shows unallocated transactions and allows allocation to members

### Transactions (Updated)
**Location:** `components/Transactions.tsx`
**Updates needed:**
- Filter by `allocation_status`
- Show allocation status badge
- Link to Allocation Queue

## RLS Policies

All tables use institution-scoped RLS:

```sql
USING (
  public.is_platform_admin() 
  OR institution_id = public.current_institution_id()
)
```

**Test RLS:**
```sql
-- As staff user (should only see their institution)
SELECT COUNT(*) FROM transactions; -- Returns only staff institution

-- As admin (should see all)
SELECT COUNT(*) FROM transactions; -- Returns all
```

## Common Queries

### Get unallocated count (Dashboard)
```sql
SELECT COUNT(*) 
FROM transactions 
WHERE institution_id = current_institution_id()
  AND allocation_status = 'unallocated';
```

### Get transactions with SMS details
```sql
SELECT t.*, m.sms_text, m.parse_status
FROM transactions t
LEFT JOIN momo_sms_raw m ON m.id = t.momo_sms_id
WHERE t.institution_id = current_institution_id();
```

### Get allocation history
```sql
SELECT ta.*, m.full_name, g.group_name
FROM transaction_allocations ta
JOIN members m ON m.id = ta.member_id
JOIN groups g ON g.id = ta.group_id
WHERE ta.transaction_id = 'transaction-uuid';
```

## Environment Variables

**Frontend (.env.local):**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_USE_MOCK_DATA=false
```

**Edge Functions (Supabase Secrets):**
```bash
supabase secrets set GEMINI_API_KEY=your-api-key
supabase secrets set GEMINI_MODEL=gemini-2.0-flash-exp
```

## Troubleshooting

### "relation does not exist"
- Migration not run
- Check migration status: `supabase migration list`

### "function does not exist"
- Function not created
- Check migration ran successfully

### "allocation_status does not exist"
- Enum type not created
- Check migration: `SELECT typname FROM pg_type WHERE typname = 'transaction_allocation_status';`

### RLS blocking access
- Check `current_institution_id()` returns correct value
- Check user profile has `institution_id` set
- Check RLS policy syntax

---

**For detailed documentation, see:**
- `FINAL_SCHEMA.md` - Complete schema reference
- `ROUTES_PAGES_MAP.md` - All pages and routes
- `QA_UAT_CHECKLIST.md` - Testing checklist
- `DEPLOYMENT_GUIDE.md` - Step-by-step deployment

