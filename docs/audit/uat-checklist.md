# UAT Checklist - Full-Stack Sync Verification

## Pre-requisites

- [ ] `VITE_USE_MOCK_DATA=false` in `.env`
- [ ] Supabase project connected and running
- [ ] All migrations applied

---

## Page Verification Checklist

### Dashboard
- [ ] Loads without auth (redirects to login)
- [ ] Loads with auth session
- [ ] Shows aggregate stats from Supabase
- [ ] No "Loading..." stuck state
- [ ] Error displays if query fails

### SACCOs (Institutions)
- [ ] Lists 475+ institutions from Supabase
- [ ] Search filters correctly
- [ ] Click opens details
- [ ] Branch/member counts show
- [ ] Empty state if no data

### Groups
- [ ] Lists groups for current institution
- [ ] Create group works
- [ ] Group detail view loads members
- [ ] Contributions tab shows data
- [ ] Meetings tab shows data

### Members
- [ ] Lists members for current institution
- [ ] Search by name/phone works
- [ ] Create member works
- [ ] Edit member works
- [ ] KYC status displays correctly

### Loans
- [ ] Lists loans with member names
- [ ] Status filters work
- [ ] Outstanding balance shows
- [ ] Create loan works (if implemented)

### Transactions
- [ ] Lists transactions with member names
- [ ] Type/channel filters work
- [ ] Pagination works
- [ ] Date range filter works

### MoMo SMS
- [ ] Lists SMS messages
- [ ] Parsed vs unparsed indicator shows
- [ ] Link to transaction works
- [ ] Split view shows parsing details

### Reconciliation
- [ ] MoMo vs Ledger tab loads issues
- [ ] Branch Cash tab loads movements
- [ ] Resolve action works

### Staff
- [ ] Lists staff profiles
- [ ] Create staff works
- [ ] Role assignment works
- [ ] Suspend/activate works

### Settings
- [ ] Loads current settings
- [ ] Save updates work
- [ ] Initialized if no settings exist

---

## Error Handling Verification

- [ ] Missing env: Shows clear error panel
- [ ] RLS denial: Shows "Access denied" message
- [ ] Network error: Shows retry option
- [ ] Empty data: Shows empty state, not loading

---

## Build Verification

```bash
npm run build  # Should pass
npm test       # All tests pass
```
