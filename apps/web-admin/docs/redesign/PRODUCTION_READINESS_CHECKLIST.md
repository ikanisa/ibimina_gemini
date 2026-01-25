# Production Readiness Checklist

**Version:** 1.0  
**Date:** 2026-01-07  
**Phase:** 9 - Operational Polish

---

## 🔒 Security

### Row Level Security (RLS)

- [x] All sensitive tables have RLS enabled
- [x] Institution scoping enforced on all data tables
- [x] `momo_sms_raw` NULL institution_id access removed
- [x] INSTITUTION_AUDITOR read-only enforcement added
- [x] `can_write()` helper function created
- [x] `can_manage_institution()` helper function created
- [ ] Manual verification: staff cannot read other institution data
- [ ] Manual verification: institution admin cannot manage other institutions
- [ ] Manual verification: platform admin has full access

### Authentication

- [x] Login/logout flow works correctly
- [x] Session expiration handled
- [x] Password change functionality exists
- [x] Production guard for `VITE_USE_MOCK_DATA`
- [ ] Multi-factor authentication (if required)

### API Security

- [x] Supabase anon key only in frontend
- [x] Service role key only in Edge Functions
- [x] API keys for SMS ingest are separate
- [ ] Rate limiting configured in Supabase

---

## 📋 Audit Trail

### Event Coverage

- [x] SMS ingestion events logged
- [x] SMS parsing events logged
- [x] Transaction allocation events logged
- [x] Transaction duplicate marking logged
- [x] Settings changes logged
- [x] Institution management logged
- [x] Staff management logged
- [ ] User login/logout events (future enhancement)

### Audit Log UI

- [x] Paginated list view
- [x] Filter by date range
- [x] Filter by action type
- [x] Filter by entity type
- [x] Filter by actor
- [x] Detail drawer with full metadata
- [x] Entity links (navigate to transaction/member/group)
- [ ] Export to CSV (future enhancement)

---

## ⚡ Performance

### Database Indexes

- [x] `idx_transactions_inst_occurred` - Dashboard queries
- [x] `idx_transactions_inst_status_occurred` - Filtered queries
- [x] `idx_transactions_inst_allocation_status` - Unallocated queue
- [x] `idx_audit_log_inst_created` - Audit log queries
- [x] `idx_audit_log_action_created` - Action filtering
- [x] `idx_members_inst_phone_primary` - Phone lookups
- [x] `idx_sms_sources_inst_last_seen` - Health checks

### Frontend Optimization

- [x] Lazy-loaded routes
- [x] Suspense boundaries for code splitting
- [x] Skeleton loading states
- [ ] React Query caching (partial)
- [ ] Search debouncing (partial)
- [ ] Image optimization

### Pagination

- [x] Audit log paginated with cursor
- [x] Infinite scroll for transactions (via hooks)
- [x] Infinite scroll for members
- [ ] Server-side pagination for all large lists

---

## 🌐 Cloudflare Deployment

### Build Configuration

- [x] Build command: `npm run build`
- [x] Output directory: `dist`
- [x] Node version: 18+
- [x] SPA routing: `_redirects` present

### Environment Variables

- [x] `VITE_SUPABASE_URL` - Supabase project URL
- [x] `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
- [x] Production guard for mock data
- [ ] Sentry DSN (optional)

### Error Handling

- [x] Error boundary component exists
- [x] Dev-only error details
- [x] Reload/retry buttons
- [ ] Sentry integration (optional)

---

## 🏥 System Health

### Health Checks

- [x] Primary MoMo code presence
- [x] Active SMS source presence
- [x] SMS source stale detection (24h)
- [x] Unallocated transaction count
- [x] Unallocated aging count (24h)
- [x] Parse errors count

### Health UI

- [x] Global health indicator in header
- [x] Health status dot (green/amber/red)
- [x] Issue count badge
- [x] Health drawer with details
- [x] Actionable issue links
- [x] Auto-refresh every 5 minutes

---

## 🧪 Testing

### Unit Tests

- [ ] Component tests (Vitest)
- [ ] Hook tests
- [ ] Utility function tests

### E2E Tests

- [x] Security tests (Playwright)
- [x] Critical flow tests
- [x] Smoke tests
- [ ] Accessibility tests

### Manual Testing

- [ ] Login flow
- [ ] Dashboard data loads
- [ ] Transaction allocation
- [ ] Reconciliation actions
- [ ] Settings changes
- [ ] Multi-device testing
- [ ] Offline behavior

---

## 📱 PWA Compliance

- [x] Manifest file exists
- [x] Service worker registered
- [x] App icons (192x192, 512x512)
- [x] Offline caching strategy
- [ ] Install prompt handling
- [ ] Push notifications (future)

---

## 📚 Documentation

- [x] Schema documentation
- [x] Routes map
- [x] QA/UAT checklist
- [x] Deployment guide
- [x] Phase 9 audit report
- [x] Production readiness checklist
- [ ] API documentation
- [ ] User manual

---

## 🚀 Pre-Launch Checklist

### Database

- [ ] All migrations applied
- [ ] Seed data verified
- [ ] Backup configured
- [ ] Point-in-time recovery enabled

### Supabase

- [ ] Edge functions deployed
- [ ] Secrets configured (OPENAI_API_KEY, GEMINI_API_KEY, INGEST_API_KEY)
- [ ] Realtime disabled for sensitive tables
- [ ] Email templates configured

### Cloudflare

- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Environment variables set
- [ ] Build successful

### Monitoring

- [ ] Error tracking (Sentry)
- [ ] Performance monitoring
- [ ] Uptime monitoring
- [ ] Log aggregation

### Legal

- [ ] Privacy policy
- [ ] Terms of service
- [ ] Cookie consent (if applicable)

---

## ✅ Final Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| QA | | | |
| Security | | | |
| Product Owner | | | |

---

## 📝 Notes

### Known Issues

1. Mock data mode should be completely removed for production builds
2. Some components may still have hardcoded test data fallbacks
3. Sentry integration is optional but recommended

### Deferred Items

1. Multi-factor authentication
2. Push notifications
3. Export to CSV from audit log
4. Full React Query integration

### Contacts

- **Technical Lead:** [Contact]
- **DevOps:** [Contact]
- **Security:** [Contact]

