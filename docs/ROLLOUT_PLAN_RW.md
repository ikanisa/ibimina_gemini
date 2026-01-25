# Rollout Plan (Rwanda)

## Phase 1: Internal Alpha (Days 1-3)
- **Audience:** Internal dev team + Stakeholders.
- **Distribution:** APK sideload or Internal Testing track.
- **Goal:** Verify "Happy Path" works on real devices.
- **Success Metric:** 0 Crashes, 10 successful test contributions.

## Phase 2: Closed Beta (Days 4-10)
- **Audience:** 2 Pilot Cooperatives (approx. 20 users).
- **Distribution:** Play Store Closed Testing (Email list).
- **Goal:** Verify UAT in the field (low connectivity).
- **Success Metric:** Users can join via QR, submit 1 contribution each.

## Phase 3: Public Production (Day 11+)
- **Audience:** Public.
- **Distribution:** Play Store Production.
- **Staged Rollout:**
  - 20% (Day 1) -> Monitor Sentry.
  - 50% (Day 3) -> Monitor Support.
  - 100% (Day 5).

## Rollback Plan
**If P0 Bug (Crash on launch, Data corruption) is found:**
1. **Halt Rollout:** Stop staged rollout in Play Console immediately.
2. **Revert:** Revert database migrations if applicable (unlikely for V1).
3. **Fix:** Prepare Hotfix Release (v1.0.1+2).
4. **Deploy:** Push to production track (skips beta if critical).
