# SMS Gateway Devices Migration Instructions

## Quick Start

### Step 1: Apply Migration via Supabase Dashboard

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/wadhydemushqqtcrrlwm
2. Navigate to **SQL Editor** (left sidebar)
3. Click **New Query**
4. Copy the entire contents of `supabase/migrations/20260110000000_sms_gateway_devices.sql`
5. Paste into the SQL Editor
6. Click **Run** (or press Cmd/Ctrl + Enter)
7. Wait for "Success" message

### Step 2: Verify Migration

1. In the same SQL Editor, open `docs/sms-gateway/VERIFY_MIGRATION.sql`
2. Copy and paste the verification queries
3. Run them to confirm all tables, indexes, triggers, and policies were created

### Step 3: Update Environment Variables (if needed)

Make sure your `.env.local` has:

```env
VITE_SUPABASE_URL=https://wadhydemushqqtcrrlwm.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndhZGh5ZGVtdXNocXF0Y3JybHdtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NDE1NTQsImV4cCI6MjA4MTMxNzU1NH0.9O6NMVpat63LnFO7hb9dLy0pz8lrMP0ZwGbIC68rdGI
```

### Step 4: Test the UI

1. Start your dev server: `npm run dev`
2. Log in as a platform admin
3. Navigate to **SMS Gateway Devices** in the sidebar
4. Try adding a device to verify everything works

## What This Migration Creates

### Tables
- **sms_gateway_devices**: Stores registered devices with MoMo codes
- **momo_sms_raw**: Stores raw SMS messages before parsing

### Features
- Auto-updates `last_sms_received_at` when SMS arrives
- RLS policies for authenticated read access
- Unique constraint on MoMo codes
- Indexes for performance

### Security
- Read access for authenticated users
- Write operations should use Edge Functions or service role
- Device keys are hashed (not stored in plain text)

## Troubleshooting

### Migration Fails
- Check if tables already exist (use `DROP TABLE IF EXISTS` if needed)
- Verify you have proper permissions
- Check Supabase logs for detailed error messages

### Tables Not Showing
- Refresh the Supabase Dashboard
- Check the `public` schema (not `auth` or `storage`)
- Run verification queries to confirm

### RLS Issues
- Verify policies were created: `SELECT * FROM pg_policies WHERE tablename = 'sms_gateway_devices';`
- Check your user has `authenticated` role
- Platform admins should have full access via service role

## Next Steps

After migration is successful:
1. ✅ Test adding a device via UI
2. ✅ Create Edge Function for SMS ingestion
3. ✅ Set up device key generation (server-side)
4. ✅ Configure SMS gateway app to send to your endpoint
