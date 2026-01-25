# UAT Test Scenarios

**Version:** 1.0  
**Date:** January 2026  
**Status:** Ready for UAT

---

## Overview

This document contains detailed test scenarios for User Acceptance Testing (UAT) of the IBIMINA GEMINI system. Each scenario represents a real-world workflow that users will perform in production.

---

## Scenario 1: Daily Transaction Management

**User Role:** Staff Member  
**Priority:** Critical  
**Estimated Duration:** 15 minutes  
**Prerequisites:** Valid staff account, test transactions available

### Steps

1. **Login**
   - Navigate to login page
   - Enter email and password
   - Click "Sign In"
   - **Expected:** Successfully logged in, redirected to dashboard

2. **View Dashboard**
   - Review KPI cards (Total Members, Active Groups, etc.)
   - Check attention items (if any)
   - Review recent activity
   - **Expected:** All data displays correctly, no errors

3. **Navigate to Transactions**
   - Click "Transactions" in sidebar
   - **Expected:** Transactions page loads, shows transaction list

4. **Filter Unallocated Transactions**
   - Click "Unallocated" filter or select from dropdown
   - **Expected:** Only unallocated transactions shown

5. **View Transaction Details**
   - Click on an unallocated transaction
   - Review transaction details (amount, date, reference, SMS text)
   - **Expected:** Transaction drawer opens with all details visible

6. **Allocate Transaction**
   - Click "Allocate" button
   - Search for member by name or phone
   - Select member from results
   - Add optional note
   - Click "Confirm Allocation"
   - **Expected:** Transaction allocated, success message shown, transaction removed from unallocated list

7. **Verify Allocation**
   - Navigate to member's profile
   - Check transaction history
   - **Expected:** Allocated transaction appears in member's history

8. **Logout**
   - Click user menu
   - Click "Sign Out"
   - **Expected:** Logged out, redirected to login page

### Success Criteria

- ✅ All steps completed without errors
- ✅ Transaction allocated correctly
- ✅ Data persists after page refresh
- ✅ User can complete workflow in < 15 minutes
- ✅ User finds workflow intuitive

---

## Scenario 2: Group Creation and Management

**User Role:** Group Administrator / Staff  
**Priority:** High  
**Estimated Duration:** 20 minutes  
**Prerequisites:** Valid staff account with group management permissions

### Steps

1. **Navigate to Groups**
   - Click "Groups" in sidebar
   - **Expected:** Groups page loads, shows group list

2. **Create New Group**
   - Click "New Group" button
   - Fill in group name (e.g., "Test Group Alpha")
   - Select group type (if applicable)
   - Enter group code (if required)
   - Click "Create"
   - **Expected:** Group created, success message shown, group appears in list

3. **Add Members to Group**
   - Click on newly created group
   - Navigate to "Members" tab
   - Click "Add Member" or "Assign Member"
   - Search for existing member
   - Select member
   - Assign role (if applicable, e.g., "Leader")
   - Click "Add"
   - **Expected:** Member added to group, appears in group members list

4. **View Group Details**
   - Review group information
   - Check member count
   - View group contributions (if any)
   - **Expected:** All group data displays correctly

5. **Schedule Group Meeting**
   - Navigate to "Meetings" tab (if available)
   - Click "Schedule Meeting"
   - Select date and time
   - Add meeting notes
   - Click "Schedule"
   - **Expected:** Meeting scheduled, appears in meetings list

6. **Record Contributions**
   - Navigate to "Contributions" tab
   - Click "Record Contribution"
   - Select member
   - Enter contribution amount
   - Select payment method
   - Add notes
   - Click "Record"
   - **Expected:** Contribution recorded, appears in contributions list

7. **View Group Report**
   - Navigate to "Reports" or group summary
   - Review group statistics
   - Check contribution totals
   - **Expected:** Report displays accurate data

### Success Criteria

- ✅ Group created successfully
- ✅ Members added correctly
- ✅ Meeting scheduled
- ✅ Contributions recorded accurately
- ✅ Reports show correct data
- ✅ User can complete workflow in < 20 minutes

---

## Scenario 3: Member Registration and Onboarding

