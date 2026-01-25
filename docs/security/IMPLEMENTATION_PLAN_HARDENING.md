---
title: "Implementation Plan: Security Hardening"
scope: package
---

# Implementation Plan: Flutter Security Hardening

## Goal
Secure the Ibimina application by preventing enumeration attacks, enforcing financial caps server-side, and ensuring RLS policies protect private data.

## 1. Plan

### In Scope
- **Edge Functions**: Hardening `ibimina-join-group` and `ibimina-confirm-contribution`.
- **Database**: Verifying constraints (4k cap, 500k wallet limit, One-Group rule) via migrations.
- **Deep Links**: Ensuring `/join` flow uses opaque short-lived tokens.
- **Rate Limiting**: Enabling DB-backed rate limiting for critical actions.

### Out of Scope
- Changing MoMo USSD flow.
- Modifying UI design (except for error messages).

## 2. Task List

### Phase 1: Edge Function Hardening (Critical)
- [ ] **Update `ibimina-join-group`**:
    - [ ] Replace `group_code` lookup with `group_invites` token resolution.
    - [ ] Call `check_rate_limit` RPC (IP/User based) at start.
    - [ ] Call `accept_invite` RPC to execute join.
    - [ ] Return success/error mappable to UI.
- [ ] **Update `ibimina-confirm-contribution`**:
    - [ ] Add `check_rate_limit` RPC call (User based, e.g. 5/min) to prevent spam approvals (or spam rejections).
    - [ ] Ensure 4k check is redundant here (fast fail) before calling DB.

### Phase 2: App Deep Link Update
- [ ] **Update `DeepLinkService`**:
    - [ ] Verify it extracts `token` correctly.
    - [ ] Ensure it passes `token` to the Join Screen.
- [ ] **Update Join Screen (UI)**:
    - [ ] Instead of entering code, support "Joining..." loading state from deep link.
    - [ ] Call new `joinGroup(token)` API.

### Phase 3: Verification
- [ ] **Test Rate Limit**: Spam endpoints and verify 429 Too Many Requests (or 400).
- [ ] **Test 4k Cap**: Try to submit 4001 RWF. Verify rejection.
- [ ] **Test Wallet Cap**: Try to exceed 500k. Verify rejection.
- [ ] **Test Enumeration**: Try to join with fake token. Verify generic error.

## 3. Risks
- **User Lockout**: Aggressive rate limits might block legitimate treasurers during meeting times.
    - *Mitigation*: Set Treasurer rate limits higher (e.g. 20/min) or whitelist IPs.
- **Deep Link Failure**: App might not handle cold start links.
    - *Mitigation*: Test `getInitialLink` flow carefully.

## 4. Test Plan
```bash
# Rate limit test
curl -X POST https://<project>.supabase.co/functions/v1/ibimina-confirm-contribution \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"submission_id": "...", "action": "APPROVE"}'
# Repeat 10x rapidly -> Expect Error
```
