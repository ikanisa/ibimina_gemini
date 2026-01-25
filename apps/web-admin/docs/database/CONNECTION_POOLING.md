# Database Connection Pooling Documentation

## Overview

Supabase provides automatic connection pooling via [PgBouncer](https://www.pgbouncer.org/) for all projects. This document outlines best practices and configuration.

## Supabase Connection Pooling

### Default Configuration
- **Pool Mode**: Transaction (default)
- **Pool Size**: Based on your plan (Free: 10, Pro: 100+)
- **Max Client Connections**: Managed by Supabase

### Connection Strings

#### Direct Connection (for migrations)
```
postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

#### Pooled Connection (for application)
```
postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
```

## Client-Side Best Practices

### 1. Use a Single Supabase Client

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Create only ONE client instance
export const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
    db: {
      schema: 'public',
    },
    global: {
      fetch: customFetch, // Optional: custom fetch with retry
    },
  }
);
```

### 2. Avoid Creating Multiple Clients

❌ **Bad:**
```typescript
function getUserData() {
  const supabase = createClient(url, key); // Creates new client each time!
  return supabase.from('users').select('*');
}
```

✅ **Good:**
```typescript
import { supabase } from '@/lib/supabase';

function getUserData() {
  return supabase.from('users').select('*');
}
```

### 3. Implement Request Batching

```typescript
// Batch multiple reads into single request
const { data } = await supabase.rpc('get_dashboard_data', {
  user_id: userId,
});
// Instead of separate queries for each stat
```

### 4. Use Efficient Queries

```typescript
// Avoid N+1 - use joins instead of multiple queries
const { data } = await supabase
  .from('transactions')
  .select(`
    id,
    amount,
    member:members(id, full_name),
    created_by:profiles(full_name)
  `)
  .eq('institution_id', institutionId);
```

## Server-Side (Edge Functions)

### Connection Management

Edge Functions automatically use pooled connections. For intensive operations:

```typescript
// supabase/functions/batch-process/index.ts
import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    {
      db: {
        schema: 'public',
      },
      auth: {
        persistSession: false, // No session needed for service role
      },
    }
  );

  // Your logic here
});
```

### Transaction Handling

For operations requiring transactions:

```typescript
const { data, error } = await supabase.rpc('transfer_funds', {
  from_member: memberId1,
  to_member: memberId2,
  amount: amount,
});
// Database function handles transaction internally
```

## Monitoring

### Check Active Connections

```sql
SELECT 
  usename, 
  client_addr, 
  state, 
  query_start,
  NOW() - query_start AS duration
FROM pg_stat_activity
WHERE datname = 'postgres';
```

### Pool Statistics (via Supabase Dashboard)
1. Go to Project Settings → Database
2. View connection statistics
3. Monitor peak usage times

## Scaling Considerations

| Plan | Max Connections | Pooler Connections |
|------|-----------------|-------------------|
| Free | 10 | 50 |
| Pro | 60 | 200 |
| Team | 100 | 300 |
| Enterprise | Custom | Custom |

## Troubleshooting

### "Too many connections"

1. Ensure using pooled connection string
2. Check for client-side connection leaks
3. Review and close unused connections
4. Consider upgrading plan if legitimate load

### Slow Queries

1. Use EXPLAIN ANALYZE on slow queries
2. Add appropriate indexes
3. Consider materialized views for complex aggregations
4. Use RPC functions for complex operations

## Resources

- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)
- [PgBouncer Documentation](https://www.pgbouncer.org/usage.html)
- [Postgres Connection Management](https://www.postgresql.org/docs/current/runtime-config-connection.html)
