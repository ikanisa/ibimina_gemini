# Group Leaders & WhatsApp Integration Setup Guide

This document describes the group management functionality with leaders, WhatsApp notifications, and automated PDF reports.

## Features Implemented

### 1. Contribution Confirmations
- Automatic confirmation notifications after contribution allocation
- Sent via both WhatsApp and SMS
- Includes:
  - Amount just contributed
  - Total overall contribution
  - Outstanding arrears (if any) based on budgeted periodic contribution
- Triggered automatically when a MoMo payment is parsed and allocated to a member

### 2. Group Leaders
- Groups must have at least one leader (enforced by database constraint)
- Member roles: `LEADER`, `CHAIRPERSON`, `SECRETARY`, `TREASURER`, `MEMBER`
- UI displays member roles in group lists
- Leaders receive group contribution reports via WhatsApp

### 2. WhatsApp Notifications
- Integration with Meta WhatsApp Business API
- Support for text messages and document (PDF) sending
- Notification templates for different message types
- Notification logging for tracking

### 3. Automated Reports
- Weekly reports for daily contribution groups (like "buri munsi")
- Monthly reports for monthly contribution groups
- Overall contribution summaries
- PDF generation with member contribution breakdowns
- Automatic delivery to group leaders via WhatsApp

### 4. Notification Types
- **Contribution Confirmations**: Automatic confirmations after each contribution (WhatsApp + SMS)
- **Contribution Reminders**: Weekly reminders to members
- **Periodic Totals**: Individual contribution summaries sent to each member
- **Group Reports**: Comprehensive reports sent to group leaders

## Database Schema Changes

### New Tables
1. **notification_templates**: Stores message templates for SMS and WhatsApp
2. **notification_logs**: Logs all notifications sent
3. **group_reports**: Stores generated PDF reports

### Updated Tables
1. **group_members**: Added `LEADER` role to enum
2. **groups**: Added `daily_contribution` flag
3. **settings**: Added WhatsApp configuration fields

### New Functions
- `get_group_leaders(group_id)`: Returns all leaders for a group
- `get_member_contributions_summary(member_id, group_id, period_start, period_end)`: Gets member contribution totals
- `get_group_contributions_summary(group_id, period_start, period_end)`: Gets group-wide contribution summary
- `calculate_member_arrears(member_id, group_id, current_date)`: Calculates outstanding arrears for a member
- `send_contribution_confirmation(transaction_id)`: Prepares and logs contribution confirmation notifications
- `seed_notification_templates(institution_id)`: Seeds default templates

## Setup Instructions

### 1. Run Database Migrations

```bash
# Apply the migrations
supabase migration up
# Or apply manually in Supabase SQL Editor
```

Migration files:
- `supabase/migrations/20260111000000_group_leaders_whatsapp.sql` - Group leaders and WhatsApp setup
- `supabase/migrations/20260111000001_contribution_confirmation.sql` - Contribution confirmation notifications

### 2. Set WhatsApp Credentials

#### Option A: Using the Setup Script

```bash
# Set environment variables
export SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Run the script
deno run --allow-net --allow-env scripts/set-whatsapp-secrets.ts
```

#### Option B: Manual Setup

1. **Set Supabase Edge Function Environment Variables**:
   - Go to Supabase Dashboard > Project Settings > Edge Functions
   - Add these environment variables:
     - `WA_PHONE_ID=396791596844039`
     - `META_WABA_BUSINESS_ID=297687286772462`
     - `WA_TOKEN=EAAGHrMn6uugBO9xlSTNU1FsbnZB7AnBLCvTlgZCYQDZC8OZA7q3nrtxpxn3VgHiT8o9KbKQIyoPNrESHKZCq2c9B9lvNr2OsT8YDBewaDD1OzytQd74XlmSOgxZAVL6TEQpDT43zZCZBwQg9AZA5QPeksUVzmAqTaoNyIIaaqSvJniVmn6dW1rw88dbZAyR6VZBMTTpjQZDZD`
     - `WA_VERIFY_TOKEN=bd0e7b6f4a2c9d83f1e57a0c6b3d48e9`
     - `WA_APP_SECRET=e0b171d137e058e9055ae61bb94e0984`

2. **Update Institution Settings**:
   ```sql
   UPDATE settings
   SET 
     whatsapp_enabled = true,
     whatsapp_phone_id = '396791596844039',
     whatsapp_business_id = '297687286772462',
     whatsapp_verify_token = 'bd0e7b6f4a2c9d83f1e57a0c6b3d48e9'
   WHERE institution_id = 'your-institution-id';
   ```

3. **Seed Notification Templates**:
   ```sql
   SELECT seed_notification_templates('your-institution-id');
   ```

### 3. Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy generate-group-report
supabase functions deploy send-scheduled-notifications
supabase functions deploy set-whatsapp-secrets
supabase functions deploy send-contribution-confirmation
supabase functions deploy process-pending-notifications
```

### 4. Set Up Scheduled Jobs

You need to set up cron jobs to trigger the scheduled notifications. Options:

#### Option A: Using pg_cron (PostgreSQL extension)

```sql
-- Install pg_cron if not already installed
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Weekly contribution reminders (every Monday at 9 AM)
SELECT cron.schedule(
  'weekly-contribution-reminders',
  '0 9 * * 1', -- Every Monday at 9 AM
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/send-scheduled-notifications',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{"type": "CONTRIBUTION_REMINDER"}'::jsonb
  );
  $$
);

