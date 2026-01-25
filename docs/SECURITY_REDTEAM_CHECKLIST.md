# Security Red-Team Checklist

This manual audit checklist covers security testing for the Ibimina Flutter mobile app.
Run through this checklist after each security-related change or before major releases.

---

## Pre-Requisites

- [ ] Access to staging environment with test data
- [ ] Test user account (non-admin)
- [ ] Test admin account
- [ ] Network inspection tool (Charles Proxy, mitmproxy, or browser DevTools)
- [ ] Device with app installed (or emulator)

---

## 1. Authentication & Session Security

### 1.1 OTP Abuse Prevention
| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| OTP rate limit | Request OTP 4+ times for same number within 5 min | 4th request blocked with user-friendly error | ⬜ |
| OTP format validation | Enter non-numeric OTP code | Validation error, no server call | ⬜ |
| Phone format validation | Enter phone without +250 prefix | Validation error | ⬜ |
| Phone length validation | Enter phone with wrong length | Validation error | ⬜ |

### 1.2 Session Management
| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Session persistence | Close and reopen app | User remains logged in | ⬜ |
| Session expiry | Wait for token expiry (if configured) | Redirect to login | ⬜ |
| Logout clears session | Log out, inspect secure storage | No tokens remain | ⬜ |
| Logout clears Google auth | Log out via Google, inspect GoogleSignIn | Cached credentials cleared | ⬜ |

---

## 2. Authorization & IDOR

### 2.1 Storage Bucket Access (CRITICAL)
| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Access own evidence | Upload proof, retrieve signed URL | ✓ Access granted | ⬜ |
| Access other user's evidence | Modify evidence URL path to another user_id | ✗ 403 Forbidden | ⬜ |
| Direct bucket access | Try unsigned URL to evidence file | ✗ Access denied | ⬜ |
| Expired signed URL | Use signed URL after 7 days | ✗ 403 or 404 | ⬜ |

### 2.2 Group Data Access
| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| View own group | Fetch group where user is member | ✓ Data returned | ⬜ |
| View private group (not member) | Query a private group ID | ✗ Empty result or 403 | ⬜ |
| View other user's transactions | Modify API call with another user_id | ✗ Empty result (RLS) | ⬜ |
| Modify other user's submission | PUT/POST to another user's record | ✗ Blocked by RLS | ⬜ |

### 2.3 Admin Function Access
| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Non-admin access admin function | Call admin-only RPC as regular user | ✗ Permission denied | ⬜ |
| Staff access cross-institution | Staff user access other institution data | ✗ Blocked by RLS scope | ⬜ |

---

## 3. Input Validation & Injection

### 3.1 Deep Link Token Validation
| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Valid UUID token | Open `ibimina://join/{valid-uuid}` | Token processed | ⬜ |
| Invalid token format | Open `ibimina://join/not-a-uuid` | Silently rejected, no error | ⬜ |
| SQL injection in token | Open `ibimina://join/'; DROP TABLE--` | Rejected (not UUID format) | ⬜ |
| XSS in token | Open `ibimina://join/<script>` | Rejected | ⬜ |
| Path traversal | Open `ibimina://join/../../etc` | Rejected | ⬜ |

### 3.2 Contribution Amount Validation
| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Zero amount | Enter 0 as contribution | Validation error | ⬜ |
| Negative amount | Enter -1000 or intercept API with negative | Blocked client-side AND server-side | ⬜ |
| Amount > 4,000 | Enter 5000 RWF | Blocked with clear error | ⬜ |
| Non-numeric amount | Enter "abc" | Validation error | ⬜ |
| Wallet cap exceeded | Contribute when balance would exceed 500k | Blocked with clear error | ⬜ |

### 3.3 File Upload Validation
| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Valid JPEG | Upload .jpg proof | ✓ Accepted | ⬜ |
| Valid PNG | Upload .png proof | ✓ Accepted | ⬜ |
| Invalid GIF | Rename .gif to .jpg, upload | ✗ Rejected (magic bytes check) | ⬜ |
| Executable disguised | Rename .exe to .jpg | ✗ Rejected | ⬜ |
| File > 5MB | Upload 10MB image | ✗ "File size must be less than 5 MB" | ⬜ |
| EXIF GPS data stripped | Upload photo with GPS, download, check | No GPS in downloaded file | ⬜ |

---

## 4. Rate Limiting & Abuse Prevention

### 4.1 Invite Rate Limiting
| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Create 10 invites | Create invites rapidly | ✓ All succeed | ⬜ |
| Create 11th invite | Attempt 11th in same hour | ✗ "10 invites per hour" error | ⬜ |
| Wait for window reset | Wait 1 hour, try again | ✓ Invite created | ⬜ |

### 4.2 Submission Debounce
| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Normal submission | Submit contribution | ✓ Success | ⬜ |
| Double-tap submission | Tap submit twice quickly | 2nd tap blocked, 1 submission recorded | ⬜ |
| Wait 3 seconds | Submit, wait 3s, submit again | ✓ Both succeed | ⬜ |

---

## 5. Privacy & Data Leakage

### 5.1 Logging Privacy
| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Debug logs in release | Inspect release build logs | No debug output | ⬜ |
| Token not in logs | Open deep link, check logs | Token masked or not logged | ⬜ |
| Phone not in logs | Login flow, check logs | Phone masked (+250****456) | ⬜ |
| UUID masked in logs | Any operation with UUIDs, check logs | UUIDs masked (550e****0000) | ⬜ |

### 5.2 UI Privacy
| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Phone masked in settings | View profile/settings | Phone displayed as +250****456 | ⬜ |
| Sensitive data in screenshots | Take screenshot of contribution screen | No full phone/account numbers visible | ⬜ |

---

## 6. Passcode & Biometrics

### 6.1 Passcode Security
| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Passcode creation | Create 6-digit passcode | Stored securely (not plaintext) | ⬜ |
| Passcode verification | Enter correct passcode | ✓ Access granted | ⬜ |
| Wrong passcode | Enter wrong passcode 5 times | Lockout with cooldown | ⬜ |
| Passcode not in logs | Set passcode, check logs | No passcode visible | ⬜ |

### 6.2 Biometric Authentication
| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Biometric setup | Enable biometrics in settings | Uses OS APIs correctly | ⬜ |
| Biometric unlock | Lock app, unlock with biometric | ✓ Access granted | ⬜ |
| Biometric fallback | Cancel biometric, use passcode | ✓ Passcode works | ⬜ |

---

## 7. Network Security

### 7.1 API Security
| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| HTTPS only | Inspect network traffic | All calls use HTTPS | ⬜ |
| No secrets in requests | Inspect API calls | No API keys in query params | ⬜ |
| Auth header present | Inspect authenticated calls | Bearer token in Authorization header | ⬜ |

### 7.2 Certificate Pinning (if implemented)
| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| Valid cert | Normal API call | ✓ Success | ⬜ |
| MITM with proxy | Intercept with mitmproxy | ✗ Connection rejected | ⬜ |

---

## 8. One-Group Constraint

| Test | Steps | Expected Result | Status |
|------|-------|-----------------|--------|
| First group join | User with no group joins group | ✓ Success | ⬜ |
| Second group join | User with group tries joining another | ✗ "One Group Policy" error | ⬜ |
| Leave and rejoin | Leave group, join new group | ✓ Success | ⬜ |

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Developer | | | |
| Security Review | | | |
| QA | | | |

---

## Notes

_Record any findings, edge cases, or recommendations here:_

```
[Date] [Tester] - Description of finding
```
