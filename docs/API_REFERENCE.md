# Ibimina Gemini API Reference

## Overview

Base URL: `https://[your-supabase-project].supabase.co`

All API requests require authentication via Supabase JWT tokens passed in the `Authorization` header.

---

## Authentication

### Login

```http
POST /auth/v1/token?grant_type=password
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "access_token": "eyJ...",
  "refresh_token": "...",
  "expires_in": 3600,
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

### Logout

```http
POST /auth/v1/logout
Authorization: Bearer {access_token}
```

### Password Reset Request

```http
POST /auth/v1/recover
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

---

## Members

### List Members

```http
GET /rest/v1/members?select=*&institution_id=eq.{uuid}
Authorization: Bearer {access_token}
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `institution_id` | UUID | Filter by institution |
| `status` | string | Filter by status (ACTIVE, SUSPENDED, CLOSED) |
| `limit` | number | Number of results (default: 20, max: 100) |
| `offset` | number | Pagination offset |

**Response:**
```json
[
  {
    "id": "uuid",
    "full_name": "John Doe",
    "phone": "+250788123456",
    "email": "john@example.com",
    "status": "ACTIVE",
    "kyc_status": "VERIFIED",
    "savings_balance": 150000,
    "created_at": "2026-01-01T00:00:00Z"
  }
]
```

### Create Member

```http
POST /rest/v1/members
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "full_name": "John Doe",
  "phone": "+250788123456",
  "institution_id": "uuid",
  "branch": "Main Branch"
}
```

### Update Member

```http
PATCH /rest/v1/members?id=eq.{uuid}
Authorization: Bearer {access_token}
Content-Type: application/json
```

---

## Transactions

### List Transactions

```http
GET /rest/v1/transactions?select=*&institution_id=eq.{uuid}&order=created_at.desc
Authorization: Bearer {access_token}
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `member_id` | UUID | Filter by member |
| `group_id` | UUID | Filter by group |
| `type` | string | Transaction type |
| `status` | string | Transaction status |
| `created_at.gte` | timestamp | Start date filter |
| `created_at.lte` | timestamp | End date filter |

**Transaction Types:**
- `DEPOSIT` - Cash/mobile deposit
- `WITHDRAWAL` - Cash withdrawal
- `TRANSFER` - Internal transfer
- `LOAN_REPAYMENT` - Loan payment
- `GROUP_CONTRIBUTION` - Group savings contribution
- `TOKEN_PURCHASE` - Token purchase
- `TOKEN_REDEEM` - Token redemption

**Response:**
```json
[
  {
    "id": "uuid",
    "member_id": "uuid",
    "amount": 10000,
    "currency": "RWF",
    "type": "DEPOSIT",
    "channel": "MOMO_NFC",
    "status": "COMPLETED",
    "momo_ref": "12345678",
    "created_at": "2026-01-01T12:00:00Z"
  }
]
```

### Create Transaction

```http
POST /rest/v1/transactions
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "institution_id": "uuid",
  "member_id": "uuid",
  "amount": 10000,
  "currency": "RWF",
  "type": "DEPOSIT",
  "channel": "CASH",
  "description": "Monthly deposit"
}
```

---

## Groups

### List Groups

```http
GET /rest/v1/groups?select=*,group_members(count)&institution_id=eq.{uuid}
Authorization: Bearer {access_token}
```

### Create Group

```http
POST /rest/v1/groups
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "group_name": "Savings Circle A",
  "institution_id": "uuid",
  "expected_amount": 5000,
  "frequency": "WEEKLY",
  "grace_days": 7
}
```

**Frequency Options:** `WEEKLY`, `BIWEEKLY`, `MONTHLY`

---

## Contributions

### List Contributions

```http
GET /rest/v1/contributions?select=*&group_id=eq.{uuid}&order=date.desc
Authorization: Bearer {access_token}
```

### Record Contribution

```http
POST /rest/v1/contributions
Authorization: Bearer {access_token}
Content-Type: application/json
```

**Request Body:**
```json
{
  "group_id": "uuid",
  "member_id": "uuid",
  "amount": 5000,
  "method": "MOMO",
  "date": "2026-01-01"
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| `AUTH_001` | Invalid credentials |
| `AUTH_002` | Token expired |
| `AUTH_003` | Account suspended |
| `TXN_001` | Insufficient funds |
| `TXN_002` | Transaction limit exceeded |
| `MBR_001` | Member not found |
| `MBR_002` | Duplicate phone number |
| `GRP_001` | Group not found |
| `GEN_001` | Internal server error |
| `GEN_004` | Permission denied |
| `GEN_005` | Rate limit exceeded |

---

## Rate Limits

| Endpoint Type | Limit |
|---------------|-------|
| Authentication | 10 requests/minute |
| Read operations | 100 requests/minute |
| Write operations | 30 requests/minute |

---

## Webhooks

The system supports webhooks for real-time notifications:

### SMS Ingest Webhook

```http
POST /functions/v1/sms-ingest
Content-Type: application/json
X-Webhook-Secret: {secret}
```

**Payload:**
```json
{
  "sender": "+250788123456",
  "message": "MOMO payment received...",
  "timestamp": "2026-01-01T12:00:00Z",
  "device_id": "device-uuid"
}
```
