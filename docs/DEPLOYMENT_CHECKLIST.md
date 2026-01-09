# Deployment Checklist

Complete step-by-step guide to deploy the Group Leaders & WhatsApp Notifications system.

## Prerequisites

- [ ] Supabase project set up
- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] WhatsApp Business API account configured
- [ ] WhatsApp credentials ready
- [ ] Access to Supabase Dashboard

## Step 1: Apply Database Migrations

### Option A: Using Supabase CLI
```bash
cd /path/to/your/project
supabase db push
```

### Option B: Manual SQL Execution
1. Open Supabase Dashboard > SQL Editor
2. Run `supabase/migrations/20260111000000_group_leaders_whatsapp.sql`
3. Run `supabase/migrations/20260111000001_contribution_confirmation.sql`

### Verification
```sql
-- Check if tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('notification_templates', 'notification_logs', 'group_reports');

-- Check if functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN ('get_group_leaders', 'send_contribution_confirmation');
```

## Step 2: Configure Groups

Run the configuration script:
```bash
# In Supabase SQL Editor
-- Copy and paste contents of scripts/configure-groups.sql
```

Or run manually:
```sql
-- Mark daily contribution groups
UPDATE public.groups
SET daily_contribution = true
WHERE group_name ILIKE '%buri munsi%';

-- Ensure all groups have leaders (run the DO block from configure-groups.sql)
-- Seed notification templates
SELECT public.seed_notification_templates('your-institution-id');
```

## Step 3: Set WhatsApp Credentials

### Option A: Using Setup Script
```bash
export SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
deno run --allow-net --allow-env scripts/set-whatsapp-secrets.ts
```

### Option B: Manual Setup in Supabase Dashboard
1. Go to Project Settings > Edge Functions
2. Add environment variables:
   - `WA_PHONE_ID=396791596844039`
   - `META_WABA_BUSINESS_ID=297687286772462`
   - `WA_TOKEN=EAAGHrMn6uugBO9xlSTNU1FsbnZB7AnBLCvTlgZCYQDZC8OZA7q3nrtxpxn3VgHiT8o9KbKQIyoPNrESHKZCq2c9B9lvNr2OsT8YDBewaDD1OzytQd74XlmSOgxZAVL6TEQpDT43zZCZBwQg9AZA5QPeksUVzmAqTaoNyIIaaqSvJniVmn6dW1rw88dbZAyR6VZBMTTpjQZDZD`
   - `WA_VERIFY_TOKEN=bd0e7b6f4a2c9d83f1e57a0c6b3d48e9`
   - `WA_APP_SECRET=e0b171d137e058e9055ae61bb94e0984`

### Option C: Update Settings Table
```sql
UPDATE public.settings
SET 
  whatsapp_enabled = true,
  whatsapp_phone_id = '396791596844039',
  whatsapp_business_id = '297687286772462',
  whatsapp_verify_token = 'bd0e7b6f4a2c9d83f1e57a0c6b3d48e9'
WHERE institution_id = 'your-institution-id';
```

## Step 4: Deploy Edge Functions

### Using Deployment Script
```bash
chmod +x scripts/deploy-notifications.sh
./scripts/deploy-notifications.sh
```

### Manual Deployment
```bash
supabase functions deploy generate-group-report
supabase functions deploy send-scheduled-notifications
supabase functions deploy send-contribution-confirmation
supabase functions deploy process-pending-notifications
supabase functions deploy send-whatsapp
```

### Verification
Check in Supabase Dashboard > Edge Functions that all functions are deployed.

## Step 5: Set Up Cron Jobs

### Option A: Using pg_cron (Recommended)
1. Enable pg_cron extension in Supabase
2. Run `scripts/setup-cron-jobs.sql` in SQL Editor
3. Set required settings:
   ```sql
   ALTER DATABASE postgres SET app.supabase_url = 'https://your-project.supabase.co';
   ALTER DATABASE postgres SET app.service_role_key = 'your-service-role-key';
   ALTER DATABASE postgres SET app.cron_secret = 'your-secret-key';
   ```

