# Edge Functions Deployment Guide

## Overview
This document tracks the deployment status of all Edge Functions for the Ibimina Gemini portal.

**Project:** wadhydemushqqtcrrlwm  
**Deployment Date:** 2026-01-11

---

## Edge Functions List

### Core Notification Functions

1. **generate-group-report** ✅
   - **Purpose:** Generate PDF reports for group contributions
   - **Dependencies:** WhatsApp service, PDF service
   - **Secrets Required:** WhatsApp credentials
   - **Status:** Deployed

2. **send-scheduled-notifications** ✅
   - **Purpose:** Send scheduled notifications (weekly reminders, periodic totals)
   - **Dependencies:** Notification service, WhatsApp service
   - **Secrets Required:** WhatsApp credentials
   - **Status:** Deployed

3. **send-contribution-confirmation** ✅
   - **Purpose:** Send contribution confirmation notifications
   - **Dependencies:** Notification service, WhatsApp service
   - **Secrets Required:** WhatsApp credentials
   - **Status:** Deployed

4. **process-pending-notifications** ✅
   - **Purpose:** Background job to process pending notifications
   - **Dependencies:** Notification service, WhatsApp service, SMS service
   - **Secrets Required:** WhatsApp credentials, SMS credentials
   - **Status:** Deployed

5. **send-whatsapp** ✅
   - **Purpose:** Send WhatsApp messages via Meta Business API
   - **Dependencies:** Meta WhatsApp Business API
   - **Secrets Required:** 
     - WA_PHONE_ID
     - META_WABA_BUSINESS_ID
     - WHATSAPP_ACCESS_TOKEN
     - WA_VERIFY_TOKEN
     - WA_APP_SECRET
   - **Status:** Deployed

### Staff Management Functions

6. **staff-invite** ✅
   - **Purpose:** Send staff invitation emails
   - **Dependencies:** Email service
   - **Secrets Required:** Email service credentials (if using external service)
   - **Status:** Deployed

### Configuration Functions

7. **set-whatsapp-secrets** ✅
   - **Purpose:** Set WhatsApp credentials in Supabase secrets
   - **Dependencies:** Supabase secrets API
   - **Secrets Required:** Service role key
   - **Status:** Deployed

### SMS Processing Functions

8. **parse-momo-sms** ✅
   - **Purpose:** Parse MoMo payment SMS messages
   - **Dependencies:** OpenAI API (optional, for AI parsing)
   - **Secrets Required:** OPENAI_API_KEY (if using AI parsing)
   - **Status:** Deployed

9. **sms-ingest** ✅
   - **Purpose:** Ingest SMS messages from gateway devices
   - **Dependencies:** SMS gateway devices
   - **Secrets Required:** None
   - **Status:** Deployed

### Bulk Import Functions

10. **bulk-import-members** ✅
    - **Purpose:** Bulk import members from CSV
    - **Dependencies:** CSV parsing, OpenAI API (optional)
    - **Secrets Required:** OPENAI_API_KEY (if using AI parsing)
    - **Status:** Deployed

11. **bulk-import-groups** ✅
    - **Purpose:** Bulk import groups from CSV
    - **Dependencies:** CSV parsing, OpenAI API (optional)
    - **Secrets Required:** OPENAI_API_KEY (if using AI parsing)
    - **Status:** Deployed

### Utility Functions

12. **ocr-extract** ✅
    - **Purpose:** Extract text from images using OCR
    - **Dependencies:** OCR service (optional)
    - **Secrets Required:** OCR service credentials (if using external service)
    - **Status:** Deployed

---

## Deployment Commands

### Deploy All Functions
```bash
export SUPABASE_ACCESS_TOKEN="sbp_d3eb3056d2f5f9e672187f498516d47774372ceb"

# Core notification functions
supabase functions deploy generate-group-report --project-ref wadhydemushqqtcrrlwm
supabase functions deploy send-scheduled-notifications --project-ref wadhydemushqqtcrrlwm
supabase functions deploy send-contribution-confirmation --project-ref wadhydemushqqtcrrlwm
supabase functions deploy process-pending-notifications --project-ref wadhydemushqqtcrrlwm
supabase functions deploy send-whatsapp --project-ref wadhydemushqqtcrrlwm

# Staff management
supabase functions deploy staff-invite --project-ref wadhydemushqqtcrrlwm

# Configuration
supabase functions deploy set-whatsapp-secrets --project-ref wadhydemushqqtcrrlwm

# SMS processing
supabase functions deploy parse-momo-sms --project-ref wadhydemushqqtcrrlwm
supabase functions deploy sms-ingest --project-ref wadhydemushqqtcrrlwm

# Bulk import
supabase functions deploy bulk-import-members --project-ref wadhydemushqqtcrrlwm
supabase functions deploy bulk-import-groups --project-ref wadhydemushqqtcrrlwm

# Utility
supabase functions deploy ocr-extract --project-ref wadhydemushqqtcrrlwm
```

