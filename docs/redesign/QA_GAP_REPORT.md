# Phase 10: QA Gap Report

**Generated:** 2026-01-07  
**Purpose:** Audit existing tests, RLS policies, and Cloudflare configuration to identify gaps before final release.

---

## 1. Test Framework Inventory

### Frameworks Present

| Framework | Purpose | Status |
|-----------|---------|--------|
| **Playwright** | E2E browser testing | ✅ Configured |
| **Vitest** | Unit/component testing | ✅ Configured |
| **Testing Library** | Component testing utilities | ✅ Installed |
| **Storybook** | Component development/testing | ✅ Configured |

### Package Scripts Available

```json
{
  "test": "vitest",
  "test:coverage": "vitest run --coverage",
  "test:ui": "vitest --ui",
  "e2e": "playwright test",
  "e2e:report": "playwright show-report"
}
```

### Missing Scripts (To Add)

- `test:rls` - RLS policy tests
- `test:smoke` - Smoke tests for deployment
- `test:all` - Run all test suites

---

## 2. Existing Test Files

### E2E Tests (`e2e/`)

| File | Coverage | Status |
|------|----------|--------|
| `auth.spec.ts` | Login page display, validation, keyboard nav | ✅ Good |
| `dashboard.spec.ts` | Navigation, mobile responsive | ⚠️ Basic |
| `accessibility.spec.ts` | A11y checks | ⚠️ Placeholder |
| `critical-flows.spec.ts` | Allocation, reconciliation, groups, members, reports | ⚠️ Skeleton |
| `security.spec.ts` | Role-based access, institution scoping | ⚠️ Skeleton |
| `smoke.spec.ts` | Route resolution, error handling, performance | ✅ Good |

### Unit Tests

**Gap:** No unit test files found in the repository. Need to add tests for:
- Hook functions
- Utility functions
- Complex component logic

---

## 3. Critical Flow Test Gaps

### Required Flows (per Phase 10 spec)

| Flow | File | Status | Gap |
|------|------|--------|-----|
| 1. Login → Dashboard loads | `critical-flows.spec.ts` | ⚠️ Skeleton | Needs real credential handling |
| 2. Transactions filter (unallocated) | `critical-flows.spec.ts` | ⚠️ Skeleton | Needs actual filter interaction |
| 3. Allocate transaction → audit log | `critical-flows.spec.ts` | ⚠️ Skeleton | Needs DB verification |
| 4. Reconciliation parse error | `critical-flows.spec.ts` | ⚠️ Skeleton | Needs retry/ignore actions |
| 5. Create group + member wizard | `critical-flows.spec.ts` | ⚠️ Skeleton | Needs wizard step tests |
| 6. Reports export CSV | `critical-flows.spec.ts` | ❌ Missing | Need full implementation |

---

## 4. RLS Policy Audit

### Tables with RLS Enabled (28 policies across 7 migrations)

| Table | RLS Enabled | Policies | Status |
|-------|-------------|----------|--------|
| `institutions` | ✅ | select, insert, update | ✅ Good |
| `institution_momo_codes` | ✅ | all operations | ✅ Good |
| `institution_settings` | ✅ | all operations | ✅ Good |
| `profiles` | ✅ | all operations | ✅ Good |
| `staff_invites` | ✅ | all operations | ✅ Good |
| `groups` | ✅ | select, insert, update | ✅ Good |
| `members` | ✅ | select, insert, update | ✅ Good |
| `transactions` | ✅ | select, insert, update | ✅ Good |
| `momo_sms_raw` | ✅ | select, insert, update | ✅ Fixed (Phase 9) |
| `sms_sources` | ✅ | all operations | ✅ Good |
| `audit_log` | ✅ | select, insert | ✅ Good |
| `sms_parse_attempts` | ✅ | select, insert | ✅ Good |

### RLS Test Gaps

| Scenario | Test Exists | Status |
|----------|-------------|--------|
| Staff cannot read other institution rows | ⚠️ Skeleton | Needs real user simulation |
| Staff cannot update other institution rows | ❌ Missing | Need to add |
| Institution admin cannot manage other institution | ⚠️ Skeleton | Needs RPC call tests |
| Auditor is read-only (cannot insert/update) | ❌ Missing | Need to add |
| Platform admin has full access | ⚠️ Skeleton | Needs verification |

---

## 5. Cloudflare Build Configuration

### Current Setup

