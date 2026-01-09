# Fixed RPC Functions

## Issue
The application was showing 404 errors for:
- `get_dashboard_summary`
- `get_report_summary`

## Root Cause
1. Missing database tables:
   - `institution_momo_codes` - was referenced but didn't exist
   - `sms_sources` - was referenced but didn't exist

2. Functions existed but couldn't execute due to missing dependencies

## Solution Applied

### 1. Created Missing Tables
- ✅ Created `institution_momo_codes` table
- ✅ Created `sms_sources` table

### 2. Recreated Functions
- ✅ Recreated `get_dashboard_summary` function
- ✅ Recreated `get_report_summary` function
- ✅ Granted EXECUTE permissions to authenticated users

### 3. Refreshed PostgREST Schema
- ✅ Sent NOTIFY to reload PostgREST schema cache

## Status
✅ **FIXED** - Functions should now be accessible via REST API

## Next Steps
1. Refresh the browser to clear any cached errors
2. Test the dashboard and reports pages
3. If issues persist, check browser console for specific error messages
