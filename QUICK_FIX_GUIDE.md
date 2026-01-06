# Quick Fix Guide - Critical Production Issues

This guide provides step-by-step instructions to fix the critical issues identified in the production readiness review.

## 🚨 CRITICAL: Payment Ledger Table Missing

### Problem
Multiple components reference `payment_ledger` table that doesn't exist in the database schema, causing runtime errors.

### Solution

**Option 1: Create the Table (Recommended)**

1. Open Supabase SQL Editor
2. Run the migration file: `supabase/migrations/20260102000008_add_payment_ledger.sql`
3. Verify the table was created:
   ```sql
   SELECT * FROM public.payment_ledger LIMIT 1;
   ```

**Option 2: Refactor Code (Alternative)**

If you prefer not to add the table, you'll need to refactor these files:
- `components/Transactions.tsx`
- `components/SupabaseDashboard.tsx`
- `components/Reconciliation.tsx`
- `components/MoMoOperations.tsx`
- `components/Groups.tsx`

Replace `payment_ledger` queries with `transactions` or `sms_messages` tables.

---

## 🔧 High Priority Fixes

### 1. Add Missing Database Indexes

Run this SQL in Supabase SQL Editor:

```sql
-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_transactions_created_at 
  ON public.transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contributions_date 
  ON public.contributions(date DESC);
CREATE INDEX IF NOT EXISTS idx_sms_messages_timestamp 
  ON public.sms_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_institution_status 
  ON public.transactions(institution_id, status);
```

### 2. Add Data Validation Constraints

```sql
-- Ensure frequency is only Weekly or Monthly
ALTER TABLE public.groups 
  ADD CONSTRAINT check_frequency 
  CHECK (frequency IN ('Weekly', 'Monthly'));
```

### 3. Fix MoMoOperations Component

Update `components/MoMoOperations.tsx` line 54:

**Before:**
```typescript
const { data, error } = await supabase
  .from('payment_ledger')
```

**After:**
```typescript
const { data, error } = await supabase
  .from('sms_messages')
```

And update field mappings to match `sms_messages` schema.

---

## ✅ Verification Steps

After applying fixes, verify:

1. **Dashboard loads without errors:**
   - Navigate to Dashboard
   - Check browser console for errors
   - Verify stats display correctly

2. **Transactions page works:**
   - Navigate to Transactions
   - Verify list loads
   - Check no console errors

3. **MoMo Operations works:**
   - Navigate to MoMo SMS
   - Verify SMS messages load
   - Test transaction creation

4. **Reconciliation works:**
   - Navigate to Reconciliation
   - Verify issues load
   - Check cash movements display

---

## 🧪 Testing Checklist

Before deploying to production:

- [ ] All pages load without errors
- [ ] Member onboarding (bulk upload) works
- [ ] Group onboarding (bulk upload) works
- [ ] Staff invite works
- [ ] Transactions display correctly
- [ ] SMS parsing works
- [ ] Reconciliation displays data
- [ ] Dashboard shows correct stats
- [ ] No console errors in browser
- [ ] Database queries execute successfully

---

## 📝 Next Steps

1. Apply critical fixes (payment_ledger table)
2. Add missing indexes
3. Test all workflows end-to-end
4. Review full production readiness document
5. Address high-priority items
6. Deploy to staging environment
7. Perform UAT testing
8. Deploy to production

---

For detailed information, see `PRODUCTION_READINESS_REVIEW.md`

