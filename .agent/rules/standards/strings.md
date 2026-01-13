# UI Strings & Microcopy Standard (Global)

## Voice
- Clear, calm, direct. No fluff.
- Use action verbs. Prefer “Save changes” over “Submit”.
- Avoid blame in errors. Provide next step.

## Labels
- Use consistent nouns across the app (Institution, Group, Member, Transaction, Device, Message, Agent, Task).
- Staff/Admin surfaces must label role clearly (e.g., “Admin settings”, “Staff workspace”).

## Buttons
- Primary action: verb + object (“Create member”, “Approve payout”, “Send broadcast”).
- Destructive action must be explicit (“Delete institution”, “Suspend device”).
- Confirmation dialogs must repeat the object name.

## Errors
Format:
- Title: what failed
- Body: why (if known) + what to do next
- CTA: Retry / Contact admin / View logs
Never show raw stack traces to users; log them and show a short reference ID.

## Empty states
- Explain why it’s empty
- Provide the next best action (CTA)
Example: “No groups yet. Create the first group to start tracking contributions.”

## Loading states
- Skeletons for content areas
- “Working…” only for brief operations; for longer ops show progress or steps

## Notifications
- Short, specific, and time-scoped
- Include entity name and outcome
Example: “Payment allocated to Group A • RWF 5,000”

## i18n readiness
- No strings hardcoded inside deep components when avoidable
- Prefer a single strings map per app/package
- Keep placeholders explicit (e.g., {name}, {amount})