### Option B: External Cron Service
Use GitHub Actions, Vercel Cron, or similar:
```yaml
# Example GitHub Actions workflow
name: Send Notifications
on:
  schedule:
    - cron: '0 9 * * 1' # Every Monday at 9 AM
jobs:
  send:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Notifications
        run: |
          curl -X POST https://your-project.supabase.co/functions/v1/send-scheduled-notifications \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"type": "CONTRIBUTION_REMINDER"}'
```

## Step 6: Testing

### Run Test Script
```bash
chmod +x scripts/test-notifications.sh
./scripts/test-notifications.sh
```

### Manual Testing

#### Test 1: Contribution Confirmation
1. Make a MoMo payment to institution MoMo code
2. Check `notification_logs` table:
   ```sql
   SELECT * FROM notification_logs 
   WHERE template_type = 'CONTRIBUTION_CONFIRMATION' 
   ORDER BY created_at DESC LIMIT 5;
   ```
3. Verify member received WhatsApp and SMS

#### Test 2: Manual Report Generation
1. Log into portal as staff
2. Go to Settings > Notifications
3. Select a group
4. Choose "Group Report"
5. Select report type and dates
6. Click "Send Notification"
7. Check `group_reports` table:
   ```sql
   SELECT * FROM group_reports ORDER BY generated_at DESC LIMIT 1;
   ```

#### Test 3: WhatsApp Sending
```bash
# Test WhatsApp function directly
curl -X POST https://your-project.supabase.co/functions/v1/send-whatsapp \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+250788123456",
    "message": "Test message from Ibimina"
  }'
```

## Step 7: Verification Queries

Run these to verify everything is set up correctly:

```sql
-- Check groups with leaders
SELECT 
  g.group_name,
  COUNT(gm.id) FILTER (WHERE gm.role IN ('LEADER', 'CHAIRPERSON')) as leader_count,
  COUNT(gm.id) as total_members
FROM groups g
LEFT JOIN group_members gm ON gm.group_id = g.id AND gm.status = 'GOOD_STANDING'
WHERE g.status = 'ACTIVE'
GROUP BY g.id, g.group_name
HAVING COUNT(gm.id) FILTER (WHERE gm.role IN ('LEADER', 'CHAIRPERSON')) = 0;

-- Check notification templates
SELECT 
  institution_id,
  template_type,
  channel,
  COUNT(*) as count
FROM notification_templates
WHERE is_active = true
GROUP BY institution_id, template_type, channel;

-- Check recent notifications
SELECT 
  recipient_type,
  channel,
  status,
  COUNT(*) as count
FROM notification_logs
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY recipient_type, channel, status;

-- Check WhatsApp settings
SELECT 
  institution_id,
  whatsapp_enabled,
  whatsapp_phone_id IS NOT NULL as has_phone_id
FROM settings;
```

## Troubleshooting

### Migrations Failed
- Check for syntax errors in migration files
- Verify you have necessary permissions
- Check Supabase logs for detailed errors

### Edge Functions Not Deploying
- Verify Supabase CLI is authenticated: `supabase login`
- Check function code for errors
- Verify environment variables are set

### WhatsApp Not Sending
- Verify credentials in Edge Function environment
- Check notification_logs for error messages
- Test WhatsApp API directly with curl
- Verify phone numbers are in international format

### Cron Jobs Not Running
- Check if pg_cron extension is enabled
- Verify settings are configured correctly
- Check cron.job table for scheduled jobs
- Review Supabase logs for errors

## Post-Deployment

- [ ] Monitor notification_logs for delivery rates
- [ ] Set up alerts for failed notifications
- [ ] Review group_reports generation
- [ ] Train staff on manual notification triggers
- [ ] Document any custom configurations

## Support

For issues or questions:
1. Check `docs/GROUP_LEADERS_WHATSAPP_SETUP.md`
2. Review Supabase logs
3. Check notification_logs for error details
4. Verify all prerequisites are met