| Item | Status | Notes |
|------|--------|-------|
| Build command | ✅ `npm run build` | via `vite build` |
| Output directory | ✅ `dist` | Standard Vite output |
| Node version | ⚠️ Not specified | Add `.nvmrc` or specify in CF |
| `_redirects` file | ✅ Present | `/* /index.html 200` |
| Environment vars | ⚠️ Partial | Need to verify all VITE_* vars |

### Gaps Identified

1. **No `.nvmrc`** - Add to ensure consistent Node version
2. **No CI workflow** - Add GitHub Actions for automated testing
3. **No build preview tests** - Should verify build output

---

## 6. Security Gaps

### Authentication

| Check | Status |
|-------|--------|
| Login flow works | ✅ Tested |
| Invalid credentials handled | ✅ Tested |
| Session expiration | ⚠️ Not tested |
| Protected route redirects | ⚠️ Basic test only |

### Authorization

| Check | Status |
|-------|--------|
| Role-based nav hiding | ⚠️ Skeleton test |
| Route guards (direct URL access) | ⚠️ Not fully tested |
| API action permissions | ❌ Not tested |

---

## 7. Performance Gaps

### Server-Side Pagination

| Page | Pagination | Status |
|------|------------|--------|
| Transactions | ✅ Infinite scroll | Implemented |
| Members | ✅ Infinite scroll | Implemented |
| Audit Log | ✅ Cursor pagination | Implemented |
| Groups | ⚠️ Client-side | May need update for large datasets |
| SMS Raw | ⚠️ Unknown | Need to verify |

### Indexes Confirmed

- ✅ `idx_transactions_inst_occurred`
- ✅ `idx_transactions_inst_status_occurred`
- ✅ `idx_audit_log_inst_created`
- ✅ `idx_members_inst_phone_primary` (conditional)
- ✅ `idx_sms_sources_inst_last_seen`

---

## 8. Priority Actions for Phase 10

### High Priority (Must Fix)

1. **Complete critical flow tests** - All 6 flows need actual implementation
2. **Add RLS tests** - Create SQL-level or API-level RLS verification
3. **Add `.nvmrc`** - Ensure consistent Node version
4. **Add test:rls script** - Easy way to run RLS tests

### Medium Priority (Should Fix)

1. **UAT checklist** - Document human testing scenarios
2. **Release runbook** - Step-by-step deployment guide
3. **Session expiration test** - Verify token refresh works
4. **Route guard tests** - Direct URL access protection

### Low Priority (Nice to Have)

1. **Unit tests** - Start with critical utilities
2. **Storybook tests** - Visual regression testing
3. **Load testing** - Performance under stress

---

## 9. Test Environment Requirements

### Staging Database

Need seed data for testing:
- 2 institutions (A, B)
- Users in each institution:
  - Platform Admin (can see both)
  - Institution Admin (one per institution)
  - Staff (one per institution)
  - Auditor (one per institution)
- Groups, members, transactions in each institution

### Environment Variables for Tests

```bash
# E2E test credentials
E2E_BASE_URL=http://localhost:5173
E2E_ADMIN_EMAIL=admin@test.com
E2E_ADMIN_PASSWORD=test123456
E2E_INST_ADMIN_EMAIL=inst-admin@test.com
E2E_INST_ADMIN_PASSWORD=test123456
E2E_STAFF_EMAIL=staff@test.com
E2E_STAFF_PASSWORD=test123456
E2E_AUDITOR_EMAIL=auditor@test.com
E2E_AUDITOR_PASSWORD=test123456
```

---

## 10. Recommendations

### Immediate Actions

1. Create `e2e/.env.example` with test credentials template
2. Update `critical-flows.spec.ts` with real implementation
3. Create `e2e/rls.spec.ts` for policy tests
4. Add `.nvmrc` file with Node 18+

### Documentation

1. Create `UAT.md` with human testing scenarios
2. Create `RELEASE_RUNBOOK.md` with deployment steps
3. Update `PRODUCTION_READINESS_CHECKLIST.md` with test results

### CI/CD

1. Add GitHub Actions workflow for:
   - Linting
   - Unit tests
   - E2E tests (against staging)
   - Build verification

---

## Summary

| Category | Score | Notes |
|----------|-------|-------|
| Test Framework | ✅ 8/10 | Good foundation, needs more tests |
| E2E Coverage | ⚠️ 5/10 | Skeletons exist, need implementation |
| RLS Testing | ⚠️ 3/10 | Policies exist, tests don't |
| Cloudflare Config | ✅ 7/10 | SPA routing works, needs CI |
| Documentation | ⚠️ 6/10 | Good but missing UAT/runbook |

**Overall Readiness:** 58% - Needs Phase 10 completion before production.