-- Weekly reports for daily contribution groups (every Monday at 10 AM)
SELECT cron.schedule(
  'weekly-group-reports',
  '0 10 * * 1', -- Every Monday at 10 AM
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/send-scheduled-notifications',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{"type": "GROUP_REPORT"}'::jsonb
  );
  $$
);

-- Monthly reports (first day of month at 9 AM)
SELECT cron.schedule(
  'monthly-group-reports',
  '0 9 1 * *', -- First day of month at 9 AM
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/send-scheduled-notifications',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb,
    body := '{"type": "GROUP_REPORT"}'::jsonb
  );
  $$
);

-- Process pending notifications (every minute)
SELECT cron.schedule(
  'process-pending-notifications',
  '* * * * *', -- Every minute
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/process-pending-notifications',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_ANON_KEY", "x-cron-secret": "YOUR_CRON_SECRET"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);
```

#### Option B: External Cron Service

Use a service like GitHub Actions, Vercel Cron, or a dedicated cron service to call the Edge Functions on schedule.

### 5. Configure Groups

Mark groups that require daily contributions:

```sql
UPDATE groups
SET daily_contribution = true
WHERE group_name LIKE '%buri munsi%' OR group_name LIKE '%daily%';
```

## Usage

### Generate a Group Report

```typescript
import { generateGroupReport } from './lib/api/reports.api';

const report = await generateGroupReport({
  groupId: 'group-uuid',
  reportType: 'WEEKLY',
  periodStart: '2026-01-01',
  periodEnd: '2026-01-07',
  sendToLeaders: true,
});
```

### Send Contribution Reminder

```typescript
import { notificationService } from './lib/services/notification.service';

await notificationService.sendContributionReminder(
  institutionId,
  memberId,
  memberName,
  memberPhone,
  groupName,
  expectedAmount,
  'RWF',
  dueDate,
  'WHATSAPP' // or 'SMS' or 'BOTH'
);
```

### Send Periodic Total to Member

```typescript
await notificationService.sendPeriodicTotal(
  institutionId,
  memberId,
  memberName,
  memberPhone,
  groupName,
  'Week 1',
  periodTotal,
  overallTotal,
  'RWF',
  'WHATSAPP'
);
```

## Notification Templates

Default templates are seeded for each institution. You can customize them:

```sql
UPDATE notification_templates
SET body = 'Your custom message with {{variables}}'
WHERE institution_id = 'your-institution-id'
  AND template_type = 'CONTRIBUTION_REMINDER';
```

Available template variables:
- `{{member_name}}`: Member's full name
- `{{group_name}}`: Group name
- `{{expected_amount}}`: Expected contribution amount
- `{{currency}}`: Currency code
- `{{due_date}}`: Due date
- `{{period}}`: Period label
- `{{period_total}}`: Total for the period
- `{{overall_total}}`: Overall total
- `{{total_contributions}}`: Group total contributions
- `{{member_count}}`: Number of members
- `{{contribution_amount}}`: Amount just contributed (for confirmations)
- `{{arrears_message}}`: Message about outstanding arrears (for confirmations)

## Testing

### Test WhatsApp Integration

```typescript
import { whatsappService } from './lib/services/whatsapp.service';

const config = await whatsappService.loadConfigFromSupabase();
await whatsappService.initialize(config);

const result = await whatsappService.sendMessage({
  to: '+250788123456',
  message: 'Test message from Ibimina system',
});

console.log(result);
```

### Test Report Generation

```typescript
import { generateGroupReport } from './lib/api/reports.api';

const report = await generateGroupReport({
  groupId: 'test-group-id',
  reportType: 'WEEKLY',
  sendToLeaders: false, // Set to false for testing
});
```

## Troubleshooting

### WhatsApp Messages Not Sending

1. Verify credentials are set correctly in Edge Function environment variables
2. Check notification logs: `SELECT * FROM notification_logs ORDER BY created_at DESC LIMIT 10;`
3. Verify phone numbers are in international format (+250...)
4. Check WhatsApp Business API status in Meta Business Manager

### Reports Not Generating

1. Check Edge Function logs in Supabase Dashboard
2. Verify group has contributions: `SELECT * FROM transactions WHERE group_id = '...' AND type = 'CONTRIBUTION';`
3. Check group_reports table: `SELECT * FROM group_reports WHERE group_id = '...';`

### Groups Without Leaders

The database constraint prevents removing the last leader. To add a leader:

```sql
INSERT INTO group_members (institution_id, group_id, member_id, role)
VALUES ('institution-id', 'group-id', 'member-id', 'LEADER');
```

## Security Notes

- WhatsApp access tokens should be stored securely (Supabase Vault or environment variables)
- Never commit credentials to version control
- Use service role key only in Edge Functions, never in client-side code
- Implement rate limiting for notification sending
- Monitor notification logs for abuse

## Next Steps

1. Set up cron jobs for automated notifications
2. Customize notification templates for your institution
3. Configure daily contribution groups
4. Test end-to-end notification flow
5. Monitor notification delivery rates
