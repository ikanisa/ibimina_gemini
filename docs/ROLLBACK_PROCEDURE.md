# Rollback Procedure

## Cloudflare Pages Rollback

### Quick Rollback (< 2 minutes)

1. **Go to Cloudflare Dashboard**
   - Navigate to: Workers & Pages → ibimina-gemini → Deployments

2. **Find Last Good Deployment**
   - Look for green checkmark (successful build)
   - Verify timestamp is before the issue

3. **Rollback**
   - Click the "..." menu on the good deployment
   - Select "Rollback to this deployment"
   - Confirm the rollback

4. **Verify**
   ```bash
   # Check site is accessible
   curl -I https://your-domain.pages.dev
   
   # Test login
   # Navigate to app and verify critical flows
   ```

---

## When to Rollback

- ✅ Site is completely down after deployment
- ✅ Critical feature is broken (auth, transactions)
- ✅ Major console errors affecting all users
- ✅ Security vulnerability discovered

## When NOT to Rollback

- ❌ Minor UI bug affecting few users
- ❌ Issue existed before deployment
- ❌ Issue is in external service (Supabase, etc.)

---

## Git-Based Rollback

If you need to revert code changes:

```bash
# Find the last good commit
git log --oneline -10

# Revert to specific commit
git revert <commit-hash>

# Or reset to previous state (careful - rewrites history)
git reset --hard <commit-hash>
git push --force-with-lease origin main
```

---

## Post-Rollback Actions

1. [ ] Verify site functionality
2. [ ] Check error logs (should decrease)
3. [ ] Notify team of rollback
4. [ ] Create hotfix branch for the issue
5. [ ] Document what went wrong
6. [ ] Test fix in preview environment before re-deploying

---

## Preview Environment Testing

Before deploying to production again:

```bash
# Create fix branch
git checkout -b fix/issue-name

# Make changes, commit
git add .
git commit -m "fix: description"
git push origin fix/issue-name

# Cloudflare will auto-create preview URL:
# https://fix-issue-name.ibimina-gemini.pages.dev

# Test thoroughly before merging to main
```
