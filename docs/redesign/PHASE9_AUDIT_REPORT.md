# Phase 9 Audit Report

**Date:** 2026-01-07  
**Purpose:** Security, Audit, Performance, and Cloudflare Deployment Assessment

---

## 1. Security Audit Summary

### 1.1 Tables with RLS Enabled ✓

All sensitive tables have RLS enabled:

| Table | RLS Status | Policy Type | Notes |
|-------|------------|-------------|-------|
| `institutions` | ✅ Enabled | `for all` | Platform admin OR current institution |
| `profiles` | ✅ Enabled | `for select` + `for all` | Own profile + institution admin scope |
| `groups` | ✅ Enabled | `for all` | Platform admin OR current institution |
| `members` | ✅ Enabled | `for all` | Platform admin OR current institution |
| `transactions` | ✅ Enabled | `for all` | Platform admin OR current institution |
| `contributions` | ✅ Enabled | `for all` | Platform admin OR current institution |
| `incoming_payments` | ✅ Enabled | `for all` | Platform admin OR current institution |
| `withdrawals` | ✅ Enabled | `for all` | Platform admin OR current institution |
| `branches` | ✅ Enabled | `for all` | Platform admin OR current institution |
| `group_members` | ✅ Enabled | `for all` | Platform admin OR current institution |
| `meetings` | ✅ Enabled | `for all` | Platform admin OR current institution |
| `loans` | ✅ Enabled | `for all` | Platform admin OR current institution |
| `sms_messages` | ✅ Enabled | `for all` | Platform admin OR current institution |
| `nfc_logs` | ✅ Enabled | `for all` | Platform admin OR current institution |
| `reconciliation_issues` | ✅ Enabled | `for all` | Platform admin OR current institution |
| `settings` | ✅ Enabled | `for all` | Platform admin OR current institution |
| `institution_momo_codes` | ✅ Enabled | `for all` | Platform admin OR current institution |
| `momo_sms_raw` | ✅ Enabled | `for all` | Platform admin OR current institution OR null |
| `transaction_allocations` | ✅ Enabled | `for all` | Via transactions FK |
| `reconciliation_sessions` | ✅ Enabled | `for all` | Platform admin OR current institution |
| `reconciliation_items` | ✅ Enabled | `for all` | Via sessions FK |
| `audit_log` | ✅ Enabled | `for select` | Read-only policy - writes via RPC |
| `institution_settings` | ✅ Enabled | Separate policies | Select/Insert/Update with role check |
| `sms_sources` | ✅ Enabled | Separate policies | Select/Insert/Update/Delete with role check |
| `staff_invites` | ✅ Enabled | Separate policies | Platform admin + institution admin |
| `sms_parse_attempts` | ✅ Enabled | `for select` | Via momo_sms_raw FK |

### 1.2 Security Gaps Identified

#### 🔴 HIGH Priority

1. **`momo_sms_raw` allows `institution_id IS NULL`**
   - Policy: `institution_id = current_institution_id() OR institution_id IS NULL`
   - Risk: SMS without institution could leak to any authenticated user
   - Fix: Remove NULL check, require institution assignment at ingestion

2. **`audit_log` has no INSERT policy**
   - Current: Only SELECT policy exists
   - Issue: All writes go through SECURITY DEFINER RPCs
   - Note: This is intentional but should be documented

3. **No explicit role-based write restrictions on core tables**
   - `members`, `groups`, `transactions` allow any authenticated user with matching institution to write
   - Risk: Staff could modify data without proper role checks
   - Fix: Add role checks (INSTITUTION_AUDITOR = read-only)

#### 🟡 MEDIUM Priority

