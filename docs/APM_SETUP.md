# Application Performance Monitoring (APM) Setup Guide

## Overview

APM has been implemented to track application performance, database query performance, and identify bottlenecks. This includes client-side performance tracking, database query monitoring, and integration with Sentry.

## Current Implementation

### 1. Client-Side APM (`lib/monitoring/apm.ts`)

**Features:**
- ✅ Custom metric tracking
- ✅ Database query performance tracking
- ✅ API request performance tracking
- ✅ Component render performance tracking
- ✅ Function execution time measurement
- ✅ Slow query/request alerts
- ✅ Integration with Sentry

**Metrics Tracked:**
- `db.query.duration` - Database query execution time
- `db.query.rows` - Number of rows returned
- `api.request.duration` - API request duration
- `api.request.count` - API request count
- `component.render.duration` - Component render time
- Custom business metrics

### 2. Database Query Monitoring

**File:** `supabase/migrations/20260115000007_enable_query_monitoring.sql`

**Features:**
- ✅ `pg_stat_statements` extension enabled
- ✅ Slow queries view (queries > 1 second)
- ✅ Frequent queries view
- ✅ Top queries by execution time view
- ✅ Query statistics function
- ✅ Cache hit rate tracking

**Views Created:**
- `slow_queries` - Queries taking > 1 second on average
- `frequent_queries` - Most frequently executed queries
- `top_queries_by_time` - Queries with highest total execution time

**Functions:**
- `get_query_stats(min_duration_ms, limit_count)` - Get query statistics
- `reset_query_stats()` - Reset query statistics (admin only)

### 3. Performance API Utilities (`lib/api/performance.ts`)

**Features:**
- ✅ Supabase query performance tracking
- ✅ React Query performance tracking
- ✅ Automatic error tracking

## Usage

### Track Custom Metrics

```typescript
import { trackMetric } from './lib/monitoring/apm';

// Track a custom metric
trackMetric('user.login.duration', 250, 'ms', {
  method: 'email',
  success: 'true',
});
```

### Track Database Queries

```typescript
import { trackQuery } from './lib/monitoring/apm';

// Track a database query
const start = performance.now();
const { data, error } = await supabase.from('members').select('*');
const duration = performance.now() - start;

trackQuery('SELECT * FROM members', duration, data?.length, error?.message);
```

### Measure Function Performance

```typescript
import { measureFunction } from './lib/monitoring/apm';

// Automatically track function execution time
const result = await measureFunction(
  'processTransaction',
  async () => {
    // Your function logic
    return await processTransaction(data);
  },
  { transaction_type: 'deposit' }
);
```

### Track API Requests

```typescript
import { trackApiRequest } from './lib/monitoring/apm';

const start = performance.now();
const response = await fetch('/api/endpoint');
const duration = performance.now() - start;

trackApiRequest(
  '/api/endpoint',
  'GET',
  duration,
  response.status,
  response.ok ? undefined : 'Request failed'
);
```

### Track Component Renders

```typescript
import { useEffect } from 'react';
import { trackComponentRender } from './lib/monitoring/apm';

function MyComponent() {
  useEffect(() => {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      trackComponentRender('MyComponent', duration);
    };
  }, []);

  return <div>...</div>;
}
```

### Use Performance API Wrapper

```typescript
import { trackSupabaseQuery } from './lib/api/performance';

// Automatically track Supabase query performance
const { data, error } = await trackSupabaseQuery(
  'fetchMembers',
  () => supabase.from('members').select('*')
);
```

## Database Query Monitoring

### View Slow Queries

```sql
-- Get slow queries (> 1 second)
SELECT * FROM slow_queries LIMIT 10;

-- Get query statistics
SELECT * FROM get_query_stats(1000, 50); -- Queries > 1 second, top 50
```

### View Frequent Queries

```sql
-- Get most frequently executed queries
SELECT * FROM frequent_queries LIMIT 10;
```

### View Top Queries by Time

```sql
-- Get queries with highest total execution time
SELECT * FROM top_queries_by_time LIMIT 10;
```

### Reset Query Statistics

```sql
-- Reset query statistics (admin only)
SELECT reset_query_stats();
```

## Sentry Integration

All performance metrics are automatically sent to Sentry (if configured):

