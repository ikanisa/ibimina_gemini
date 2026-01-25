# Regulatory Compliance

## Overview
This document outlines the regulatory compliance considerations for the SACCO+ Admin Portal, a fintech solution for SACCO/MFI operations with Mobile Money reconciliation.

---

## Data Retention Policies

### Transaction Records
| Data Type | Retention Period | Justification |
|-----------|------------------|---------------|
| Transactions | 7 years | Financial audit requirements |
| Audit logs | 5 years | Compliance and forensics |
| Raw SMS | 1 year | Troubleshooting, then anonymize |
| Member data | Active + 3 years | Post-relationship retention |
| Session logs | 90 days | Security analysis |

### Implementation
```sql
-- Transactions: Immutable, never deleted
-- Stored with institution_id for multi-tenant isolation

-- Audit logs: Automatic cleanup after 5 years
-- Schedule via pg_cron or Supabase scheduled functions

-- Raw SMS: Anonymize after 1 year
UPDATE momo_sms_raw 
SET sms_text = '[REDACTED]', sender_phone = 'xxx-xxx-' || RIGHT(sender_phone, 4)
WHERE received_at < NOW() - INTERVAL '1 year';
```

---

## API Key Rotation Procedure

### 1. Generate New Key
```bash
# Generate a secure random key
openssl rand -hex 32
# Example output: a1b2c3d4e5f6...
```

### 2. Update Supabase Secrets
```bash
# Set the new key
supabase secrets set SMS_INGEST_API_KEY=<new-key>

# For deployment, redeploy the function
supabase functions deploy sms-ingest
```

### 3. Update Client Applications
- Update the SMS forwarding app with new API key
- Test with a single device before rolling out

### 4. Rotation Schedule
- **Recommended**: Quarterly rotation
- **Mandatory**: After any suspected compromise
- **Grace Period**: Keep old key active for 24 hours during transition

---

## Data Protection (GDPR-Aligned)

### Principles
1. **Lawful Processing**: Transaction data processed for legitimate SACCO operations
2. **Data Minimization**: Only essential fields collected
3. **Accuracy**: Member data kept up-to-date via portal
4. **Storage Limitation**: Retention periods defined above
5. **Integrity**: Immutable transaction ledger with audit trail

### Member Rights
| Right | Implementation |
|-------|----------------|
| Access | Members can request statements via SACCO |
| Rectification | Institution admins can update member details |
| Erasure | Soft-delete with anonymization after retention period |
| Portability | CSV export available in Reports |

---

## Security Controls

### Row-Level Security (RLS)
All tables have RLS policies enforcing:
- Institution-level isolation
- Role-based access control
- No cross-tenant data access

### Authentication
- Supabase Auth with email/password
- Session management with JWT
- Optional MFA (can be enabled per institution)

### Encryption
- At rest: AES-256 (Supabase default)
- In transit: TLS 1.2+ enforced
- Sensitive fields: Not stored client-side

---

## Audit and Logging

### Audit Log Contents
- User ID and email
- Action type (CREATE, UPDATE, DELETE, ALLOCATE)
- Timestamp
- IP address (where available)
- Before/after values for changes

### Access
- INSTITUTION_AUDITOR role: Read-only access to audit logs
- PLATFORM_ADMIN: Cross-institution audit access
- Export available for compliance reviews

---

## Compliance Checklist

- [x] Immutable transaction ledger
- [x] Multi-tenant isolation via RLS
- [x] Audit logging for all critical actions
- [x] Role-based access control
- [x] Session management
- [x] HTTPS enforcement
- [ ] MFA for administrators (optional, user-enabled)
- [ ] Automated data retention cleanup (scheduled job needed)
- [ ] Incident response plan (see docs/operations/INCIDENT_RESPONSE.md)
