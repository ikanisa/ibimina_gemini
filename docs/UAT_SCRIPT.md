# User Acceptance Testing (UAT) Script

**Tester:** Cooperatives / Non-technical Staff
**Device:** Android Phone (Entry-level, e.g., Tecno/Infinix preferred)

## Setup
1. Uninstall any old version of Ibimina.
2. Install the "Release Candidate" APK provided.

## Scenario A: New User Onboarding
**Goal:** Can a regular person get in without help?
- [ ] Open App.
- [ ] Select "I am a new member" (if applicable) or Login with provided credentials.
- [ ] **Check:** Is the text clear? Is the font size readable?
- [ ] Actions:
  - Join a group called "UAT Test Group".
  - Verify you see the group dashboard.

## Scenario B: The "Friday Meeting" (Contribution)
**Goal:** Simulate a saving session.
- [ ] Open the app.
- [ ] Click the "Contribute" action.
- [ ] **Stop:** Do NOT try to pay in the app.
- [ ] **Action:** Use your OTHER phone or minimize app to dial `*182*...` (Fake USSD).
- [ ] **Action:** In app, enter the Transaction ID `888888` (Test ID).
- [ ] **Check:** Did it say "Pending Approval"?
- [ ] **Check:** Did your wallet balance stay the same (until approved)?

## Scenario C: Bad Signal Test
**Goal:** Does it break in the village?
- [ ] Turn off WiFi/Data.
- [ ] Try to open the app.
- [ ] **Check:** Do you see a "No Internet" message or old data? (Should not be white screen).
- [ ] Turn Data back on.
- [ ] Pull to refresh.
- [ ] **Check:** Does data update?

## Scenario D: Privacy & Safety
- [ ] Open Settings.
- [ ] Look for "Delete Account" or "Privacy Policy".
- [ ] **Check:** Verify no one else's phone number is visible in full (should be masked `078...123`).