4. **Profiles `for all` policy is overly permissive**
   - Users can update their own profile without role restrictions
   - Institution admins can update any profile in their institution
   - Fix: Restrict field-level access (e.g., can't change own role)

5. **Missing `can_manage_institution` helper function validation**
   - Some RPCs use it, some don't
   - Standardize permission checks

6. **No INSTITUTION_AUDITOR read-only enforcement at DB level**
   - Auditors should NOT be able to INSERT/UPDATE/DELETE
   - Currently depends on frontend to hide actions

### 1.3 Frontend Route Guards

#### Current State
```typescript
// App.tsx canAccess function - role-based visibility only
const canAccess = (view: ViewState): boolean => {
  switch (view) {
    case ViewState.INSTITUTIONS:
    case ViewState.STAFF:
    case ViewState.SETTINGS:
      return ['Super Admin'].includes(effectiveRole);
    // ...
  }
};
```

#### Gaps Identified

1. **No "Forbidden" page** - Shows inline "Access Denied" message
2. **Direct URL access not blocked** - Only nav items hidden
3. **Mock data mode affects role checks** - `VITE_USE_MOCK_DATA` bypasses auth

---

## 2. Audit Log Audit Summary

### 2.1 Actions Currently Logged

| Action | Entity Type | Logged By |
|--------|-------------|-----------|
| `parse_momo_sms` | transaction | RPC |
| `allocate_transaction` | transaction | RPC |
| `set_primary_momo_code` | institution_momo_codes | RPC |
| `update_institution_settings` | institution_settings | RPC |
| `register_sms_source` | sms_sources | RPC |
| `deactivate_sms_source` | sms_sources | RPC |
| `create_institution` | institution | RPC |
| `update_institution` | institution | RPC |
| `suspend_institution_staff` | institution | RPC |
| `update_staff_role` | profile | RPC |
| `deactivate_staff` | profile | RPC |
| `reactivate_staff` | profile | RPC |
| `transfer_staff_out` / `transfer_staff_in` | profile | RPC |
| `create_staff_invite` | staff_invite | RPC |
| `revoke_staff_invite` | staff_invite | RPC |
| `mark_sms_ignored` | momo_sms_raw | RPC |
| `retry_parse_sms` | momo_sms_raw | RPC |
| `resolve_sms_error` | momo_sms_raw | RPC |
| `mark_transaction_duplicate` | transaction | RPC |
| `create_group` / `update_group` | group | RPC |
| `bulk_create_group` / `bulk_update_group` | group | RPC |
| `create_member` / `update_member` | member | RPC |
| `bulk_create_member` / `bulk_update_member` | member | RPC |

### 2.2 Missing Audit Events

| Required Event | Status | Priority |
|---------------|--------|----------|
| `SMS_INGESTED` | ❌ Not logged | High |
| `USER_LOGIN` | ❌ Not logged | Medium |
| `USER_LOGOUT` | ❌ Not logged | Low |
| `MEMBER_CREATED` (direct) | ⚠️ Only via RPC | Medium |
| `GROUP_CREATED` (direct) | ⚠️ Only via RPC | Medium |
| `SETTINGS_VIEWED` | ❌ Not logged | Low |

### 2.3 Audit Log UI Issues

1. **No server-side pagination** - Hardcoded limit of 100 entries
2. **No detail drawer** - Metadata shown inline as JSON
3. **No entity links** - Cannot navigate to related transaction/member/group
4. **Action types hardcoded** - Not matching actual DB actions
5. **actor_email missing in many entries** - Need to populate during insert

---

## 3. Performance Audit Summary

### 3.1 Index Analysis

#### Existing Indexes ✓

```sql
-- Core lookups
idx_profiles_institution_id ON profiles(institution_id)
idx_groups_institution_id ON groups(institution_id)
idx_members_institution_id ON members(institution_id)
idx_transactions_institution_id ON transactions(institution_id)

-- Audit/SMS
idx_audit_log_created_at ON audit_log(created_at DESC)
idx_audit_log_institution_id ON audit_log(institution_id)
idx_momo_sms_raw_parse_status ON momo_sms_raw(institution_id, parse_status, received_at DESC)
```

#### Missing Composite Indexes 🔴

```sql
-- Dashboard queries (high priority)
CREATE INDEX idx_transactions_inst_occurred 
  ON transactions(institution_id, occurred_at DESC);

CREATE INDEX idx_transactions_inst_status_occurred 
  ON transactions(institution_id, allocation_status, occurred_at DESC);

-- Audit log filters
CREATE INDEX idx_audit_log_inst_created 
  ON audit_log(institution_id, created_at DESC);

CREATE INDEX idx_audit_log_action_created 
  ON audit_log(action, created_at DESC);

-- Member phone lookups
CREATE INDEX idx_members_inst_phone 
  ON members(institution_id, phone_primary) WHERE phone_primary IS NOT NULL;
```

### 3.2 N+1 Query Patterns

| Component | Issue | Fix |
|-----------|-------|-----|
| `Members.tsx` | Fetches groups separately per member | Use JOIN or view |
| `Transactions.tsx` | Fetches member/group for each row | Use `vw_transactions_enriched` |
| `AuditLogSettings.tsx` | No pagination, loads 100 at once | Implement cursor pagination |

### 3.3 Frontend Performance

1. **No query caching** - Same data re-fetched on navigation
2. **Large bundle** - No code-splitting beyond lazy routes
3. **Missing skeleton states** - Full-page spinners on load
4. **Search lacks debouncing** - Some components query on every keystroke

---

## 4. Cloudflare Build Audit

### 4.1 Current Configuration ✓

```
Build Command: npm run build (vite build)
Output Directory: dist
Node Version: 18 (assumed)
SPA Routing: _redirects present
```

### 4.2 Issues Identified

#### 🔴 Mock Data Toggle in Production

**22 files reference `VITE_USE_MOCK_DATA`:**
- `App.tsx` - Core auth bypass
- `Members.tsx`, `Transactions.tsx`, `Groups.tsx` - Data switching
- `MoMoOperations.tsx`, `Staff.tsx`, `Loans.tsx` - Component behavior
- Various docs

**Risk:** If accidentally set in production, real auth is bypassed.

**Fix:** Remove mock data paths from production build or add build-time check.

#### 🟡 Environment Variables

Current safe pattern:
- Only `VITE_*` vars exposed to client
- `GEMINI_API_KEY`, `OPENAI_API_KEY` only in Edge Functions

Potential leak points:
- Check for any `process.env` usage (Node.js pattern won't work in Vite)

#### 🟢 SPA Routing

`public/_redirects` correctly configured:
```
/*    /index.html   200
```

---

## 5. Recommended Fixes

### Phase 9.1: RLS Tightening (Priority: HIGH)

1. Remove NULL institution check from `momo_sms_raw` policy
2. Add INSTITUTION_AUDITOR read-only policy to core tables
3. Add role-based write restrictions
4. Create `can_write_to_institution()` helper function

### Phase 9.2: Audit Log Refinement (Priority: HIGH)

1. Define action taxonomy enum
2. Add INSERT policy for audit_log (or document SECURITY DEFINER pattern)
3. Add `SMS_INGESTED` event to `ingest_sms` function
4. Implement server-side pagination in UI
5. Add entity links and detail drawer

### Phase 9.3: Performance Polish (Priority: MEDIUM)

1. Add missing composite indexes
2. Implement cursor-based pagination for large lists
3. Add React Query or similar for caching
4. Add debouncing to all search inputs

### Phase 9.4: Cloudflare Hardening (Priority: MEDIUM)

1. Add build-time check to fail if VITE_USE_MOCK_DATA is true
2. Add error boundary with Sentry reporting
3. Verify sourcemaps are only in preview/staging
4. Add smoke test for production routes

### Phase 9.5: System Health Indicator (Priority: LOW)

1. Add global health dot to top bar
2. Create `get_system_health()` RPC
3. Show drawer with actionable items

---

## 6. Test Coverage Requirements

### Security Tests
- [ ] Staff cannot read transactions from other institution
- [ ] Institution admin cannot create staff in other institution
- [ ] Auditor cannot modify data
- [ ] Platform admin has full access

### E2E Tests
- [ ] Login → Dashboard → Transactions → Allocate
- [ ] Reconciliation actions create audit events
- [ ] Bulk import creates correct audit entries

### Smoke Tests
- [ ] All routes resolve (no 404)
- [ ] No blank screens on navigation
- [ ] Error boundary catches and reports errors

---

## Next Steps

Execute fixes in order:
1. `20260107900000_phase9_security_polish.sql` - RLS + indexes + audit improvements
2. Update `AuditLogSettings.tsx` with pagination + drawer
3. Update `App.tsx` with mock data guard and error boundary
4. Add system health indicator
5. Create Playwright tests
6. Create Production Readiness Checklist


