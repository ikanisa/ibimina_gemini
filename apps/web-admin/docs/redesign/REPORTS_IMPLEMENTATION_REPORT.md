# Phase 6: Reports Module Implementation Report

## Overview

This document describes the implementation of the Reports module for the ibimina_gemini project. Reports are derived directly from the `transactions` table (via joins with `members`, `groups`, and `institutions`), ensuring a single source of truth.

## Implementation Date
January 7, 2026

---

## 1. Architecture Decisions

### Core Principle: No Separate Report Tables

All report data is derived from existing tables:
- `transactions` - Core financial data
- `members` - Member information
- `groups` - Group information
- `institutions` - Institution information

This ensures:
- No data duplication
- Always up-to-date reports
- Consistent with reconciliation data

### Views Created

| View | Purpose |
|------|---------|
| `vw_transactions_enriched` | Joins transactions with members, groups, institutions for reporting |
| `vw_institution_totals_daily` | Daily aggregates by institution |
| `vw_group_totals_daily` | Daily aggregates by group |
| `vw_member_totals_daily` | Daily aggregates by member |

### RPCs Created

| RPC | Purpose |
|-----|---------|
| `get_report_summary(scope, scope_id, from, to, status)` | Returns KPIs and breakdown data |
| `get_report_ledger(scope, scope_id, from, to, status, limit, offset)` | Returns paginated transaction ledger |

---

## 2. Scope Options

The Reports module supports three scopes:

### Institution Scope (`/reports` or `/reports/institution`)
- **KPIs**: Total received, Allocated total, Unallocated total/count, Parse errors, Active groups, Active members
- **Breakdown**: By group (top 50)
- **Drill-down**: Click group → opens Group Report

### Group Scope (`/reports/group/:groupId`)
- **KPIs**: Total received, Allocated total, Unallocated count, Members count
- **Breakdown**: By member (top 50)
- **Drill-down**: Click member → opens Member Report

### Member Scope (`/reports/member/:memberId`)
- **KPIs**: Total contributed, Transactions count, Last payment date, Average amount
- **Breakdown**: None (individual level)
- **Export**: Member Statement (CSV)

---

## 3. Frontend Components

### Main Component
- `components/Reports.tsx` - Main reports page with scope tabs, filters, and data display

### Subcomponents (`components/reports/`)
| Component | Purpose |
|-----------|---------|
| `ReportKpiCard.tsx` | KPI display card with optional trend indicator |
| `BreakdownTable.tsx` | Breakdown by group/member with drill-down support |
| `ReportLedgerTable.tsx` | Paginated transaction ledger with infinite scroll |
| `CsvExport.tsx` | CSV export button and utility functions |
| `index.ts` | Barrel exports |

---

## 4. Filter Options

| Filter | Options |
|--------|---------|
| Scope | Institution / Group / Member |
| Date Range | Custom dates with presets (7d, 30d, This Month) |
| Status | All / Allocated / Unallocated / Flagged / Duplicate |

---

## 5. CSV Export

### Client-Side Export Strategy
- Fetches ledger data in batches (500 rows per request)
- Maximum 5,000 rows per export
- Generates CSV client-side
- Downloads immediately

### Columns Exported
- Date, Amount, Currency, Status
- Payer Phone, Payer Name, MoMo Ref
- Member, Member Code, Group, Group Code

### Future Enhancement (If Needed)
For very large exports (>5,000 rows), implement server-side:
- Edge Function that writes CSV to Supabase Storage
- Returns signed URL for download

---

## 6. Database Changes

### New Indexes Added

```sql
-- Transaction indexes for reporting
idx_transactions_institution_occurred_at
idx_transactions_institution_allocation_status_occurred_at
idx_transactions_institution_group_id_occurred_at
idx_transactions_institution_member_id_occurred_at

-- Supporting indexes
idx_members_institution_group_id
idx_groups_institution_id
```

### Views Created

```sql
-- Enriched transactions view
vw_transactions_enriched

-- Daily aggregation views
vw_institution_totals_daily
vw_group_totals_daily
vw_member_totals_daily
```

---

## 7. Security & Scoping

### RLS Enforcement
Both RPCs use `SECURITY INVOKER` to respect RLS policies:
- Staff sees only their institution's data
- Platform Admin can view any institution or all

### Scope Validation in RPCs
- Non-PLATFORM_ADMIN users are forced to their own institution
- Group/Member scope validates ownership before returning data
- Access denied errors for unauthorized scope requests

---

## 8. UI/UX Design Principles

### Minimalist Approach
- **Max 6 KPI cards** per scope
- **One filter bar** at the top
- **Two tables**: Breakdown + Ledger
- **No decorative charts** (data-first design)

### Mobile-First
- Responsive grid for KPIs
- Cards on mobile, table on desktop
- Touch-friendly filter controls

### Drill-Down Navigation
- Click group in breakdown → opens Group report
- Click member in breakdown → opens Member report
- Breadcrumb-style scope awareness

---

## 9. Files Created/Modified

### New Files
| File | Purpose |
|------|---------|
| `supabase/migrations/20260107600000_reports_module.sql` | Views, indexes, RPCs |
| `components/Reports.tsx` | Main reports page |
| `components/reports/ReportKpiCard.tsx` | KPI card component |
| `components/reports/BreakdownTable.tsx` | Breakdown table |
| `components/reports/ReportLedgerTable.tsx` | Ledger table |
| `components/reports/CsvExport.tsx` | CSV export utilities |
| `components/reports/index.ts` | Barrel exports |
| `supabase/seed/011_reports_demo_data.sql` | Demo data for reports |

### Modified Files
| File | Change |
|------|--------|
| `types.ts` | Added `REPORTS` to ViewState enum |
| `App.tsx` | Added Reports navigation and route |

---

## 10. Access Control

| Role | Access |
|------|--------|
| Super Admin | Full access, all scopes |
| Branch Manager | Institution scope only |
| Auditor | Institution scope only (read-only) |
| Loan Officer | Institution scope only |
| Teller | No access |

---

## 11. Testing Recommendations

### Playwright Tests (To Be Added)
1. Staff can only generate reports for their institution
2. Group report matches filtered transactions
3. Member statement export produces valid CSV
4. Pagination works correctly
5. Date range filters work
6. Status filters work
7. Drill-down navigation works

### Manual Testing
1. Verify KPI calculations match transaction totals
2. Verify breakdown sums match KPI totals
3. Test CSV export with various filters
4. Test with large datasets (1000+ transactions)

---

## 12. Known Limitations

1. **CSV Export Limit**: Client-side export limited to 5,000 rows
2. **Real-time Updates**: Reports don't auto-refresh; user must reload
3. **Date Aggregation**: Views aggregate by calendar day (not customizable)

---

## 13. Future Enhancements

1. **Server-side CSV export** for large datasets
2. **Scheduled reports** via email
3. **PDF export** for formal statements
4. **Custom date grouping** (weekly, monthly)
5. **Trend sparklines** (optional, minimal)
6. **Report presets** (saved filter combinations)

---

## Summary

The Reports module delivers a minimalist, audit-grade reporting system that:
- ✅ Derives all data from the single `transactions` truth
- ✅ Supports Institution / Group / Member scopes
- ✅ Provides KPIs, breakdowns, and detailed ledgers
- ✅ Enables CSV export for offline analysis
- ✅ Respects multi-tenant security via RLS
- ✅ Follows minimalist UI constraints (max 6 KPIs, no charts)

