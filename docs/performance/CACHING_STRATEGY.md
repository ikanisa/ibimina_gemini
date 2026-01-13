# Caching Strategy Guide

**Version:** 1.0  
**Last Updated:** January 2026

---

## Overview

This guide documents the caching strategy for IBIMINA GEMINI, which improves application performance by reducing database load and response times.

---

## Caching Architecture

### Cache Adapters

1. **Redis (Production)** - Upstash Redis REST API
2. **Memory (Fallback)** - In-memory cache for development

### Cache Keys

Cache keys follow a hierarchical pattern:
- `{resource}:{action}:{identifier}`
- Example: `transactions:list:inst_123:recent`

---

## Caching Strategies

### 1. Query Result Caching

Cache the results of expensive database queries:

```typescript
import { getCached, cacheKeys, cacheTTL } from '@/lib/cache';

const transactions = await getCached(
  cacheKeys.transactions.list(institutionId, 'recent'),
  async () => {
    // Expensive database query
    return await fetchTransactions(institutionId);
  },
  cacheTTL.medium // 5 minutes
);
```

### 2. Dashboard Stats Caching

Cache dashboard statistics:

```typescript
const stats = await getCached(
  cacheKeys.stats.dashboard(institutionId),
  async () => {
    return await calculateDashboardStats(institutionId);
  },
  cacheTTL.short // 1 minute
);
```

### 3. Member/Group Lookups

Cache frequently accessed member and group data:

```typescript
const member = await getCached(
  cacheKeys.members.detail(memberId),
  async () => {
    return await fetchMember(memberId);
  },
  cacheTTL.long // 1 hour
);
```

---

## Cache TTL Guidelines

| Data Type | TTL | Reason |
|-----------|-----|--------|
| Real-time data | 60s (short) | Frequently changing |
| Dashboard stats | 300s (medium) | Moderately changing |
| Member/Group data | 3600s (long) | Slowly changing |
| Static data | 86400s (veryLong) | Rarely changing |

---

## Cache Invalidation

### Manual Invalidation

```typescript
import { cache, invalidateCache } from '@/lib/cache';

// Invalidate specific key
await cache.delete(cacheKeys.transactions.detail(transactionId));

// Invalidate by tag
await invalidateCache('transactions', institutionId);
```

### Automatic Invalidation

Invalidate cache when data is modified:

```typescript
// After creating a transaction
await createTransaction(data);
await invalidateCache('transactions', institutionId);
await invalidateCache('stats', institutionId);
```

---

## Cache Warming

### On Application Start

Warm frequently accessed data:

```typescript
import { warmCache } from '@/lib/cache/strategies';

// Warm cache for active institution
await warmCache(institutionId);
```

### On User Login

Warm user-specific data:

```typescript
// After user login
await warmCache(user.institutionId);
```

---

## Best Practices

### Do's

✅ Cache expensive queries  
✅ Use appropriate TTLs  
✅ Invalidate on data changes  
✅ Warm frequently accessed data  
✅ Monitor cache hit rates  

### Don'ts

❌ Don't cache sensitive data  
❌ Don't cache user-specific data without user ID  
❌ Don't use very long TTLs for frequently changing data  
❌ Don't forget to invalidate on updates  
❌ Don't cache without considering memory usage  

---

## Monitoring

### Cache Hit Rate

Monitor cache hit rates to optimize TTLs:

```typescript
// Track cache hits/misses
let hits = 0;
let misses = 0;

const value = await getCached(key, async () => {
  misses++;
  return fetchData();
});

if (value) {
  hits++;
}
```

### Cache Size

Monitor cache size to prevent memory issues:

```typescript
// Check cache size (Redis)
const info = await fetch(`${redisUrl}/info`, {
  headers: { Authorization: `Bearer ${token}` }
});
```

---

## Troubleshooting

### Cache Not Working

1. Check Redis connection:
   ```typescript
   const test = await cache.get('test');
   ```

2. Verify environment variables:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`

3. Check cache adapter:
   ```typescript
   console.log(cache.constructor.name); // Should be RedisCacheAdapter
   ```

### Stale Data

1. Reduce TTL for frequently changing data
2. Implement proper invalidation
3. Use cache tags for group invalidation

---

## Resources

- **Cache Implementation:** `lib/cache/redis.ts`
- **Cache Strategies:** `lib/cache/strategies.ts`
- **Upstash Redis Docs:** https://docs.upstash.com/redis

---

**Document Owner:** Backend Team  
**Last Updated:** January 2026