**User Role:** Staff Member  
**Priority:** High  
**Estimated Duration:** 15 minutes  
**Prerequisites:** Valid staff account

### Steps

1. **Navigate to Members**
   - Click "Members" in sidebar
   - **Expected:** Members page loads

2. **Create New Member**
   - Click "New Member" button
   - Fill in member details:
     - Full Name
     - Phone Number
     - Email (optional)
     - Date of Birth (if required)
     - Address (if required)
   - **Expected:** Form validates correctly, no errors

3. **Assign to Group (Optional)**
   - Select group from dropdown
   - Assign role (if applicable)
   - **Expected:** Group selected, member will be assigned

4. **Complete Registration**
   - Review entered information
   - Click "Create Member" or "Save"
   - **Expected:** Member created, success message shown

5. **Verify Member Created**
   - Search for newly created member
   - Click on member to view details
   - **Expected:** Member details page shows all entered information

6. **Bulk Import Members (Alternative)**
   - Click "Import" or "Bulk Upload"
   - Select CSV file with member data
   - Review import preview
   - Click "Import"
   - **Expected:** Members imported, success message with count shown

### Success Criteria

- ✅ Member created successfully
- ✅ All data saved correctly
- ✅ Member appears in member list
- ✅ Bulk import works correctly
- ✅ Validation errors clear and helpful

---

## Scenario 4: Report Generation and Export

**User Role:** Manager / Auditor  
**Priority:** Medium  
**Estimated Duration:** 10 minutes  
**Prerequisites:** Valid account with report access, historical data available

### Steps

1. **Navigate to Reports**
   - Click "Reports" in sidebar
   - **Expected:** Reports page loads

2. **Select Report Scope**
   - Choose scope (Institution, Group, or Member)
   - Select specific institution/group/member (if applicable)
   - **Expected:** Scope selected, filters update

3. **Set Date Range**
   - Select "From" date
   - Select "To" date
   - **Expected:** Date range selected, report updates

4. **View Report Summary**
   - Review KPI cards (Total, Allocated, Unallocated, etc.)
   - Check summary statistics
   - **Expected:** All KPIs display correctly

5. **View Detailed Ledger**
   - Scroll through transaction ledger
   - Verify transactions match date range
   - Check transaction details
   - **Expected:** Ledger displays correctly, data accurate

6. **Export to CSV**
   - Click "Export" or "Download CSV" button
   - Wait for download
   - Open downloaded CSV file
   - **Expected:** CSV file downloads, contains all report data, format correct

7. **Filter Report**
   - Apply additional filters (status, type, etc.)
   - **Expected:** Report updates, shows filtered results

### Success Criteria

- ✅ Report generates correctly
- ✅ Data is accurate
- ✅ CSV export works
- ✅ Filters work correctly
- ✅ Report loads in < 5 seconds

---

## Scenario 5: Mobile Experience

**User Role:** Any User  
**Priority:** High  
**Estimated Duration:** 15 minutes  
**Prerequisites:** Mobile device, valid account

### Steps

1. **Access Portal on Mobile**
   - Open mobile browser
   - Navigate to portal URL
   - **Expected:** Portal loads, responsive layout displayed

2. **Login on Mobile**
   - Enter credentials
   - Click "Sign In"
   - **Expected:** Login successful, dashboard displays

3. **Test Navigation**
   - Open mobile menu (hamburger icon)
   - Navigate between pages
   - **Expected:** Navigation works, menu opens/closes smoothly

4. **Test Forms on Mobile**
   - Create a new member or group
   - Fill in form fields
   - Submit form
   - **Expected:** Forms usable, keyboard appears correctly, submission works

5. **Test Tables on Mobile**
   - View transactions or members list
   - Scroll horizontally if needed
   - **Expected:** Tables readable, scrolling works

6. **Test Touch Targets**
   - Tap buttons and links
   - **Expected:** All touch targets large enough (44x44px), easy to tap

7. **Test Offline Mode**
   - Turn off mobile data/WiFi
   - Try to perform actions
   - **Expected:** Offline indicator shown, actions queued

### Success Criteria

