# Load Testing Guide

## Overview

This guide explains how to run load tests for the IBIMINA GEMINI system using k6.

## Prerequisites

1. **Install k6:**
   ```bash
   # macOS
   brew install k6
   
   # Linux (see tests/load/README.md for full instructions)
   sudo apt-get install k6
   ```

2. **Set Environment Variables:**
   ```bash
   export SUPABASE_URL="https://your-project.supabase.co"
   export SUPABASE_ANON_KEY="your-anon-key"
   export BASE_URL="https://staging.example.com"  # For staging tests
   ```

## Test Scenarios

### 1. Standard Load Test

Tests system with gradual ramp-up to 1000 concurrent users:

```bash
npm run load:test
# or
k6 run tests/load/scenarios.js
```

**Test Stages:**
- 0-2min: Ramp to 100 users
- 2-7min: Stay at 100 users
- 7-9min: Ramp to 500 users
- 9-14min: Stay at 500 users
- 14-16min: Ramp to 1000 users
- 16-26min: Stay at 1000 users
- 26-28min: Ramp down

**Total Duration:** ~28 minutes

### 2. Quick Load Test

Quick test with 100 users for 5 minutes:

```bash
npm run load:quick
# or
k6 run --vus 100 --duration 5m tests/load/scenarios.js
```

### 3. Stress Test

Tests system limits by ramping up beyond normal capacity:

```bash
npm run load:stress
# or
k6 run tests/load/stress-test.js
```

### 4. Edge Function Load Test

Tests Supabase Edge Functions:

```bash
npm run load:edge
# or
k6 run tests/load/edge-function-load.js
```

## Performance Thresholds

The load tests enforce the following thresholds:

| Metric | Threshold | Description |
|--------|-----------|-------------|
| `http_req_duration` | p(95) < 2000ms | 95% of requests complete in < 2 seconds |
| `http_req_duration` | p(99) < 5000ms | 99% of requests complete in < 5 seconds |
| `http_req_failed` | rate < 0.01 | Error rate < 1% |
| `iteration_duration` | p(95) < 5000ms | 95% of iterations complete in < 5 seconds |

## Test Scenarios Covered

1. **Dashboard Load** - Fetching dashboard statistics
2. **Transactions List** - Loading transaction lists with pagination
3. **Groups List** - Loading groups list
4. **Members List** - Loading members list
5. **Transaction Allocation** - Allocating transactions to members
6. **Reports Generation** - Generating financial reports
7. **Search Operations** - Performing search queries

## Interpreting Results

### Key Metrics

- **http_req_duration**: Response time distribution
  - `avg`: Average response time
  - `p(95)`: 95th percentile (95% of requests faster)
  - `p(99)`: 99th percentile

- **http_req_failed**: Percentage of failed requests
  - Should be < 1% for production readiness

- **iterations**: Number of completed test iterations

- **vus**: Virtual Users (concurrent users)

### Example Output

```
✓ dashboard status is 200
✓ dashboard response time < 2s
✓ transactions status is 200

checks.........................: 95.00% ✓ 1900      ✗ 100
data_received..................: 2.5 MB 15 kB/s
data_sent......................: 1.2 MB 7.2 kB/s
http_req_duration..............: avg=450ms min=120ms med=380ms max=2.1s p(90)=850ms p(95)=1.2s p(99)=1.8s
http_req_failed................: 0.50%  ✓ 10       ✗ 1990
iterations.....................: 1000   50/s
vus............................: 1000   min=100    max=1000
```

## Troubleshooting

### High Error Rates

**Symptoms:** `http_req_failed` > 1%

**Possible Causes:**
- Database connection pool exhausted
- Rate limiting too aggressive
- Supabase project limits reached
- Network issues

**Solutions:**
1. Check database connection pool settings
2. Review rate limiting configuration
3. Verify Supabase project tier limits
4. Check application logs for errors

### Slow Response Times

**Symptoms:** `http_req_duration` p(95) > 2000ms

**Possible Causes:**
- Slow database queries
- Missing indexes
- Inefficient API endpoints
- High network latency

**Solutions:**
1. Review slow query logs
2. Verify database indexes are used
3. Optimize API endpoints
4. Check network latency

### Authentication Failures

**Symptoms:** High error rate on authenticated endpoints

**Possible Causes:**
- Invalid test user credentials
- RLS policies blocking access
- Expired tokens
- Incorrect API keys

**Solutions:**
1. Verify test user credentials
2. Check RLS policies for test users
3. Ensure tokens are refreshed
4. Verify API keys are correct

## Best Practices

1. **Test in Staging First** - Never run load tests against production
2. **Start Small** - Begin with low user counts (10-50) and gradually increase
3. **Monitor Resources** - Watch database CPU, memory, and connection pools
4. **Set Realistic Thresholds** - Adjust based on actual requirements
5. **Test Regularly** - Run load tests after major changes
6. **Document Results** - Keep records for comparison over time

## CI/CD Integration

Load tests are automatically run:
- Weekly on Sundays at 2 AM UTC (scheduled)
- On-demand via workflow_dispatch

To run manually:
```bash
gh workflow run load-test.yml
```

## Performance Optimization Checklist

After identifying bottlenecks:

- [ ] Add database indexes for slow queries
- [ ] Optimize SQL queries
- [ ] Implement caching where appropriate
- [ ] Scale database resources if needed
- [ ] Review and optimize API endpoints
- [ ] Adjust rate limiting if too aggressive
- [ ] Consider connection pooling
- [ ] Review and optimize RLS policies

## Next Steps

1. Run initial load test to establish baseline
2. Identify bottlenecks
3. Implement optimizations
4. Re-run load tests to verify improvements
5. Document findings and update thresholds
