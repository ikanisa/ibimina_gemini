# PII Encryption Setup Guide

## Overview

PII (Personally Identifiable Information) encryption has been implemented to protect sensitive data at rest. Phone numbers and names are encrypted using AES-256 encryption before being stored in the database.

## Architecture

### Encryption Method
- **Algorithm**: AES-256 (via pgcrypto)
- **Mode**: Symmetric encryption (pgp_sym_encrypt)
- **Storage**: Base64-encoded encrypted strings
- **Key Management**: Stored in Supabase secrets or database settings

### Searchability
- **Phone Numbers**: Use SHA256 hash for exact match lookups
- **Names**: Not searchable (must decrypt to search)
- **Hash Index**: Fast lookups without decryption

### Authorization
- **Decryption**: Only authorized staff/admin can decrypt
- **RLS Protection**: Decryption functions are RLS-protected
- **Audit Logging**: All decryption access should be logged

## Setup Steps

### 1. Generate Encryption Key

Generate a 32-byte (256-bit) encryption key:

```bash
# Using OpenSSL
openssl rand -base64 32

# Or using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Important**: Store this key securely. If lost, encrypted data cannot be recovered.

### 2. Set Encryption Key in Supabase

#### For Supabase Hosted (Production):

1. Go to Supabase Dashboard → Settings → Secrets
2. Add new secret:
   - **Name**: `ENCRYPTION_KEY`
   - **Value**: Your 32-byte key (base64 encoded)

#### For Local Development:

```sql
ALTER DATABASE postgres SET app.encryption_key = 'your-32-byte-key-here';
```

### 3. Run Migration

```bash
# Run the encryption migration
supabase migration up

# This creates:
# - Encryption/decryption functions
# - Encrypted columns
# - Triggers for auto-encryption
# - RPC functions for decryption
```

### 4. Migrate Existing Data

**WARNING**: This is a manual step. Review the migration script before running.

```sql
-- 1. Verify encryption key is set
SELECT public.get_encryption_key();

-- 2. Test encryption/decryption
SELECT 
  public.encrypt_pii('test') as encrypted,
  public.decrypt_pii(public.encrypt_pii('test')) as decrypted;

-- 3. Migrate members
UPDATE public.members
SET 
  phone_encrypted = public.encrypt_pii(phone),
  full_name_encrypted = public.encrypt_pii(full_name),
  phone_hash = public.compute_phone_hash(phone)
WHERE phone_encrypted IS NULL 
  AND (phone IS NOT NULL OR full_name IS NOT NULL);

-- 4. Migrate transactions
UPDATE public.transactions
SET 
  payer_phone_encrypted = public.encrypt_pii(payer_phone),
  payer_name_encrypted = public.encrypt_pii(payer_name),
  payer_phone_hash = public.compute_phone_hash(payer_phone)
WHERE payer_phone_encrypted IS NULL
  AND (payer_phone IS NOT NULL OR payer_name IS NOT NULL);

-- 5. Verify migration
SELECT 
  COUNT(*) as total,
  COUNT(phone_encrypted) as encrypted
FROM public.members;
```

### 5. Update Application Code

Update queries to use encrypted columns:

```typescript
// Old (plaintext)
const { data } = await supabase
  .from('members')
  .select('phone, full_name')
  .eq('id', memberId);

// New (encrypted - use RPC for decryption)
const { data } = await supabase.rpc('get_member_decrypted', {
  member_id: memberId,
});
```

## Usage

### Encrypting Data

Data is automatically encrypted by database triggers on insert/update:

```sql
-- Insert member (auto-encrypted)
INSERT INTO members (institution_id, full_name, phone, status)
VALUES (
  'institution-id',
  'John Doe',           -- Will be encrypted to full_name_encrypted
  '+250788123456',      -- Will be encrypted to phone_encrypted
  'ACTIVE'
);
```

### Decrypting Data

Use RPC functions to decrypt (authorized users only):

```typescript
import { getMemberDecrypted } from '../lib/encryption/pii';

// Get decrypted member data
const member = await getMemberDecrypted(memberId);
// Returns: { id, full_name: 'John Doe', phone: '+250788123456', ... }
```

### Searching by Phone

Use hash lookup for privacy-preserving search:

```typescript
import { findMemberByPhone } from '../lib/encryption/pii';

// Find member by phone (uses hash, doesn't decrypt all records)
const memberId = await findMemberByPhone('+250788123456');
```

## Key Rotation

### Rotating Encryption Key

1. **Generate new key**: `openssl rand -base64 32`
2. **Re-encrypt all data** with new key
3. **Update key in Supabase secrets**
4. **Verify decryption works**

**Note**: Key rotation requires re-encrypting all existing data. This is a complex operation and should be planned carefully.

## Security Considerations

### Key Management
- ✅ Store key in Supabase secrets (not in code)
- ✅ Use different keys for dev/staging/production
- ✅ Rotate keys periodically (annually recommended)
- ✅ Never commit keys to git

### Access Control
- ✅ Only staff/admin can decrypt PII
- ✅ Decryption is logged (via RLS)
- ✅ Use RPC functions (not direct column access)
- ✅ Audit all PII access

### Data Protection
- ✅ Encrypt at rest (database level)
- ✅ Encrypt in transit (TLS)
- ✅ Hash for searchability (phone numbers)
- ✅ No plaintext in backups (if possible)

## Performance

### Encryption Overhead
- **Encryption**: ~1-5ms per field
- **Decryption**: ~1-5ms per field
- **Hash computation**: <1ms

### Optimization Tips
1. **Batch operations**: Encrypt/decrypt in batches
2. **Caching**: Cache decrypted values for frequently accessed records
3. **Indexes**: Use hash indexes for phone lookups
4. **Selective decryption**: Only decrypt fields you need

## Troubleshooting

### Encryption Not Working

1. **Check key is set**:
   ```sql
   SELECT public.get_encryption_key();
   ```

2. **Check triggers are enabled**:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname LIKE '%pii%';
   ```

3. **Test encryption function**:
   ```sql
   SELECT public.encrypt_pii('test');
   ```

### Decryption Failing

1. **Check user authorization**:
   ```sql
   SELECT role FROM profiles WHERE user_id = auth.uid();
   ```

2. **Check encrypted data exists**:
   ```sql
   SELECT phone_encrypted FROM members LIMIT 1;
   ```

3. **Test decryption function**:
   ```sql
   SELECT public.decrypt_pii(phone_encrypted) FROM members LIMIT 1;
   ```

### Phone Lookup Not Working

1. **Check hash is computed**:
   ```sql
   SELECT phone_hash FROM members WHERE phone_hash IS NOT NULL LIMIT 1;
   ```

2. **Verify hash function**:
   ```sql
   SELECT public.compute_phone_hash('+250788123456');
   ```

## Files

- `supabase/migrations/20260115000005_pii_encryption.sql` - Encryption setup
- `supabase/migrations/20260115000006_migrate_pii_data.sql` - Data migration script
- `lib/encryption/pii.ts` - Client-side utilities

## Next Steps

1. **Set encryption key** in Supabase secrets
2. **Run migration** to create encrypted columns
3. **Migrate existing data** (manual step)
4. **Update application code** to use encrypted columns
5. **Test thoroughly** before dropping plaintext columns
6. **Monitor performance** and optimize as needed
