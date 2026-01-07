# Settings Module Inventory

## Date: 2026-01-07

---

## Existing Tables

| Table | Purpose | Reuse? |
|-------|---------|--------|
| `institutions` | Institution identity | ✅ Reuse |
| `profiles` | User profiles with role & institution_id | ✅ Reuse |
| `settings` | Basic institution settings (system_name, currency, momo_shortcode) | ✅ Extend |
| `institution_momo_codes` | MoMo codes per institution | ✅ Reuse |
| `audit_log` | System audit trail | ✅ Reuse |

## New Tables Needed

| Table | Purpose |
|-------|---------|
| `institution_settings` | Parsing config, confidence threshold, dedupe window |
| `sms_sources` | SMS source devices/webhooks |

## Existing Settings-Related Files

| File | Purpose | Action |
|------|---------|--------|
| `components/Settings.tsx` | Monolithic settings page | **Replace** with new modular structure |
| `types.ts` | UserRole enum, SupabaseSettings | **Extend** |
| `contexts/AuthContext.tsx` | Auth with role/institution | **Keep** |

## RBAC Model (from types.ts)

```typescript
type UserRole = 'PLATFORM_ADMIN' | 'INSTITUTION_ADMIN' | 'INSTITUTION_STAFF' | 'INSTITUTION_TREASURER' | 'INSTITUTION_AUDITOR';
```

Mapped to UI roles:
- `PLATFORM_ADMIN` → Super Admin
- `INSTITUTION_ADMIN` → Branch Manager
- `INSTITUTION_STAFF` → Loan Officer
- `INSTITUTION_TREASURER` → Teller
- `INSTITUTION_AUDITOR` → Auditor

## Settings Routes to Implement

| Route | Access | Purpose |
|-------|--------|---------|
| `/settings` | All admins | Settings home with tiles |
| `/settings/institution` | INSTITUTION_ADMIN+ | Institution profile + Primary MoMo code |
| `/settings/parsing` | INSTITUTION_ADMIN+ | Parsing mode, confidence threshold, dedupe |
| `/settings/sms-sources` | INSTITUTION_ADMIN+ | SMS source devices |
| `/settings/staff` | PLATFORM_ADMIN, INSTITUTION_ADMIN | Staff management |
| `/settings/audit-log` | PLATFORM_ADMIN, INSTITUTION_ADMIN, AUDITOR | Read-only audit log |
| `/settings/system` | PLATFORM_ADMIN only | Platform-wide settings |

## Implementation Plan

### 1. Backend (Supabase Migration)
- Create `institution_settings` table
- Create `sms_sources` table
- Add RPC functions with audit logging:
  - `set_primary_momo_code(institution_id, momo_code)`
  - `update_institution_settings(institution_id, settings_json)`
  - `register_sms_source(institution_id, source_data)`
  - `deactivate_sms_source(source_id)`

### 2. Frontend Components
- `SettingsLayout` - Sidebar nav + content area
- `SettingsCard` - Card with title, description, action
- `SettingsRow` - Label + value + edit action
- `DrawerForm` - Right-side drawer for forms
- `SaveBar` - Fixed save button (mobile)
- `HealthBanner` - Warning/success banners

### 3. Settings Pages
- `/settings` - Tile grid linking to subpages
- `/settings/institution` - Cards: Profile, Primary MoMo, Other codes
- `/settings/parsing` - Mode toggle, threshold slider, dedupe input
- `/settings/sms-sources` - Source cards with status
- `/settings/staff` - Staff list with invite drawer
- `/settings/audit-log` - Filterable log table
- `/settings/system` - Platform admin only

### 4. Seed Data
- 2 institutions with settings
- MoMo codes for each
- SMS sources
- Sample audit log entries


