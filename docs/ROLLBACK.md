# Rollback Plan - SACCO+ Admin Portal

## Trigger Conditions
Initiate rollback if any of the following P0 issues occur immediately after deployment:
1. **White Screen of Death (WSOD)**: Application fails to load main view.
2. **Auth Failure**: Users cannot login or are stuck in a redirect loop.
3. **Critical Data Loss**: Transactions or member data fails to load or save.
4. **Broken Navigation**: Sidebar or routing is completely non-functional.

## Rollback Procedure (Cloudflare Pages)

### 1. Identify the Bad Deployment
- Go to [Cloudflare Dashboard](https://dash.cloudflare.com) > Pages > `sacco-admin`.
- Identify the current "Active" deployment (the broken one).

### 2. Revert to Previous Version
- Find the **previous successful deployment** in the list.
- Click the three dots (...) menu on that deployment.
- Select **"Rollback to this deployment"**.
- Confirm the action.

### 3. Verify Rollback
- Wait for Cloudflare to update (usually < 30 seconds).
- Visit `https://sacco.ikanisa.com/` in an Incognito window.
- Verify that the P0 issue is resolved.

## Rollback Procedure (Cloud Run - If migrated)

### 1. Identify Revision
- Go to GCP Console > Cloud Run > `sacco-admin`.
- Go to the **Revisions** tab.

### 2. Route Traffic
- Select the **previous healthy revision**.
- Click **"Manage Traffic"**.
- Set traffic to 100% for the healthy revision.
- Click **Save**.

### 3. Verify
- Visit the application URL.
- Verify stability.

## Post-Rollback Analysis
1. Download logs from the failed deployment.
2. Check Sentry for new error spikes.
3. Create a hotfix branch from `main`.
4. Reproduce the issue locally.
5. Fix and deploy to Preview first.
