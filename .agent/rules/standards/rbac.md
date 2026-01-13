# Staff/Admin RBAC Standard (Global)

## Principle
- Never rely on UI-only permissions.
- Enforcement must exist in: UI route guards + API/Server checks + DB/RLS (when used).

## Required artifacts per RBAC change
- RBAC matrix: role × capability
- Attack simulation: Staff attempts Admin actions via direct URL + direct API
- Regression tests: route guard + API auth + critical RLS checks

## Typical structure
- roles: staff, admin (plus optional superadmin later)
- scope: institution_id / tenant_id boundaries (when applicable)
