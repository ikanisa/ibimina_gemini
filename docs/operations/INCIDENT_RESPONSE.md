# Incident Response Procedure

## Overview
This document outlines the incident response procedure for the SACCO+ Admin Portal deployed on Cloudflare Pages.

---

## Severity Levels

| Level | Description | Response Time | Example |
|-------|-------------|---------------|---------|
| **P1 - Critical** | Complete service outage | 15 minutes | Site down, database unreachable |
| **P2 - High** | Major feature broken | 1 hour | Transactions not loading, auth failing |
| **P3 - Medium** | Minor feature issue | 4 hours | Report export failing, UI glitch |
| **P4 - Low** | Cosmetic/Non-urgent | 24 hours | Typo, minor styling issue |

---

## Incident Response Steps

### 1. Detection
- **Cloudflare Analytics**: Check for traffic drop or error spikes
- **Sentry**: Monitor error spike alerts
- **User Reports**: Check support channels

### 2. Triage
1. Identify affected users/institutions
2. Determine severity level
3. Check recent deployments
4. Review error logs in Sentry

### 3. Communication
- **P1/P2**: Notify team immediately via Slack/Phone
- **All**: Update status in incident tracking system
- **External**: If widespread, notify affected institutions

### 4. Resolution

#### For Deployment Issues:
```bash
# Check Cloudflare Pages deployment status
# Cloudflare Dashboard → Pages → Deployments

# Rollback to previous version if needed
# See: docs/ROLLBACK_PROCEDURE.md
```

#### For Supabase Issues:
- Check Supabase Dashboard for service status
- Review database connection errors
- Check Edge Function logs

### 5. Post-Incident
- [ ] Document root cause
- [ ] Create fix if not already applied
- [ ] Update runbooks if needed
- [ ] Conduct post-mortem for P1/P2

---

## Emergency Contacts

| Role | Name | Contact |
|------|------|---------|
| DevOps Lead | _______ | _______ |
| Backend Lead | _______ | _______ |
| Product Owner | _______ | _______ |

---

## External Support

- **Cloudflare Status**: https://www.cloudflarestatus.com
- **Supabase Status**: https://status.supabase.com
- **Sentry Support**: https://sentry.io/support
