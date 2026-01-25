# MFA/2FA Implementation Guide

## Overview

Multi-Factor Authentication (MFA) has been implemented using Supabase's TOTP (Time-Based One-Time Password) support. This provides an additional layer of security by requiring users to verify their identity using an authenticator app.

## Components Created

### 1. MFA Utilities (`lib/auth/mfa.ts`)
- `hasMFAEnabled()` - Check if user has MFA enabled
- `getMFAFactors()` - Get all MFA factors for user
- `startMFAEnrollment()` - Start MFA setup process
- `verifyMFAEnrollment()` - Verify and complete MFA setup
- `unenrollMFA()` - Remove MFA factor
- `challengeMFA()` - Challenge MFA for login
- `verifyMFAChallenge()` - Verify MFA code during login
- `generateBackupCodes()` - Generate recovery codes
- `isMFARequired()` - Check if MFA is required for role

### 2. MFA Hook (`hooks/useMFA.ts`)
React hook that provides MFA management functionality:
- `hasMFA` - Whether user has MFA enabled
- `factors` - List of MFA factors
- `checkMFA()` - Check MFA status
- `startEnrollment()` - Start MFA setup
- `verifyEnrollment()` - Verify MFA code during setup
- `unenroll()` - Remove MFA factor

### 3. MFA Setup Component (`components/auth/MFASetup.tsx`)
Component for setting up MFA:
- Shows QR code for scanning
- Displays manual entry code
- Verifies TOTP code
- Generates and displays backup codes

### 4. MFA Verify Component (`components/auth/MFAVerify.tsx`)
Component for verifying MFA during login:
- Prompts for TOTP code
- Verifies code with Supabase
- Handles errors and retries

## Configuration

### Supabase Config (`supabase/config.toml`)

```toml
[auth.mfa]
max_enrolled_factors = 10

[auth.mfa.totp]
enroll_enabled = true
verify_enabled = true
```

## Integration Steps

### 1. Update Login Component

The Login component needs to check for MFA after successful password authentication:

```typescript
// After signInWithPassword succeeds
const { data: { session } } = await supabase.auth.getSession();

// Check if MFA is required
const factors = await mfaUtils.getMFAFactors();
const verifiedFactor = factors.find(f => f.status === 'verified');

if (verifiedFactor) {
  // Show MFA verification component
  setShowMFAVerify(true);
  setMFAFactorId(verifiedFactor.id);
} else {
  // Continue with normal login
}
```

### 2. Update AuthContext

Add MFA checking to the signIn function:

```typescript
const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  
  if (error) {
    return { error };
  }
  
  // Check if MFA is required
  if (data.session) {
    const hasMFA = await mfaUtils.hasMFAEnabled();
    if (hasMFA) {
      // Return MFA challenge required
      return { 
        error: null, 
        requiresMFA: true,
        session: data.session 
      };
    }
  }
  
  return { error: null };
};
```

### 3. Add MFA Setup to Profile

Add MFA management section to the Profile component:

```typescript
import { MFASetup } from '../components/auth/MFASetup';
import { useMFA } from '../hooks/useMFA';

// In Profile component
const { hasMFA, factors, unenroll, checkMFA } = useMFA();

// Show MFA setup or management UI
```

## Usage Flow

### Setting Up MFA

1. User navigates to Profile → Security
2. Clicks "Enable Two-Factor Authentication"
3. `MFASetup` component is displayed
4. User scans QR code with authenticator app
5. User enters verification code
6. MFA is enabled and backup codes are shown

### Logging In with MFA

1. User enters email and password
2. System checks if MFA is enabled
3. If enabled, `MFAVerify` component is shown
4. User enters TOTP code from authenticator app
5. Code is verified with Supabase
6. User is logged in

### Removing MFA

1. User navigates to Profile → Security
2. Clicks "Disable Two-Factor Authentication"
3. Confirms removal
4. MFA factor is unenrolled

## Backup Codes

Backup codes are generated when MFA is set up. These should be:
- Displayed once during setup
- Downloadable as a text file
- Stored securely by the user
- Used only when authenticator device is unavailable

**Note:** Current implementation generates codes but doesn't store them in the database. This should be enhanced to:
- Hash and store codes in database
- Track which codes have been used
- Allow code verification during login

## MFA Enforcement

MFA can be enforced for specific roles:

```typescript
// In AuthContext or login flow
const role = profile?.role;
if (mfaUtils.isMFARequired(role) && !hasMFA) {
  // Force MFA setup before allowing access
  redirectToMFASetup();
}
```

## Security Considerations

1. **QR Code Security**: QR codes contain the secret - ensure they're only displayed in secure contexts
2. **Backup Codes**: Should be hashed before storage, one-time use only
3. **Rate Limiting**: MFA verification attempts should be rate-limited
4. **Session Management**: MFA-verified sessions should be clearly marked
5. **Recovery**: Implement secure recovery flow for lost authenticator devices

## Testing

### Manual Testing

1. **Setup Flow**:
   - Enable MFA for a test user
   - Scan QR code with Google Authenticator
   - Verify code entry works
   - Confirm backup codes are generated

2. **Login Flow**:
   - Sign in with MFA-enabled user
   - Verify MFA prompt appears
   - Enter correct code - should succeed
   - Enter incorrect code - should fail with error
   - Verify session is created after successful MFA

3. **Removal Flow**:
   - Disable MFA for user
   - Verify login no longer requires MFA

### Automated Testing

```typescript
// E2E test example
test('MFA setup and login flow', async ({ page }) => {
  // Setup MFA
  await page.goto('/profile');
  await page.click('text=Enable Two-Factor Authentication');
  // ... verify QR code appears
  // ... enter verification code
  
  // Test login with MFA
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('text=Sign In');
  // ... verify MFA prompt appears
  // ... enter TOTP code
  // ... verify successful login
});
```

## Troubleshooting

### MFA Not Working

1. **Check Supabase Config**: Ensure `enroll_enabled` and `verify_enabled` are `true`
2. **Check User Session**: User must be authenticated to enroll MFA
3. **Check Factor Status**: Verify factor status is 'verified' after enrollment
4. **Check Time Sync**: TOTP requires accurate device time

### QR Code Not Displaying

1. Check `startMFAEnrollment()` response
2. Verify QR code data is valid base64
3. Check browser console for errors

### Verification Failing

1. Check code is 6 digits
2. Verify authenticator app time is synced
3. Check challenge ID is valid
4. Verify factor ID matches enrolled factor

## Next Steps

1. **Complete Login Integration**: Update Login component to show MFA verify
2. **Complete AuthContext**: Add MFA checking to signIn flow
3. **Add to Profile**: Integrate MFA setup/management in Profile component
4. **Backup Code Storage**: Implement proper backup code storage in database
5. **MFA Enforcement**: Add role-based MFA enforcement
6. **Recovery Flow**: Implement recovery for lost authenticator devices
7. **Audit Logging**: Log all MFA events to audit log

## Files

- `lib/auth/mfa.ts` - MFA utilities
- `hooks/useMFA.ts` - MFA React hook
- `components/auth/MFASetup.tsx` - MFA setup component
- `components/auth/MFAVerify.tsx` - MFA verification component
- `supabase/config.toml` - Supabase MFA configuration
