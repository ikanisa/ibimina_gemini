---
description: 
---

---
description: Establish a Revolut-like Flutter design system (tokens, theme, typography, spacing), dark mode, and a reusable components library with strict UX guardrails.
command: /flutter-ui-system
---

# /flutter-ui-system (GLOBAL)

## Purpose
Create a clean, minimalist, modern UI system that:
- looks premium (calm fintech vibe),
- scales across many screens without inconsistency,
- supports Dark Mode from day 1,
- prevents “random widget styling” entropy.

This workflow MAY edit code, but only after artifacts are produced and Gate A passes.

---

## 0) Inputs required (read from workspace rules + brief)
Confirm these are true (or flag mismatch):
- Minimalist, clean, modern.
- No “AI” references in user UI.
- Rwanda-first, localization-ready.
- Fintech-grade clarity: one primary action per screen.

Output:
- UI goals:
- Brand constraints:
- Accessibility targets:

---

## 1) Repo scan (read-only)
Identify current UI foundations:
- Material 2 vs Material 3 usage
- Theme location (ThemeData)
- Typography approach
- Colors defined where (constants? hardcoded?)
- Existing shared widgets folder (or absence)

Output:
- Current theme strategy:
- Current component strategy:
- UI debt hotspots:

---

## 2) Deliver required artifacts (MANDATORY)
### 2.1 PLAN
- Goal:
- In scope:
- Out of scope:
- Approach:
- Files/folders to create:
- Rollback strategy:

### 2.2 TASK LIST (Done Criteria)
Break into small tasks with test evidence.

### 2.3 RISKS
- UX regression risks:
- Theming conflicts:
- Package conflicts:

### 2.4 TEST PLAN
- Automated: flutter test
- Manual smoke: launch app, verify light/dark, text scale, key components

---

## 3) Gates
### Gate A — Artifacts Gate
Must PASS before any edits.

### Gate B — Consistency Gate
Must PASS before finishing:
- No new hardcoded colors in screens
- No ad-hoc text styles
- Components used consistently

---

## 4) Implementation blueprint (when gates pass)
### 4.1 Create UI foundation folders
Create:
- lib/ui/theme/
- lib/ui/tokens/
- lib/ui/components/
- lib/ui/icons/ (optional)
- lib/ui/utils/

### 4.2 Token system (single source of truth)
Define tokens (as constants or classes) for:
- Color tokens: background/surface/text/primary/border/status
- Spacing scale: 4, 8, 12, 16, 24, 32
- Radius scale: 12, 16, 20
- Elevation scale: 0, 1, 2 (keep subtle)
- Typography scale: display/title/body/caption
- Motion durations: 150ms, 200ms, 250ms

Rules:
- Screens MUST NOT define colors directly.
- Screens MUST use tokens + TextTheme.

### 4.3 Theme (Light + Dark)
Implement a single AppTheme builder that returns:
- ThemeData light
- ThemeData dark
Using:
- ColorScheme
- TextTheme
- InputDecorationTheme
- BottomNavigationBarTheme
- AppBarTheme
- CardTheme
- DividerTheme
- SnackBarTheme

Rules:
- Prefer neutral surfaces and high legibility.
- Dark mode must be true dark with readable contrast.
- Keep “premium” feel: restrained accent color, not rainbow UI.

### 4.4 Reusable components (minimum set)
Create components with strict props and sane defaults:
- AppScaffold (consistent padding + safe area)
- SectionHeader (title + optional action)
- PrimaryButton / SecondaryButton / DestructiveButton
- InfoCard (generic card with title, subtitle, trailing)
- BalanceHeader (big number + label)
- ProgressCard (goal progress)
- StatusPill (pending/confirmed/rejected)
- ListRow (icon/title/subtitle/trailing)
- EmptyState (icon + title + message + CTA)
- BottomSheetFrame (standard sheet)
- AppTextField (standard input)
- AppSearchField (optional)

Component rules:
- Each component must support dark mode.
- Each component must avoid layout jank and respect text scale.
- Keep components small and composable.

### 4.5 Navigation + spacing conventions
Define page layout conventions:
- Default screen padding: 16
- Card spacing: 12–16
- Section spacing: 24
- Use one primary CTA per screen

### 4.6 Accessibility checklist
- Text scale up to 1.3–1.5 without clipping
- Tap targets >= 44px
- Contrast-friendly tokens
- Use semantics labels for key controls

---

## 5) Evidence requirements (must provide)
After implementation, output:
- Change Summary (what’s added/changed)
- File Map (new folders + key files)
- How to Use (example snippet per component)
- Test Evidence:
  - flutter analyze
  - flutter test
  - manual smoke checks (light/dark, text scale)

---

## 6) Anti-patterns to block (hard rules)
- No hardcoded hex colors in feature screens
- No inline TextStyle() in feature screens (use TextTheme)
- No random padding constants (use spacing tokens)
- No UI redesign while implementing business logic in same PR
- No new UI packages unless justified

---

## Output format (exact)
Return results using this structure:

1) UI GOALS
2) REPO SNAPSHOT
3) PLAN
4) TASK LIST
5) RISKS
6) TEST PLAN
7) GATE STATUS (A/B: PASS/FAIL)
8) NEXT ACTION (single sentence)