- ✅ All features work on mobile
- ✅ UI is usable and readable
- ✅ Touch targets adequate
- ✅ Forms work correctly
- ✅ Performance acceptable

---

## Scenario 6: Search and Filter Operations

**User Role:** Any User  
**Priority:** Medium  
**Estimated Duration:** 10 minutes  
**Prerequisites:** Valid account, data available

### Steps

1. **Search Transactions**
   - Navigate to Transactions
   - Enter search term in search box
   - **Expected:** Results filter as you type, relevant transactions shown

2. **Filter by Status**
   - Select status filter (Allocated, Unallocated, Flagged)
   - **Expected:** List updates to show only selected status

3. **Filter by Date Range**
   - Select date range
   - **Expected:** Transactions filtered by date

4. **Search Members**
   - Navigate to Members
   - Enter member name or phone
   - **Expected:** Matching members shown

5. **Search Groups**
   - Navigate to Groups
   - Enter group name
   - **Expected:** Matching groups shown

6. **Clear Filters**
   - Click "Clear" or "Reset" filters
   - **Expected:** All filters cleared, full list shown

### Success Criteria

- ✅ Search works correctly
- ✅ Filters apply correctly
- ✅ Results update quickly
- ✅ Clear filters works

---

## Scenario 7: Error Handling and Recovery

**User Role:** Any User  
**Priority:** Medium  
**Estimated Duration:** 10 minutes  
**Prerequisites:** Valid account

### Steps

1. **Test Invalid Login**
   - Enter wrong password
   - Click "Sign In"
   - **Expected:** Error message shown, login fails

2. **Test Form Validation**
   - Submit form with required fields empty
   - **Expected:** Validation errors shown, form not submitted

3. **Test Network Error**
   - Disconnect internet
   - Try to perform action
   - **Expected:** Offline indicator shown, error message clear

4. **Test 404 Error**
   - Navigate to non-existent page
   - **Expected:** 404 page shown or redirect to valid page

5. **Test Permission Error**
   - Try to access restricted feature
   - **Expected:** Access denied message or redirect

6. **Test Recovery**
   - Reconnect internet
   - Retry failed action
   - **Expected:** Action succeeds, data syncs

### Success Criteria

- ✅ Error messages clear and helpful
- ✅ User can recover from errors
- ✅ System handles errors gracefully
- ✅ No crashes or blank screens

---

## Scenario 8: Bulk Operations

**User Role:** Staff / Administrator  
**Priority:** Medium  
**Estimated Duration:** 15 minutes  
**Prerequisites:** Valid account with appropriate permissions

### Steps

1. **Bulk Select Transactions**
   - Navigate to Transactions
   - Select multiple transactions using checkboxes
   - **Expected:** Selected transactions highlighted, count shown

2. **Bulk Allocate**
   - Select multiple unallocated transactions
   - Click "Bulk Allocate"
   - Select member
   - Confirm
   - **Expected:** All selected transactions allocated to member

3. **Bulk Export**
   - Select transactions
   - Click "Export Selected"
   - **Expected:** CSV file downloads with selected transactions

4. **Bulk Import Members**
   - Navigate to Members
   - Click "Import CSV"
   - Upload CSV file
   - Review preview
   - Confirm import
   - **Expected:** Members imported, success message shown

5. **Bulk Delete (if applicable)**
   - Select items
   - Click "Delete"
   - Confirm deletion
   - **Expected:** Items deleted, success message shown

### Success Criteria

- ✅ Bulk operations work correctly
- ✅ All selected items processed
- ✅ Success/error messages clear
- ✅ No data loss

---

## Test Execution Checklist

For each scenario:

- [ ] Scenario executed
- [ ] All steps completed
- [ ] Expected results met
- [ ] Issues documented (if any)
- [ ] User feedback collected
- [ ] Screenshots taken (if issues found)

---

## Notes

- **Time Tracking:** Record actual time taken for each scenario
- **Issues:** Document any bugs, usability issues, or unexpected behavior
- **Feedback:** Collect user feedback on ease of use, clarity, and satisfaction
- **Screenshots:** Take screenshots of any issues or notable behavior

---

**Document Owner:** Product Manager  
**Last Updated:** January 2026
