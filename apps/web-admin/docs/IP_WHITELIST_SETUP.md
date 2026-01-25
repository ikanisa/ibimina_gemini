# IP Whitelist Setup Guide

## Overview

IP whitelisting has been enhanced to support:
- **Per-institution IP whitelists** stored in the database
- **Proper CIDR notation** support (IPv4 and IPv6)
- **Environment variable fallback** for global whitelisting
- **Automatic IP extraction** from various proxy headers

## Configuration

### Option 1: Per-Institution IP Whitelist (Recommended)

Institutions can configure their own IP whitelists via the database:

```sql
-- Add an exact IP address
INSERT INTO institution_ip_whitelist (
  institution_id,
  ip_address,
  cidr_prefix,
  description,
  created_by
) VALUES (
  'your-institution-id',
  '192.168.1.100',
  NULL,  -- NULL for exact IP match
  'Main office IP',
  auth.uid()
);

-- Add a CIDR range
INSERT INTO institution_ip_whitelist (
  institution_id,
  ip_address,
  cidr_prefix,
  description,
  created_by
) VALUES (
  'your-institution-id',
  '192.168.1.0',
  24,  -- /24 CIDR prefix
  'Office network range',
  auth.uid()
);

-- Add IPv6 address
INSERT INTO institution_ip_whitelist (
  institution_id,
  ip_address,
  cidr_prefix,
  description,
  created_by
) VALUES (
  'your-institution-id',
  '2001:db8::1',
  NULL,
  'IPv6 gateway',
  auth.uid()
);
```

### Option 2: Environment Variable (Global)

Set `SMS_WEBHOOK_ALLOWED_IPS` environment variable in Supabase Edge Functions:

```bash
SMS_WEBHOOK_ALLOWED_IPS=192.168.1.100,192.168.1.0/24,2001:db8::/64
```

Supports:
- Exact IPs: `192.168.1.100`
- CIDR ranges: `192.168.1.0/24`
- IPv6: `2001:db8::1`
- IPv6 CIDR: `2001:db8::/64`
- Comma-separated list

## Behavior

1. **Database whitelist checked first** (if institution ID is available)
2. **Environment variable checked** if no database whitelist or no institution ID
3. **Allow all** if no whitelist configured (backward compatible)

## IP Extraction

The system automatically extracts client IP from:
1. `x-forwarded-for` header (first IP in chain)
2. `x-real-ip` header
3. `cf-connecting-ip` header (Cloudflare)

## CIDR Notation

### IPv4 Examples:
- `192.168.1.0/24` - Allows 192.168.1.0 to 192.168.1.255
- `10.0.0.0/8` - Allows 10.0.0.0 to 10.255.255.255
- `172.16.0.0/12` - Allows 172.16.0.0 to 172.31.255.255

### IPv6 Examples:
- `2001:db8::/64` - Allows 2001:db8:: to 2001:db8::ffff:ffff:ffff:ffff
- `2001:db8:1::/48` - Allows 2001:db8:1:: to 2001:db8:1:ffff:ffff:ffff:ffff:ffff

## Management

### View IP Whitelist

```sql
SELECT 
  i.name as institution_name,
  w.ip_address,
  w.cidr_prefix,
  w.description,
  w.is_active,
  w.created_at
FROM institution_ip_whitelist w
JOIN institutions i ON w.institution_id = i.id
WHERE w.is_active = true
ORDER BY i.name, w.created_at;
```

### Deactivate IP Entry

```sql
UPDATE institution_ip_whitelist
SET is_active = false, updated_by = auth.uid()
WHERE id = 'entry-id';
```

### Delete IP Entry

```sql
DELETE FROM institution_ip_whitelist
WHERE id = 'entry-id';
```

## Testing

Test IP whitelisting:

```bash
# Test with allowed IP
curl -X POST https://your-project.supabase.co/functions/v1/sms-ingest \
  -H "x-api-key: your-key" \
  -H "x-forwarded-for: 192.168.1.100" \
  -H "Content-Type: application/json" \
  -d '{"device_identifier":"test","sender_phone":"+250...","sms_text":"test","received_at":"2026-01-15T10:00:00Z"}'

# Test with blocked IP (should return 403)
curl -X POST https://your-project.supabase.co/functions/v1/sms-ingest \
  -H "x-api-key: your-key" \
  -H "x-forwarded-for: 10.0.0.1" \
  -H "Content-Type: application/json" \
  -d '{"device_identifier":"test","sender_phone":"+250...","sms_text":"test","received_at":"2026-01-15T10:00:00Z"}'
```

## Troubleshooting

### IP not being detected

1. Check request headers: `x-forwarded-for`, `x-real-ip`, `cf-connecting-ip`
2. Verify proxy configuration is forwarding correct IP
3. Check Edge Function logs for extracted IP

### IP whitelist not working

1. Verify migration has been run
2. Check `institution_ip_whitelist` table has entries
3. Verify `is_active = true` for entries
4. Check institution ID is correctly identified
5. Review Edge Function logs for whitelist check results

### CIDR not matching

1. Verify CIDR notation is correct (e.g., `192.168.1.0/24`)
2. Check IP address format matches CIDR network
3. For IPv6, ensure proper normalization

## Files

- `supabase/functions/_shared/ip-whitelist.ts` - IP whitelisting utility
- `supabase/migrations/20260115000004_ip_whitelist_table.sql` - Database schema
- `supabase/functions/sms-ingest/index.ts` - Example usage

## Security Notes

1. **Default behavior**: If no whitelist is configured, all IPs are allowed (backward compatible)
2. **Institution isolation**: Each institution's whitelist only affects their own requests
3. **Audit logging**: All whitelist changes are logged in `audit_log` table
4. **RLS policies**: Only institution admins can manage their own whitelists
