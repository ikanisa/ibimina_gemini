# Session Timeout Setup Guide

## Overview

Session timeout has been implemented with two mechanisms:

1. **Idle Timeout**: 30 minutes of inactivity
   - User is logged out after 30 minutes of no activity
   - Warning shown 2 minutes before timeout
   - Can be extended by clicking "Stay Logged In"

2. **Absolute Timeout**: 8 hours from login
   - User is logged out after 8 hours regardless of activity
   - Warning shown 2 minutes before timeout
   - Cannot be extended (must log in again)

## Configuration

### Supabase Configuration

The absolute timeout is configured in `supabase/config.toml`:

```toml
[auth.sessions]
# Force log out after 8 hours (absolute timeout)
timebox = "8h"
```

### Frontend Configuration

The idle timeout is configured in `hooks/useSessionTimeout.tsx`:

```typescript
const DEFAULT_IDLE_TIMEOUT_MINUTES = 30; // 30 minutes
const DEFAULT_ABSOLUTE_TIMEOUT_HOURS = 8; // 8 hours
const WARNING_BEFORE_MINUTES = 2; // Show warning 2 minutes before
```

### Custom Timeouts

You can customize timeouts per component:

```typescript
const sessionTimeout = useSessionTimeout({
  idleTimeoutMinutes: 30,      // Idle timeout
  absoluteTimeoutHours: 8,      // Absolute timeout
  warningMinutes: 2,            // Warning before timeout
  enabled: !!user,               // Only when logged in
  onTimeout: () => {
    // Custom handler
  },
  onWarning: (remainingSeconds) => {
    // Custom warning handler
  },
});
```

## Activity Detection

The system tracks user activity for idle timeout:

- Mouse movements
- Mouse clicks
- Keyboard input
- Scroll events
- Touch events

Activity is throttled to every 5 seconds to prevent excessive resets.

## User Experience

### Idle Timeout Warning

When user is inactive for 28 minutes:
- Modal appears: "Your session will expire in 2:00 due to inactivity"
- Options:
  - **Stay Logged In** - Extends session, resets idle timer
  - **Log Out** - Immediately logs out

### Absolute Timeout Warning

When session reaches 7 hours 58 minutes:
- Modal appears: "Your session will expire in 2:00 due to maximum session duration (8 hours)"
- Options:
  - **Log Out** - Immediately logs out
  - Note: Cannot extend absolute timeout

### Timeout Behavior

When timeout occurs:
1. Session is logged to audit log
2. User is signed out
3. Redirected to login page with reason:
   - `?reason=idle_timeout` - For idle timeout
   - `?reason=session_expired` - For absolute timeout

## Audit Logging

All session timeouts are logged to the audit log:

```json
{
  "action": "auth.session_expired",
  "metadata": {
    "timeoutType": "idle" | "absolute",
    "lastActivity": "2026-01-15T10:00:00Z",
    "sessionDuration": 1800000,
    "idleTimeoutMinutes": 30,
    "absoluteTimeoutHours": 8
  }
}
```

## Testing

### Test Idle Timeout

1. Log in to the application
2. Wait 28 minutes without activity
3. Warning modal should appear
4. Wait 2 more minutes (or click "Stay Logged In")
5. Should be logged out and redirected

### Test Absolute Timeout

1. Log in to the application
2. Wait 7 hours 58 minutes (or adjust timeout for testing)
3. Warning modal should appear
4. Wait 2 more minutes
5. Should be logged out regardless of activity

### Quick Test (Development)

For faster testing, temporarily reduce timeouts:

```typescript
const sessionTimeout = useSessionTimeout({
  idleTimeoutMinutes: 1,        // 1 minute for testing
  absoluteTimeoutHours: 0.1,    // 6 minutes for testing
  warningMinutes: 0.5,          // 30 seconds warning
});
```

## Troubleshooting

### Session timeout not working

1. Check if `useSessionTimeout` is enabled: `enabled: !!user`
2. Verify user is logged in
3. Check browser console for errors
4. Verify Supabase session is valid

### Warning not showing

1. Check `warningMinutes` is less than timeout
2. Verify activity detection is working (check console logs)
3. Ensure modal is rendered in App component

### Absolute timeout not working

1. Verify `supabase/config.toml` has `timebox = "8h"`
2. Check Supabase session expiry matches
3. Restart Supabase local instance if using local dev

### Activity not resetting idle timeout

1. Check activity events are being captured
2. Verify throttling isn't blocking legitimate activity
3. Check browser console for errors

## Files

- `hooks/useSessionTimeout.tsx` - Session timeout hook
- `App.tsx` - Integration point
- `supabase/config.toml` - Supabase session configuration
- `lib/supabase.ts` - Supabase client configuration

## Security Notes

1. **Absolute timeout**: Prevents indefinite sessions even with activity
2. **Idle timeout**: Prevents abandoned sessions from being hijacked
3. **Audit logging**: All timeouts are logged for security monitoring
4. **Token refresh**: Supabase automatically refreshes tokens, but absolute timeout still applies

## Best Practices

1. **Don't disable timeouts** in production
2. **Warn users** before timeout (already implemented)
3. **Save work automatically** to prevent data loss
4. **Monitor audit logs** for suspicious patterns
5. **Test timeouts** regularly to ensure they work
