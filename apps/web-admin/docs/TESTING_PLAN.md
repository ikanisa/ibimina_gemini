# Comprehensive Testing Plan

## Overview
This document outlines the complete testing strategy for the Ibimina Gemini portal.

---

## 1. Manual Testing

### 1.1 Dashboard Testing
- [ ] Load dashboard with valid institution
- [ ] Verify all KPIs display correctly
- [ ] Test attention items navigation
- [ ] Test health banner display
- [ ] Test refresh functionality
- [ ] Test institution switcher (Platform Admin)
- [ ] Verify error handling when RPC fails
- [ ] Test with no data (empty state)

### 1.2 Groups Testing
- [ ] List groups - verify all groups display
- [ ] Search groups - test search functionality
- [ ] Create group - test form validation
- [ ] Edit group - test update functionality
- [ ] View group details - verify all tabs load
- [ ] Add member to group - test member assignment
- [ ] Remove member from group
- [ ] Test leader role assignment
- [ ] Test bulk upload (if implemented)
- [ ] Test group deletion/closure

### 1.3 Members Testing
- [ ] List members - verify infinite scroll
- [ ] Search members - test search functionality
- [ ] Create member (AddMemberModal) - test validation
- [ ] Create member (MemberWizard) - test multi-step flow
- [ ] Edit member - test update functionality
- [ ] View member details - verify all tabs
- [ ] Test member deletion
- [ ] Test bulk upload
- [ ] Verify leader indicators display
- [ ] Test member-group associations

### 1.4 Transactions Testing
- [ ] List transactions - verify infinite scroll
- [ ] Search transactions - test search
- [ ] Filter by status (all, unallocated, allocated, flagged)
- [ ] Filter by date range
- [ ] View transaction details - test drawer
- [ ] Allocate transaction - test member search
- [ ] Test allocation with note
- [ ] Verify allocation history displays
- [ ] Test source SMS display
- [ ] Test export (if implemented)

### 1.5 Reports Testing
- [ ] Load reports with default filters
- [ ] Test scope selection (institution, group, member)
- [ ] Test date range filter
- [ ] Test status filter
- [ ] Verify KPIs display correctly
- [ ] Test breakdown table drill-down
- [ ] Test ledger table pagination
- [ ] Test CSV export
- [ ] Test with no data
- [ ] Test Platform Admin institution selection

### 1.6 Institutions Testing
- [ ] List institutions (Platform Admin)
- [ ] Search institutions
- [ ] Filter by type and status
- [ ] Create institution - test form validation
- [ ] Edit institution - test update
- [ ] View institution details - test all tabs
- [ ] Manage MoMo codes - add, set primary, deactivate
- [ ] View staff list
- [ ] View directory counts
- [ ] Test institution suspension

### 1.7 Staff & Roles Testing
- [ ] List staff - verify display
- [ ] Search staff
- [ ] Add staff (invite method) - test form
- [ ] Add staff (password method) - test form
- [ ] Test staff invite email (verify Edge Function)
- [ ] Test permissions matrix (verify UI)
- [ ] Test role updates
- [ ] Test staff deactivation
- [ ] Test bulk import (if implemented)
- [ ] Verify role-based access

### 1.8 SMS Gateway Devices Testing
- [ ] List devices - verify display
- [ ] Search devices
- [ ] Filter by institution and status
- [ ] Add device - test form validation
- [ ] Edit device - test update
- [ ] View device details - verify drawer
- [ ] Test recent SMS display
- [ ] Test device activation/suspension
- [ ] Test device removal
- [ ] Verify device key generation

### 1.9 Settings Testing
- [ ] Navigate to Settings home
- [ ] Test Institution Settings - save/load
- [ ] Test Parsing Settings - save/load
- [ ] Test SMS Sources Settings - CRUD operations
- [ ] Test Notifications Settings - trigger reports
- [ ] Test Staff Settings (Admin only)
- [ ] Test Audit Log (Admin only)
- [ ] Test System Settings (Platform Admin only)
- [ ] Verify role-based tab visibility
- [ ] Test save/cancel functionality

