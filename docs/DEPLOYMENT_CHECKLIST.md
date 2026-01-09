# Production Deployment Checklist

## Pre-Deployment

### Code & Testing
- [x] All pages reviewed and verified
- [ ] All manual tests passed
- [ ] Performance tests passed
- [ ] Security audit completed
- [ ] Code review completed
- [ ] Documentation updated

### Database
- [ ] All migrations applied
- [ ] RLS policies verified
- [ ] RPC functions deployed
- [ ] Notification templates seeded
- [ ] Cron jobs configured
- [ ] Database backup strategy in place
- [ ] Test database connection

### Edge Functions
- [ ] `generate-group-report` deployed
- [ ] `send-scheduled-notifications` deployed
- [ ] `send-contribution-confirmation` deployed
- [ ] `process-pending-notifications` deployed
- [ ] `send-whatsapp` deployed
- [ ] `staff-invite` deployed
- [ ] All Edge Functions tested
- [ ] Edge Function secrets configured

### Environment Variables
- [ ] `SUPABASE_URL` configured
- [ ] `SUPABASE_ANON_KEY` configured
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configured (Edge Functions)
- [ ] `WA_PHONE_ID` configured
- [ ] `META_WABA_BUSINESS_ID` configured
- [ ] `WHATSAPP_ACCESS_TOKEN` configured
- [ ] `WA_VERIFY_TOKEN` configured
- [ ] `WA_APP_SECRET` configured
- [ ] `OPENAI_API_KEY` configured (if using AI)

### Frontend
- [ ] Build completed successfully
- [ ] Environment variables set in build
- [ ] Static assets optimized
- [ ] Error tracking configured
- [ ] Analytics configured (if applicable)

---

## Deployment Steps

### 1. Database Migration
```bash
# Apply all migrations
supabase db push

# Verify migrations
supabase migration list

# Test database connection
supabase db ping
```

### 2. Edge Functions Deployment
```bash
# Deploy all Edge Functions
supabase functions deploy generate-group-report
supabase functions deploy send-scheduled-notifications
supabase functions deploy send-contribution-confirmation
supabase functions deploy process-pending-notifications
supabase functions deploy send-whatsapp
supabase functions deploy staff-invite

# Verify deployment
supabase functions list
```

### 3. Configure Secrets
```bash
# Set WhatsApp secrets
supabase secrets set WA_PHONE_ID=396791596844039
supabase secrets set META_WABA_BUSINESS_ID=297687286772462
supabase secrets set WHATSAPP_ACCESS_TOKEN=EAAGHrMn6uugBO9xlSTNU1FsbnZB7AnBLCvTlgZCYQDZC8OZA7q3nrtxpxn3VgHiT8o9KbKQIyoPNrESHKZCq2c9B9lvNr2OsT8YDBewaDD1OzytQd74XlmSOgxZAVL6TEQpDT43zZCZBwQg9AZA5QPeksUVzmAqTaoNyIIaaqSvJniVmn6dW1rw88dbZAyR6VZBMTTpjQZDZD
supabase secrets set WA_VERIFY_TOKEN=bd0e7b6f4a2c9d83f1e57a0c6b3d48e9
supabase secrets set WA_APP_SECRET=e0b171d137e058e9055ae61bb94e0984

# Set OpenAI API key (if using)
supabase secrets set OPENAI_API_KEY=your-openai-api-key-here
```

### 4. Seed Data
```sql
-- Run configure-groups.sql
-- This marks daily contribution groups, ensures leaders, and seeds templates
\i scripts/configure-groups.sql
```

### 5. Frontend Deployment
```bash
# Build for production
npm run build

# Deploy to hosting platform (Vercel, Netlify, etc.)
# Or copy dist/ to web server
```

---

## Post-Deployment Verification

### Immediate Checks
- [ ] All pages load without errors
- [ ] Authentication works
- [ ] Database queries execute
- [ ] RPC functions work
- [ ] Edge Functions respond
- [ ] No console errors
- [ ] No network errors

### Functional Checks
- [ ] Dashboard loads and displays data
- [ ] Groups page loads and CRUD works
- [ ] Members page loads and CRUD works
- [ ] Transactions page loads and allocation works
- [ ] Reports page loads and generates reports
- [ ] Institutions page loads (Platform Admin)
- [ ] Staff page loads and invite works
- [ ] SMS Gateway Devices page loads
- [ ] Settings pages load and save

### Integration Checks
- [ ] Transaction allocation triggers confirmation
- [ ] Report generation works
- [ ] WhatsApp notifications send
- [ ] SMS notifications send
- [ ] Staff invite emails send
- [ ] Audit log captures actions

### Performance Checks
- [ ] Page load times < 2 seconds
- [ ] Infinite scroll works smoothly
- [ ] Reports generate in reasonable time
- [ ] No memory leaks
- [ ] Database queries are optimized

### Security Checks
- [ ] RLS policies prevent unauthorized access
- [ ] Role-based access works correctly
- [ ] Cross-institution access is blocked
- [ ] Input validation works
- [ ] Output sanitization works

---

## Monitoring Setup

### Error Tracking
- [ ] Error logging configured
- [ ] Error alerts set up
- [ ] Error dashboard accessible

### Performance Monitoring
- [ ] Database query monitoring
- [ ] Edge Function execution monitoring
- [ ] Frontend performance monitoring
- [ ] API response time monitoring

### Business Metrics
- [ ] Transaction volume tracking
- [ ] Notification delivery tracking
- [ ] User activity tracking
- [ ] System health monitoring

---

## Rollback Plan

### If Issues Occur
1. **Immediate Rollback**
   - Revert database migrations if needed
   - Revert Edge Functions to previous version
   - Revert frontend to previous version

2. **Investigation**
   - Check error logs
   - Check database logs
   - Check Edge Function logs
   - Check monitoring dashboards

3. **Fix & Redeploy**
   - Fix identified issues
   - Test fixes in staging
   - Redeploy with fixes

---

## Communication Plan

### Pre-Deployment
- [ ] Notify stakeholders of deployment window
- [ ] Schedule maintenance window (if needed)
- [ ] Prepare rollback communication

### During Deployment
- [ ] Update status page (if applicable)
- [ ] Monitor deployment progress
- [ ] Address any issues immediately

### Post-Deployment
- [ ] Notify stakeholders of successful deployment
- [ ] Share deployment summary
- [ ] Gather initial feedback
- [ ] Monitor for issues

---

## Success Criteria

- ✅ All pages load without errors
- ✅ All critical flows work end-to-end
- ✅ Performance meets requirements
- ✅ Security is maintained
- ✅ No data loss
- ✅ No service interruption (or minimal)
- ✅ Stakeholder approval

---

**Deployment Date:** _______________  
**Deployed By:** _______________  
**Status:** _______________
