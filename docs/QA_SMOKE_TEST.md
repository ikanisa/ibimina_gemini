# QA Smoke Test Script (Ibimina)

**Goal:** Verify core app functionality in < 5 minutes.
**Frequency:** On every PR merge and before every release candidate.

## 1. Install & Launch
- [ ] Install fresh APK/IPA (or run from IDE).
- [ ] App launches to "Role Selection" or "Login" screen instantly (< 2s).
- [ ] No immediate crash or white screen.

## 2. Authentication (MoMo Number)
- [ ] Enter valid Rwanda phone number (e.g., 078XXXXXXX).
- [ ] Enter Passcode (4 digits).
- [ ] Verify successful login to **Home Screen**.
- [ ] Verify "Invalid Passcode" error appears on wrong input.

## 3. Home Screen & State
- [ ] **Greeting:** Shows correct user name (or skeleton loader then name).
- [ ] **Wallet:** Shows current balance (hidden/visible toggle works).
- [ ] **Group Status:** Shows "Your Group: [Name]" or "Join a Group" card.

## 4. Group Operations
- [ ] **Directory:** Click "Find Group" -> List loads.
- [ ] **Join:** Select a public group -> "Request to Join" -> Success toast.
- [ ] **Create:** (If staff/admin) Create Group -> Form validates -> Success.

## 5. Contribution Flow (Key Constraint)
- [ ] Click "Contribute".
- [ ] **Constraint Check:** Cannot contribute > 4,000 RWF (input error).
- [ ] **Instruction:** Shows "Dial *182*..." USSD instructions.
- [ ] **Record:** Enter TX ID -> Submit.
- [ ] **Feedback:** Toast confirms "Contribution Recorded (Pending)".

## 6. Settings & Support
- [ ] Switch to **Dark Mode** -> App updates immediately.
- [ ] Check **Language** (English/Kinyarwanda if implies).
- [ ] **Log Out** -> Returns to Login screen.

## 7. Safety Checks
- [ ] No "Withdraw" button exists anywhere.
- [ ] No "Add Money" API button exists (only USSD text).