### 1.10 Role-Based Access Testing
- [ ] Test Platform Admin access (all pages)
- [ ] Test Institution Admin access (limited)
- [ ] Test Regular Staff access (view only where applicable)
- [ ] Verify restricted pages redirect properly
- [ ] Test institution scoping (users see only their institution)
- [ ] Test cross-institution access prevention

---

## 2. Performance Testing

### 2.1 Large Dataset Testing
- [ ] Test with 1000+ groups
- [ ] Test with 1000+ members
- [ ] Test with 10000+ transactions
- [ ] Test with 1000+ staff members
- [ ] Verify query performance
- [ ] Verify pagination works correctly
- [ ] Test search performance with large datasets

### 2.2 Infinite Scroll Testing
- [ ] Test Members list infinite scroll
- [ ] Test Transactions list infinite scroll
- [ ] Test Reports ledger infinite scroll
- [ ] Verify load more triggers correctly
- [ ] Test scroll performance with large datasets
- [ ] Verify no duplicate data loaded

### 2.3 Report Generation Testing
- [ ] Test weekly report with 1000+ transactions
- [ ] Test monthly report with 10000+ transactions
- [ ] Test overall report with all-time data
- [ ] Verify PDF generation performance
- [ ] Test CSV export with large datasets (5000+ rows)
- [ ] Verify report generation doesn't timeout

### 2.4 Concurrent User Testing
- [ ] Test multiple users accessing same page
- [ ] Test concurrent CRUD operations
- [ ] Verify no data conflicts
- [ ] Test transaction allocation under load
- [ ] Verify audit log captures all actions

---

## 3. Security Audit

### 3.1 RLS Policy Review
- [ ] Review institutions table RLS
- [ ] Review groups table RLS
- [ ] Review members table RLS
- [ ] Review transactions table RLS
- [ ] Review profiles table RLS
- [ ] Review audit_log table RLS
- [ ] Review settings table RLS
- [ ] Verify Platform Admin bypass works
- [ ] Verify Institution Admin scoping works
- [ ] Test RLS with different user roles

### 3.2 Permission Checks
- [ ] Verify all RPC functions check permissions
- [ ] Test unauthorized access attempts
- [ ] Verify Edge Functions check permissions
- [ ] Test cross-institution data access prevention
- [ ] Verify audit log captures unauthorized attempts

### 3.3 Edge Case Testing
- [ ] Test with null/invalid institution IDs
- [ ] Test with deleted/missing records
- [ ] Test with malformed data
- [ ] Test with concurrent modifications
- [ ] Test with expired sessions
- [ ] Test with invalid user roles
- [ ] Test SQL injection attempts (input validation)
- [ ] Test XSS attempts (output sanitization)

### 3.4 Data Validation
- [ ] Test form validation on all forms
- [ ] Test required field validation
- [ ] Test data type validation
- [ ] Test range validation (amounts, dates)
- [ ] Test phone number validation
- [ ] Test email validation
- [ ] Test unique constraint validation

---

## 4. User Acceptance Testing

### 4.1 Critical User Flows
- [ ] **Member Registration Flow**
  - Create member → Assign to group → Verify notification
- [ ] **Transaction Allocation Flow**
  - Receive SMS → Parse → Allocate → Verify confirmation
- [ ] **Group Report Flow**
  - Generate report → Send to leaders → Verify delivery
- [ ] **Staff Invite Flow**
  - Invite staff → Verify email → Staff accepts → Verify access
- [ ] **MoMo Code Setup Flow**
  - Add MoMo code → Set primary → Verify matching works

### 4.2 Business Requirements Verification
- [ ] Verify group leaders requirement (each group has at least one)
- [ ] Verify daily contribution groups generate weekly reports
- [ ] Verify contribution confirmations sent on allocation
- [ ] Verify WhatsApp notifications work
- [ ] Verify SMS notifications work
- [ ] Verify report generation for leaders
- [ ] Verify manual notification triggers work
- [ ] Verify arrears calculation is correct

### 4.3 Stakeholder Feedback
- [ ] Gather feedback from institution admins
- [ ] Gather feedback from staff users
- [ ] Gather feedback from platform admins
- [ ] Document feature requests
- [ ] Document usability issues
- [ ] Prioritize improvements

---

## 5. Deployment Preparation

