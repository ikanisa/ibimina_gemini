---
trigger: always_on
---

---
title: "Ibimina Flutter App — Starter Rules (Workspace)"
scope: workspace
---

# 0) Mission (never forget why we exist)
Build a Rwanda-first Flutter mobile app for **group-only micro-savings**:
- No withdrawals.
- No in-app payment APIs.
- Contributions happen ONLY via MoMo USSD outside the app; the app captures proof + ledger.
- A user must belong to exactly one group to contribute.
- Max per contribution transaction: 4,000 RWF.
- Max wallet balance: 500,000 RWF.
- Groups: Private (instant) or Public (requires staff approval).
- Rwanda-only now, but architecture must support multi-country expansion later via feature flags & localization.
- Never reference “AI” in the end-user UI/UX.

# 1) Non-negotiable safety guardrails (terminal + files)
Antigravity can execute terminal actions; we must prevent catastrophic mistakes.
- NEVER run destructive commands (rm -rf, del /q, format, diskpart, mkfs, wipe, etc).
- NEVER run commands that touch outside the workspace path.
- For any command that deletes/moves files: STOP and ask for explicit confirmation by producing:
  (a) exact command, (b) list of files affected, (c) reason, (d) safer alternative.
- Prefer safe equivalents: use targeted deletes, use git to revert, and show a diff first.

Rationale: agentic IDEs can misinterpret “cleanup” tasks; hard guardrails prevent drive-loss incidents.

# 2) Always produce artifacts before coding
For every non-trivial change, produce these artifacts in order:
1) PLAN (short) — what will change, why, and what won’t change.
2) TASK LIST — ordered, checkable, with “done criteria” per task.
3) RISK CHECK — how this could break auth, ledger rules, or UX.
4) TEST PLAN — what to run and what to verify in-app.

No code edits until these exist (except tiny typo fixes).

# 3) Branch + commit discipline (keep the repo sane)
- Work on a feature branch per workflow: feat/<area>-<shortname> or fix/<area>-<shortname>.
- Keep commits small and meaningful.
- For every PR-sized change, provide a “Change Summary” + “How to Test” notes.

# 4) UX principles (Revolut-like calm, but simpler)
- Minimalist, clean, modern; one primary action per screen.
- No clutter; avoid feature creep.
- Clear microcopy explaining constraints (especially “no withdrawal” and “USSD-only”).
- Dark mode from day 1 (theme tokens, not per-widget hacks).

# 5) Product constraints (must be enforced server-side AND in UI)
- Block contributions if:
  - user has no group membership,
  - amount > 4,000 RWF,
  - wallet would exceed 500,000 RWF.
- Do not implement any hidden payment/transfer endpoints.
- Only show “Contribute via MoMo USSD” flows; never show “Pay”, “Send”, “Withdraw”.
- Only one group per user; joining a group requires explicit warning + confirmation.

# 6) Data model integrity rules
- momo_number is a primary identity attribute (unique where required).
- Ledger must be auditable:
  - store raw submission (tx_id, amount, timestamp, evidence),
  - store reconciliation status (pending/confirmed/rejected),
  - confirmed ledger entries are append-only (no silent edits).
- Leaderboards must be derived from confirmed ledger only.

# 7) Security + privacy rules
- Do not log secrets, tokens, or personal data to console.
- Never print full phone numbers in logs; mask them.
- Ensure any screenshot uploads/evidence are access-controlled (members + staff only).
- No copying .env contents into chat/artifacts.

# 8) Internationalization + expansion readiness
- All user-facing strings must be localizable.
- Store country + currency as config, not hardcoded constants.
- Rwanda is default; expansion is done via feature flags, not forks.

# 9) Integrations constraints (important)
- MoMo: USSD only. No MoMo API integration in-app.
- WhatsApp: used for communications/handoff; no Twilio references or dependencies.
- SMS OTP is allowed for login only (not for payments).

# 10) Definition of Done (DoD) — every feature must pass
A feature is “done” only when:
- UI matches the design system & does not add clutter.
- Rules are enforced in UI + backend.
- Tests executed (unit/widget + smoke test).
- No dead code, no unused packages, no TODO landmines.
- Updated docs: README or in-repo docs for new flows.
