# Monitoring Setup

## Overview
This document describes the monitoring infrastructure for the SACCO+ Admin Portal.

---

## Cloudflare Analytics

### What's Monitored
- Page views and unique visitors
- Geographic distribution
- Core Web Vitals (LCP, FID, CLS)
- Error rates (4xx, 5xx)

### Setup
1. Navigate to Cloudflare Dashboard → Analytics
2. Enable Web Analytics for your domain
3. Review dashboards weekly (see task.md schedule)

---

## Sentry Error Tracking

### Configuration
Error tracking is pre-configured in `lib/sentry.ts`. Sentry captures:
- Runtime errors
- Unhandled promise rejections
- Console errors in production

### Alert Rules (Recommended)
Configure in Sentry Dashboard:

| Rule | Trigger | Action |
|------|---------|--------|
| New issue | Any new error | Slack notification |
| Error spike | >10 errors/minute | Email + Slack |
| Regression | Known issue reappears | Email team |

---

## Core Web Vitals

Web Vitals are reported in production via `web-vitals` package (see `index.tsx`).

### Metrics Tracked
- **LCP** (Largest Contentful Paint): Target < 2.5s
- **FCP** (First Contentful Paint): Target < 1.8s
- **CLS** (Cumulative Layout Shift): Target < 0.1
- **TTFB** (Time to First Byte): Target < 600ms

### Viewing Metrics
- Check browser console for `[Web Vital]` logs
- Weekly Lighthouse CI runs (see `.github/workflows/performance.yml`)
- Cloudflare Analytics → Speed tab

---

## Uptime Monitoring (Optional)

### Recommended Services
- **UptimeRobot** (Free tier): https://uptimerobot.com
- **Better Uptime**: https://betteruptime.com

### Monitors to Create
| URL | Check Interval | Alert After |
|-----|----------------|-------------|
| `https://your-domain.pages.dev` | 5 min | 2 failures |
| Health endpoint (if implemented) | 5 min | 2 failures |

---

## Weekly Review Checklist

Every Monday, review:
- [ ] Cloudflare Analytics (traffic, errors)
- [ ] Sentry error trends
- [ ] Lighthouse CI report (artifacts in GitHub Actions)
- [ ] Bundle size changes
