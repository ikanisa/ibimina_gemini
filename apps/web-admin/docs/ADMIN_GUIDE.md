# Ibimina Gemini Administrator Guide

## Overview

This guide is for Institution Administrators managing the Ibimina platform. Administrators have full access to configure institution settings, manage staff, and access all features.

---

## Table of Contents

1. [Institution Setup](#institution-setup)
2. [Staff Management](#staff-management)
3. [SMS Configuration](#sms-configuration)
4. [Security Settings](#security-settings)
5. [Group and Member Management](#group-and-member-management)
6. [Audit and Compliance](#audit-and-compliance)

---

## Institution Setup

### Initial Configuration

1. **Navigate to Settings** → **Institution**
2. Complete required fields:
   - Institution Name
   - Legal Registration Number
   - Primary Contact Email
   - Physical Address
   - Base Currency (typically RWF)

### Branding

- Upload institution logo (recommended: 200x200px PNG)
- Set primary color for UI elements
- Configure email footer text

### Operating Hours

Configure when the system sends notifications:
- Business hours start/end times
- Working days (Mon-Sat typical)
- Holiday calendar

---

## Staff Management

### Adding Staff Members

1. Go to **Settings** → **Staff**
2. Click **+ Add Staff**
3. Fill in details:
   - Full Name (required)
   - Email Address (required, used for login)
   - Phone Number
   - Role Assignment

### Role Types

| Role | Access Level | Typical Use |
|------|-------------|-------------|
| **Institution Admin** | Full access | Branch managers, directors |
| **Treasurer** | Financial operations | Cash management, approvals |
| **Staff** | Standard operations | Day-to-day transactions |
| **Auditor** | View-only | Compliance, reporting |

### Suspending Staff

1. Go to **Settings** → **Staff**
2. Click on the staff member
3. Click **Suspend Account**
4. Confirm suspension

Suspended accounts cannot log in but data is preserved.

### Resetting Passwords

Staff can reset their own passwords via the login page. Admins can:
1. Go to **Settings** → **Staff**
2. Click the staff member
3. Click **Send Password Reset**

---

## SMS Configuration

### Setting Up SMS Sources

SMS sources are mobile devices that ingest MoMo SMS messages.

1. Go to **Settings** → **SMS Gateway**
2. Click **+ Add Source**
3. Configure:
   - Device Name (descriptive identifier)
   - Phone Number (the SIM receiving SMS)
   - Status (Active/Inactive)

### SMS Gateway App Setup

1. Install the SMS Gateway app on an Android device
2. Grant SMS permissions when prompted
3. Enter the institution code provided
4. Test by sending a sample SMS

### Troubleshooting SMS

| Issue | Solution |
|-------|----------|
| SMS not appearing | Check SMS permissions on device |
| Parse errors | Verify SMS format matches expected pattern |
| Duplicates | Check if device is registered twice |

---

## Security Settings

### Password Policy

Configure password requirements:
- Minimum length (recommended: 12+ characters)
- Require uppercase/lowercase
- Require numbers
- Require special characters

### Session Management

- **Session Timeout**: Default 30 minutes of inactivity
- **Concurrent Sessions**: Allow/block multiple logins

### Two-Factor Authentication (Coming Soon)

Enable 2FA for admin accounts for enhanced security.

---

## Group and Member Management

### Creating Groups

1. Navigate to **Groups**
2. Click **+ New Group**
3. Enter:
   - Group Name
   - Expected Contribution Amount
   - Contribution Frequency
   - Grace Period (days before marking late)

### Bulk Operations

#### Bulk Member Upload

1. Go to **Members** → **Bulk Upload**
2. Download the CSV template
3. Fill in member data
4. Upload completed CSV
5. Review and confirm

#### Bulk Group Upload

1. Go to **Groups** → **Bulk Upload**
2. Follow same process as members

### Member Status Management

| Status | Meaning |
|--------|---------|
| **Active** | Member in good standing |
| **Suspended** | Temporarily blocked |
| **Closed** | Account closed permanently |
| **Pending** | Awaiting verification |

---

## Audit and Compliance

### Audit Log

View all system actions:
1. Go to **Settings** → **Audit Log**
2. Filter by:
   - Event type
   - User
   - Date range

### Tracked Events

- Login attempts
- Transaction allocations
- Member changes
- Setting modifications
- Staff account changes

### Generating Compliance Reports

1. Go to **Reports**
2. Select **Audit Report**
3. Set date range
4. Export as CSV or PDF

### Data Retention

- Audit logs: Retained indefinitely
- Transaction history: Retained indefinitely
- Deleted members: Soft-deleted (recoverable)

---

## Common Administrative Tasks

### Monthly Checklist

- [ ] Review pending transactions
- [ ] Check parse error queue
- [ ] Verify staff accounts are current
- [ ] Generate monthly summary report
- [ ] Review audit log for anomalies

### Quarterly Checklist

- [ ] Update staff permissions as needed
- [ ] Review and close inactive members
- [ ] Archive completed groups
- [ ] Update compliance documentation

---

## Support

For administrator support:
- Email: admin-support@ibimina.com
- Technical Issues: Check [Troubleshooting Guide](/docs/TROUBLESHOOTING.md)
- Feature Requests: Contact your account manager
