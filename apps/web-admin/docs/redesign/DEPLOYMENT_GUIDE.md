# Deployment Guide

This guide walks through deploying the redesigned schema, Edge Functions, and frontend updates.

## Prerequisites

- Supabase project (local or cloud)
- Supabase CLI installed (`npm install -g supabase`)
- Access to Supabase dashboard
- Environment variables configured

## Step 1: Review Migration SQL

**⚠️ IMPORTANT: Always test in a development/staging environment first!**

1. Review the migration file:
   ```bash
   cat supabase/migrations/20260107000000_redesign_consolidated_schema.sql
   ```

2. Check for any syntax errors or conflicts with your existing schema

3. **Backup your database** before running migrations:
   ```bash
   # Via Supabase CLI
   supabase db dump -f backup_before_redesign.sql
   
   # Or via Supabase Dashboard → Database → Backups
   ```

## Step 2: Run Schema Migration

### Option A: Supabase CLI (Recommended for Local/Dev)

```bash
# Link to your project (if not already linked)
supabase link --project-ref your-project-ref

# Run migration
supabase migration up

# Or run specific migration
supabase db reset  # WARNING: This resets local database
```

### Option B: Supabase Dashboard (For Cloud)

1. Go to Supabase Dashboard → SQL Editor
2. Open `supabase/migrations/20260107000000_redesign_consolidated_schema.sql`
3. Copy entire contents
4. Paste into SQL Editor
5. Click "Run"
6. Verify no errors

### Option C: Supabase CLI (For Cloud)

```bash
# Push migrations to cloud
supabase db push
```

## Step 3: Verify Migration

Run these queries in SQL Editor to verify:

```sql
-- Check new tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'momo_sms_raw',
    'institution_momo_codes',
    'transaction_allocations',
    'audit_log',
    'reconciliation_sessions',
    'reconciliation_items'
  );

-- Check enum types exist
SELECT typname 
FROM pg_type 
WHERE typname IN (
  'transaction_allocation_status',
  'sms_parse_status',
  'sms_source',
  'reconciliation_session_status',
  'reconciliation_issue_type'
);

-- Check functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('parse_momo_sms', 'allocate_transaction');

-- Check data migration worked
SELECT 
  (SELECT COUNT(*) FROM transactions WHERE allocation_status = 'unallocated') as unallocated_count,
  (SELECT COUNT(*) FROM transactions WHERE allocation_status = 'allocated') as allocated_count;
```

## Step 4: Deploy Edge Functions

### Setup Supabase CLI (if not done)

```bash
# Install Supabase CLI (if needed)
npm install -g supabase

# Login to Supabase
supabase login

# Link project
supabase link --project-ref your-project-ref
```

### Deploy Functions

```bash
# Deploy parse-momo-sms
supabase functions deploy parse-momo-sms

# Deploy bulk-import-groups
supabase functions deploy bulk-import-groups

# Deploy bulk-import-members
supabase functions deploy bulk-import-members
```

### Set Environment Variables

For Edge Functions, set these in Supabase Dashboard → Edge Functions → Settings:

- `GEMINI_API_KEY` - Your Gemini API key (for parse-momo-sms)
- `GEMINI_MODEL` - Model name (optional, defaults to 'gemini-2.0-flash-exp')

Or via CLI:

```bash
supabase secrets set GEMINI_API_KEY=your-api-key
supabase secrets set GEMINI_MODEL=gemini-2.0-flash-exp
```

### Verify Functions

1. Go to Supabase Dashboard → Edge Functions
2. Verify all 3 functions are deployed and active
3. Test each function (use Dashboard → Edge Functions → Invoke)

## Step 5: Run Seed Data (Optional)

**⚠️ Only run this in development/staging, or if you want demo data in production**

```bash
# Option A: Via Supabase CLI
supabase db reset  # This runs all migrations + seed files

# Option B: Via SQL Editor
# Open supabase/seed/005_redesign_demo_data.sql
# Copy contents and run in SQL Editor
```

## Step 6: Drop Old Tables (After Verification)

