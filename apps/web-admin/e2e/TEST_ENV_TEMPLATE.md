# E2E Test Environment Configuration

## Required Environment Variables

Copy these to a `.env` file in the project root (or set them in CI):

```bash
# Base URL for E2E tests
E2E_BASE_URL=http://localhost:5173

# Supabase configuration (for API-level tests)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Test user credentials
# These users should be seeded in your test database

# Platform Admin (can access all institutions)
E2E_PLATFORM_ADMIN_EMAIL=platform@test.com
E2E_PLATFORM_ADMIN_PASSWORD=test123456

# Institution A users
E2E_INSTITUTION_A_ID=uuid-of-institution-a
E2E_ADMIN_A_EMAIL=admin-a@test.com
E2E_ADMIN_A_PASSWORD=test123456
E2E_STAFF_A_EMAIL=staff-a@test.com
E2E_STAFF_A_PASSWORD=test123456
E2E_AUDITOR_A_EMAIL=auditor-a@test.com
E2E_AUDITOR_A_PASSWORD=test123456

# Institution B users
E2E_INSTITUTION_B_ID=uuid-of-institution-b
E2E_STAFF_B_EMAIL=staff-b@test.com
E2E_STAFF_B_PASSWORD=test123456

# Legacy aliases (for backward compatibility)
E2E_ADMIN_EMAIL=admin-a@test.com
E2E_ADMIN_PASSWORD=test123456
E2E_STAFF_EMAIL=staff-a@test.com
E2E_STAFF_PASSWORD=test123456
E2E_AUDITOR_EMAIL=auditor-a@test.com
E2E_AUDITOR_PASSWORD=test123456
E2E_INST_ADMIN_EMAIL=admin-a@test.com
E2E_INST_ADMIN_PASSWORD=test123456
```

## Setting Up Test Users

Run this SQL in your staging/test database to create the test users:

```sql
-- Create test institutions
INSERT INTO institutions (id, name, short_name, type, status)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Test Institution A', 'TIA', 'sacco', 'active'),
  ('22222222-2222-2222-2222-222222222222', 'Test Institution B', 'TIB', 'sacco', 'active')
ON CONFLICT (id) DO NOTHING;

-- Note: User creation requires Supabase Auth
-- Use the Supabase dashboard or auth API to create users
-- Then update their profiles:

-- After creating users via auth, update profiles:
UPDATE profiles SET 
  role = 'PLATFORM_ADMIN',
  institution_id = NULL
WHERE email = 'platform@test.com';

UPDATE profiles SET 
  role = 'INSTITUTION_ADMIN',
  institution_id = '11111111-1111-1111-1111-111111111111'
WHERE email = 'admin-a@test.com';

UPDATE profiles SET 
  role = 'INSTITUTION_STAFF',
  institution_id = '11111111-1111-1111-1111-111111111111'
WHERE email = 'staff-a@test.com';

UPDATE profiles SET 
  role = 'INSTITUTION_AUDITOR',
  institution_id = '11111111-1111-1111-1111-111111111111'
WHERE email = 'auditor-a@test.com';

UPDATE profiles SET 
  role = 'INSTITUTION_STAFF',
  institution_id = '22222222-2222-2222-2222-222222222222'
WHERE email = 'staff-b@test.com';
```

## Running Tests

```bash
# Run all E2E tests
npm run e2e

# Run specific test suites
npm run e2e:critical    # Critical flows
npm run e2e:security    # Security tests
npm run e2e:rls         # RLS policy tests
npm run e2e:smoke       # Smoke tests

# Run with UI
npm run e2e:ui

# Run headed (visible browser)
npm run e2e:headed
```

