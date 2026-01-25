---
title: "Security Threat Model: Ibimina Micro-Savings"
scope: package
---

# Threat Model: Ibimina

## 1. Assets
- **User Identity**: Phone numbers (MoMo), User Profiles.
- **Group Privacy**: Membership lists, Group Names (Private groups must stay hidden).
- **Financial Integrity**: Ledger History (Append-only), Balance correctness.
- **Trust**: Validation proofs (SMS/Screenshots) of MoMo transfers.

## 2. Actors
- **Member**: Valid authenticated user. Can submit contributions, view own history.
- **Group Admin**: Can approve/reject contributions, invite members.
- **Platform Admin**: Super-admin (Support Staff).
- **Malicious User**: Attempting to spy on other groups or submit fake proofs.
- **Bot/Script**: Bruteforcing join codes or spamming submissions.

## 3. Top Threats & Mitigations

| Threat ID | Description | Impact | Likelihood | Mitigation | Status |
|---|---|---|---|---|---|
| **T-01** | **Join Code Enumeration** <br> Attacker guesses `group_code` to join private groups. | High (Privacy Breach) | High (if code is short) | **Opaque Tokens**: Use UUIDs for invites via `group_invites` table. <br> **Expiry**: Tokens expire. <br> **Rate Limit**: Block IPs guessing codes. | 🟡 In Progress (Migration created, Edge Function outdated) |
| **T-02** | **Fake Contribution Spam** <br> Attacker floods `submissions` with fake data to annoy admins. | Medium (DOS/Annoyance) | Medium | **Rate Limiting**: Max 5 submissions/min per user. <br> **4k Cap**: Rejects high-value spam immediately. | 🟢 Ready (Migration defines Rate Limit RPC & Triggers) |
| **T-03** | **Ledger Tampering** <br> Rogue admin or db-access leak modifies history. | Critical (Fraud) | Low | **Immutable Ledger**: DB Trigger prevents UPDATE/DELETE on `ledger`. <br> **Audit Logs**: All admin actions logged. | 🟢 Ready (Migration defines Immutable Trigger) |
| **T-04** | **IDOR on Submissions** <br> User views/edits other users' submissions. | High (Privacy) | Low | **RLS**: Row Level Security policies enforce `auth.uid() = user_id`. | 🟢 Ready (Migration defines RLS) |
| **T-05** | **MoMo SMS Spoofing** <br> User edits SMS text to create fake proof. | Medium (Fraud) | Medium | **Manual Verification**: Group Treasurer MUST verify against actual MoMo account. <br> **Warning**: UI warns that fraud leads to ban. | 🟡 Procedural (App relies on Admin verification) |
| **T-06** | **One-Group Bypass** <br> User joins multiple groups to exceed wallet caps. | High (Compliance) | Low | **Unique Constraint**: `memberships(user_id)` unique index. <br> **DB Check**: `accept_invite` RPC checks existing membership. | 🟢 Ready (Schema enforces unique constraint) |

## 4. Attack Surface Analysis

### Edge Functions
- `ibimina-join-group`: Currently accepts `group_code`. **VULNERABLE** to enumeration.
    - **Fix**: Switch to `accept_invite` RPC with UUID token.
- `ibimina-confirm-contribution`: Accepts `submission_id`. Protected by checks but needs explicit Rate Limit.

### Database
- `groups`: RLS must prevent listing all groups.
- `profiles`: PII (Phone) must be protected.

## 5. Security Gates
- [x] **Constriant Check**: 4k/500k/1-Group enforced in DB/Triggers.
- [ ] **Code Fix**: Edge Functions updated to use new Schema/RPCs.
- [ ] **Verification**: Manual attempt to bypass caps (Red Team).