### 5.1 Environment Variables Configuration
- [ ] Verify SUPABASE_URL is set
- [ ] Verify SUPABASE_ANON_KEY is set
- [ ] Verify SUPABASE_SERVICE_ROLE_KEY is set (for Edge Functions)
- [ ] Verify WhatsApp credentials are set:
  - [ ] WA_PHONE_ID
  - [ ] META_WABA_BUSINESS_ID
  - [ ] WHATSAPP_ACCESS_TOKEN
  - [ ] WA_VERIFY_TOKEN
  - [ ] WA_APP_SECRET
- [ ] Verify OPENAI_API_KEY is set (if using AI features)
- [ ] Verify all Edge Function secrets are configured

### 5.2 Database Setup
- [ ] Verify all migrations are applied
- [ ] Verify RLS policies are active
- [ ] Verify RPC functions are deployed
- [ ] Verify notification templates are seeded
- [ ] Verify cron jobs are configured
- [ ] Test database connection
- [ ] Verify backup strategy is in place

### 5.3 Edge Functions Deployment
- [ ] Deploy generate-group-report
- [ ] Deploy send-scheduled-notifications
- [ ] Deploy send-contribution-confirmation
- [ ] Deploy process-pending-notifications
- [ ] Deploy send-whatsapp
- [ ] Deploy staff-invite
- [ ] Verify all Edge Functions have correct secrets
- [ ] Test each Edge Function with sample data

### 5.4 Monitoring Setup
- [ ] Set up error logging
- [ ] Set up performance monitoring
- [ ] Set up database query monitoring
- [ ] Set up Edge Function execution monitoring
- [ ] Set up notification delivery monitoring
- [ ] Set up SMS gateway device health monitoring
- [ ] Configure alerts for critical errors
- [ ] Configure alerts for performance degradation

### 5.5 Deployment Checklist
- [ ] Code review completed
- [ ] All tests passed
- [ ] Security audit completed
- [ ] Documentation updated
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Edge Functions deployed
- [ ] Monitoring configured
- [ ] Backup strategy verified
- [ ] Rollback plan prepared
- [ ] Stakeholder notification sent
- [ ] Deployment window scheduled

---

## Testing Tools & Scripts

### SQL Test Queries
```sql
-- Test RLS policies
SET ROLE authenticated;
SET request.jwt.claim.institution_id = 'test-institution-id';
SELECT * FROM groups; -- Should only return groups for test institution

-- Test RPC functions
SELECT * FROM get_dashboard_summary('institution-id', 7);
SELECT * FROM get_report_summary('institution', 'institution-id', ...);
```

### Test Data Generation
- Create test scripts for generating large datasets
- Create test scripts for testing edge cases
- Create test scripts for performance testing

---

## Success Criteria

### Manual Testing
- ✅ All pages load without errors
- ✅ All CRUD operations work correctly
- ✅ Role-based access is enforced
- ✅ Error handling works properly
- ✅ Loading states display correctly

### Performance Testing
- ✅ Pages load in < 2 seconds
- ✅ Infinite scroll works smoothly
- ✅ Reports generate in < 30 seconds
- ✅ No memory leaks during extended use

### Security Audit
- ✅ RLS policies prevent unauthorized access
- ✅ All permission checks are in place
- ✅ Input validation prevents injection attacks
- ✅ Output sanitization prevents XSS

### User Acceptance Testing
- ✅ All critical flows work end-to-end
- ✅ Business requirements are met
- ✅ Stakeholder feedback is positive
- ✅ Usability is acceptable

### Deployment Preparation
- ✅ All environment variables configured
- ✅ All Edge Functions deployed
- ✅ Monitoring is active
- ✅ Backup strategy is in place

---

## Next Steps

1. **Start with Manual Testing** - Begin with Dashboard and work through each page
2. **Create Test Data** - Generate test datasets for performance testing
3. **Review RLS Policies** - Audit all security policies
4. **Deploy to Staging** - Set up staging environment for UAT
5. **Gather Feedback** - Get stakeholder input
6. **Fix Issues** - Address any problems found
7. **Final Deployment** - Deploy to production

---

**Last Updated:** 2026-01-11  
**Status:** Ready for Execution
