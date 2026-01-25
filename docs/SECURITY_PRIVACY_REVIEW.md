# Security & Privacy Review

**Date:** 2026-01-25

## 1. Data Minimization
- [x] **Phone Numbers:** We only store the user's number. In UI, other members' numbers must be masked (e.g. `078***123`).
- [x] **Payments:** We do NOT store credit card or full bank details. We only store Transaction IDs (public refs).
- [x] **Photos:** Profile/Group photos are optional.

## 2. Secure Storage
- [x] **Tokens:** Supabase Auth tokens stored via `flutter_secure_storage` (EncryptedSharedPreferences on Android, Keychain on iOS).
- [x] **Passcode:** Not stored locally in plain text. PIN verification is server-side or hashed.

## 3. Communication Security
- [x] **HTTPS:** All API calls use TLS 1.2+.
- [x] **Certificate Pinning:** (Optional for V1, recommended for V2).

## 4. Abuse Prevention
- [x] **Rate Limiting:** Login attempts limited (Supabase defaults).
- [x] **Max Amounts:** Contribution > 4,000 RWF blocked.
- [x] **Max Balance:** 500,000 RWF cap enforced.

## 5. Third-Party Risks
- **Sentry:** configured to NOT send IP addresses or PII.
- **Supabase:** RLS policies enforced on all tables.

## 6. Compliance (Rwanda)
- Server location: Cloud-based (compliant with startup laws).
- Data sovereignty: User consent obtained for data processing during signup.
