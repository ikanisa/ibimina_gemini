# Description

Please include a summary of the change and which issue is fixed.

## Type of change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Refactor (code improvement)

# How to Test

Please describe the tests that you ran to verify your changes. Provide instructions so we can reproduce.
- [ ] Unit Tests
- [ ] Widget Tests
- [ ] Manual Verification (describe below)

**Manual Verification Steps:**
1. ...
2. ...

# Checklist:

- [ ] My code follows the style guidelines of this project
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings (run `flutter analyze`)
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes

## Safety & Compliance (Crucial)
- [ ] **No Withdrawals**: This PR does NOT add any withdrawal or cash-out functionality.
- [ ] **No In-App Payments**: This PR does NOT add any in-app payment APIs (only MoMo USSD is allowed).
- [ ] **Caps Enforced**: This PR respects the 4,000 RWF contribution limit and 500,000 RWF wallet cap.
- [ ] **Membership Gating**: This PR respects group membership rules (user must be in a group to contribute).
- [ ] **Localization**: All new user-facing strings are localizable (no hardcoded English).
- [ ] **PII Safety**: No personal data (phone numbers, full names) is logged to the console.
- [ ] **Dark Mode**: Validated that UI works in Dark Mode.
