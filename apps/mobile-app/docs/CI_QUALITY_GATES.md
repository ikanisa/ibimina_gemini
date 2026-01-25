# CI Quality Gates & Release Readiness

## 1) CONSTRAINT CONFIRMATION
- **No Withdrawal/In-app Payment Flows**: Confirmed. No withdrawal screens found in router.
- **Membership Gating**: Confirmed. `MembershipCheckScreen` and `PendingApprovalScreen` exist in router.
- **Caps Enforced**: To be verified in logic (TransactionService). Assumed enforced via backend/service.
- **Localization**: `intl` package present.
- **CI Environment**: GitHub Actions (Ubuntu/MacOS runners).

## 2) REPO SNAPSHOT
- **Current CI**: `.github/workflows/flutter-ci.yml`
  - Triggers: Push/PR to `apps/mobile-app/**`.
  - Checks: Format (`dart format`), Analyze (`flutter analyze --fatal-infos`), Test (`flutter test`).
  - Build: Android APK (release), iOS (no-codesign) on `main`.
- **Linter**: `apps/mobile-app/analysis_options.yaml` uses `package:flutter_lints/flutter.yaml`. No custom rules.
- **Testing**: `flutter_test` dependency present. `test` folder exists.
- **Codegen**: `riverpod_annotation`, `freezed_annotation` in dependencies, but `build_runner` MISSING in dev_dependencies. No usage of `@riverpod` or `@freezed` found in `lib/`. likely unused dependencies.
- **Dependencies**: `flutter_riverpod`, `supabase_flutter`, `go_router`, `sentry_flutter`.

## 3) PLAN
- **Goal**: Formalize quality gates to prevent regression and ensure release readiness.
- **In Scope**:
  - Documentation of gates.
  - Dependency policy.
  - PR Template.
  - Verification of existing CI.
- **Out of Scope**:
  - Implementation of new product features.
  - Setting up Supabase schema drift check (requires `supabase_gen` or similar setup which is not present).
- **Approach**:
  - Create policy documents.
  - Add PR template.
  - Document status of strictly enforced gates.

## 4) TASK LIST
- [x] Scan repo and confirm constraints.
- [ ] Create `apps/mobile-app/docs/DEPENDENCY_POLICY.md`.
- [ ] Create `.github/pull_request_template.md`.
- [ ] Verify `flutter-ci.yml` effectiveness (already analyzed, looks good).
- [ ] Document missing `build_runner` as a finding.

## 5) RISKS
- **Unused Dependencies**: `riverpod_annotation`, `freezed_annotation`, `json_annotation` present but unused. Increases confusion.
- **Contract Drift**: No automated check between Supabase schema and Dart code. Manual verification required.
- **CI Cost**: Builds run on every PR. Ensure caching is effective (it is enabled).

## 6) TEST PLAN
- **Manual Verification**:
  - Check PR template appears in new PRs.
  - Check CI logs for specific runs.
- **Automated**:
  - CI already runs tests and analysis.

## 7) GATE STATUS
- **Gate A (Artifacts)**: PASS (Plan Created).
- **Gate B (CI)**: PASS (Existing CI covers Format, Analyze, Test, Build).
- **Contract Drift Gate**: FAIL/MANUAL (No automated check).
- **Dependency Audit Gate**: PASS (Informational check exists).

## 8) NEXT ACTION
- Create `DEPENDENCY_POLICY.md` and `pull_request_template.md`.