**⚠️ Only run this after verifying all data migrated correctly!**

1. Verify old tables are empty or migrated:
   ```sql
   SELECT COUNT(*) FROM contributions;
   SELECT COUNT(*) FROM incoming_payments;
   SELECT COUNT(*) FROM payment_ledger;
   ```

2. If counts are 0 or data is confirmed migrated, run:
   ```bash
   # Via SQL Editor or CLI
   # Run supabase/migrations/20260107000001_drop_old_tables.sql
   ```

## Step 7: Update Frontend

### Update Environment Variables

Ensure `.env.local` has:

```env
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_USE_MOCK_DATA=false
```

### Build and Test

```bash
# Install dependencies
npm install

# Build
npm run build

# Test locally
npm run preview

# Run tests
npm test
```

### Deploy Frontend

**Cloudflare Pages:**

```bash
# Build for production
npm run build

# Deploy via Cloudflare Dashboard or CLI
# (Files in dist/ are ready for deployment)
```

## Step 8: Post-Deployment Verification

### Database Checks

1. **RLS Policies:**
   ```sql
   -- Test as staff user (should only see their institution)
   -- Test as admin (should see all)
   ```

2. **Data Integrity:**
   ```sql
   -- Check member.institution_id == group.institution_id
   SELECT COUNT(*) 
   FROM members m
   JOIN groups g ON g.id = m.group_id
   WHERE m.institution_id != g.institution_id;
   -- Should return 0
   ```

3. **Transaction Allocation:**
   ```sql
   -- Check unallocated transactions have no member_id
   SELECT COUNT(*) 
   FROM transactions 
   WHERE allocation_status = 'unallocated' 
     AND member_id IS NOT NULL;
   -- Should return 0
   ```

### Frontend Checks

1. ✅ Dashboard loads and shows KPIs
2. ✅ Transactions page loads and filters work
3. ✅ Allocation Queue page loads and shows unallocated transactions
4. ✅ Groups page loads and create wizard works
5. ✅ Members page loads and create wizard works
6. ✅ Can allocate a transaction to a member
7. ✅ RLS enforced (staff only sees their institution)

## Troubleshooting

### Migration Errors

**Error: "relation already exists"**
- Table already exists. Check if migration was partially run.
- Option: Drop table and re-run, or skip creation (use `IF NOT EXISTS`)

**Error: "type already exists"**
- Enum type already exists. Safe to ignore if enums match.

**Error: "constraint violation"**
- Data integrity issue. Check foreign keys and constraints.
- May need to clean up orphaned data first.

### Edge Function Errors

**Error: "Function not found"**
- Ensure function is deployed: `supabase functions deploy function-name`
- Check function name matches exactly (case-sensitive)

**Error: "GEMINI_API_KEY not configured"**
- Set secret: `supabase secrets set GEMINI_API_KEY=your-key`
- Or set in Dashboard → Edge Functions → Settings

### RLS Issues

**Staff seeing all institutions:**
- Check `current_institution_id()` function
- Verify `profiles.institution_id` is set correctly
- Check RLS policy syntax

**Admin not seeing all:**
- Verify role is `PLATFORM_ADMIN`
- Check `is_platform_admin()` function

## Rollback Plan

If something goes wrong:

1. **Rollback Migration:**
   ```sql
   -- Restore from backup
   -- Or manually drop new tables and restore old ones
   ```

2. **Restore Old Tables:**
   - If old tables were dropped, restore from backup
   - Or recreate from previous migration

3. **Revert Frontend:**
   ```bash
   git checkout previous-commit
   npm run build
   # Redeploy
   ```

## Next Steps

After successful deployment:

1. ✅ Run QA/UAT Checklist (`docs/redesign/QA_UAT_CHECKLIST.md`)
2. ✅ Train staff on new Allocation Queue workflow
3. ✅ Monitor error logs for first week
4. ✅ Gather feedback and iterate

## Support

- Check `docs/redesign/` for detailed documentation
- Review Supabase logs for errors
- Check Edge Function logs in Dashboard

---

**Last Updated:** 2025-01-07