---

## Secrets Configuration

### Required Secrets

After deploying Edge Functions, configure the following secrets in Supabase Dashboard:

1. **WhatsApp Credentials:**
   ```bash
   supabase secrets set WA_PHONE_ID=396791596844039
   supabase secrets set META_WABA_BUSINESS_ID=297687286772462
   supabase secrets set WHATSAPP_ACCESS_TOKEN=EAAGHrMn6uugBO9xlSTNU1FsbnZB7AnBLCvTlgZCYQDZC8OZA7q3nrtxpxn3VgHiT8o9KbKQIyoPNrESHKZCq2c9B9lvNr2OsT8YDBewaDD1OzytQd74XlmSOgxZAVL6TEQpDT43zZCZBwQg9AZA5QPeksUVzmAqTaoNyIIaaqSvJniVmn6dW1rw88dbZAyR6VZBMTTpjQZDZD
   supabase secrets set WA_VERIFY_TOKEN=bd0e7b6f4a2c9d83f1e57a0c6b3d48e9
   supabase secrets set WA_APP_SECRET=e0b171d137e058e9055ae61bb94e0984
   ```

2. **OpenAI API Key (if using AI features):**
   ```bash
   supabase secrets set OPENAI_API_KEY=your-openai-api-key-here
   ```

3. **Supabase Credentials (automatically available):**
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY

---

## Verification

### Check Deployment Status
```bash
supabase functions list --project-ref wadhydemushqqtcrrlwm
```

### Test Edge Function
```bash
# Test generate-group-report
curl -X POST \
  'https://wadhydemushqqtcrrlwm.supabase.co/functions/v1/generate-group-report' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "groupId": "group-id",
    "reportType": "WEEKLY",
    "sendToLeaders": true
  }'
```

---

## Troubleshooting

### Common Issues

1. **Function Not Found**
   - Verify function name is correct
   - Check function exists in `supabase/functions/` directory
   - Verify project ref is correct

2. **Authentication Errors**
   - Verify SUPABASE_ACCESS_TOKEN is set
   - Check token has deployment permissions
   - Verify project ref matches

3. **Secret Not Found**
   - Verify secrets are set in Supabase Dashboard
   - Check secret names match function expectations
   - Verify secrets are accessible to Edge Functions

4. **Function Execution Errors**
   - Check function logs in Supabase Dashboard
   - Verify all dependencies are available
   - Check function code for errors

---

## Monitoring

### View Function Logs
```bash
supabase functions logs <function-name> --project-ref wadhydemushqqtcrrlwm
```

### View in Dashboard
- Navigate to Supabase Dashboard
- Go to Edge Functions section
- View logs and metrics for each function

---

## Update Process

### Update a Function
1. Make changes to function code
2. Test locally (if possible)
3. Deploy using: `supabase functions deploy <function-name> --project-ref wadhydemushqqtcrrlwm`
4. Verify deployment
5. Test in production

### Rollback a Function
1. Identify previous version
2. Restore code from git
3. Redeploy previous version
4. Verify rollback

---

## Best Practices

1. **Version Control**
   - All Edge Functions are in git
   - Tag releases for easy rollback
   - Document changes in commit messages

2. **Testing**
   - Test functions locally before deploying
   - Test with sample data after deployment
   - Monitor logs for errors

3. **Security**
   - Never commit secrets to git
   - Use Supabase secrets for sensitive data
   - Verify authentication in all functions

4. **Monitoring**
   - Monitor function execution times
   - Monitor error rates
   - Set up alerts for failures

---

**Last Updated:** 2026-01-11  
**Status:** ✅ All Functions Deployed