- Custom metrics → Sentry distribution metrics
- Slow queries → Sentry warning messages
- Slow API requests → Sentry warning messages
- Slow component renders → Sentry warning messages

### Viewing Metrics in Sentry

1. Go to Sentry Dashboard → Performance
2. View transactions and spans
3. Check custom metrics in Metrics section
4. Review slow queries/requests in Issues

## Alerting

### Slow Query Alerts

Queries taking > 1 second automatically trigger Sentry warnings:
- Query text (sanitized)
- Duration
- Row count

### Slow API Request Alerts

API requests taking > 2 seconds automatically trigger Sentry warnings:
- Endpoint
- Method
- Duration
- Status code

### Slow Component Render Alerts

Component renders taking > 100ms automatically trigger Sentry warnings:
- Component name
- Duration

## Performance Targets

### Database Queries
- **Target**: < 100ms average
- **Warning**: > 500ms
- **Critical**: > 1 second

### API Requests
- **Target**: < 200ms average
- **Warning**: > 1 second
- **Critical**: > 2 seconds

### Component Renders
- **Target**: < 16ms (60 FPS)
- **Warning**: > 50ms
- **Critical**: > 100ms

## Monitoring Dashboard

### Key Metrics to Track

1. **Average Query Duration**: Should be < 100ms
2. **Slow Query Count**: Should be < 10 per hour
3. **Average API Duration**: Should be < 200ms
4. **Cache Hit Rate**: Should be > 90%
5. **Component Render Time**: Should be < 16ms average

### Weekly Review

Every Monday, review:
- [ ] Slow queries (top 10)
- [ ] Frequent queries (top 10)
- [ ] Average query duration trend
- [ ] Cache hit rate
- [ ] Component render performance
- [ ] API request performance

## Supabase Built-in Monitoring

Supabase provides built-in query performance monitoring:

1. **Supabase Dashboard** → Database → Query Performance
   - View slow queries
   - Query execution plans
   - Index recommendations

2. **pg_stat_statements**
   - Already enabled via migration
   - Tracks all query statistics
   - Available via views and functions

## Advanced Configuration

### Custom Alert Thresholds

Modify thresholds in `lib/monitoring/apm.ts`:

```typescript
// Slow query threshold (default: 1000ms)
if (duration > 1000 && !error) {
  // Alert
}

// Slow API request threshold (default: 2000ms)
if (duration > 2000 && !error) {
  // Alert
}

// Slow component render threshold (default: 100ms)
if (duration > 100) {
  // Alert
}
```

### Metric Retention

Metrics are kept in memory (max 1000 metrics). For long-term storage:
- Sentry (if configured)
- Custom analytics service
- Database logging

## Troubleshooting

### Metrics Not Appearing in Sentry

1. **Check Sentry is configured**:
   ```bash
   echo $VITE_SENTRY_DSN
   ```

2. **Check production mode**:
   - Metrics only sent in production
   - Or set `VITE_SENTRY_DEBUG=true`

3. **Check Sentry dashboard**:
   - Go to Performance → Metrics
   - Verify metrics are being received

### Query Statistics Not Available

1. **Check extension is enabled**:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'pg_stat_statements';
   ```

2. **Check permissions**:
   ```sql
   GRANT SELECT ON slow_queries TO authenticated;
   ```

3. **Reset statistics**:
   ```sql
   SELECT reset_query_stats();
   ```

## Files

- `lib/monitoring/apm.ts` - Client-side APM implementation
- `lib/api/performance.ts` - Performance API utilities
- `supabase/migrations/20260115000007_enable_query_monitoring.sql` - Database monitoring setup
- `docs/APM_SETUP.md` - This guide

## Next Steps

1. **Deploy database migration** to enable query monitoring
2. **Integrate APM tracking** into critical paths
3. **Set up Sentry alerts** for slow queries/requests
4. **Create performance dashboard** (optional)
5. **Set up weekly reviews** for performance metrics
6. **Optimize slow queries** identified by monitoring

## Cost Considerations

- **Sentry**: Included in existing plan (performance monitoring)
- **Supabase**: Built-in query monitoring (no additional cost)
- **Custom Analytics**: Optional (if needed)

No additional costs for basic APM setup.
