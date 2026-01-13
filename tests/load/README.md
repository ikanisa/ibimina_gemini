# Load Testing with k6

This directory contains load testing scenarios using [k6](https://k6.io/).

## Prerequisites

1. **Install k6:**
   ```bash
   # macOS
   brew install k6
   
   # Linux
   sudo gpg -k
   sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
   echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
   sudo apt-get update
   sudo apt-get install k6
   
   # Windows
   choco install k6
   ```

2. **Set Environment Variables:**
   ```bash
   export BASE_URL="http://localhost:5173"
   export SUPABASE_URL="https://your-project.supabase.co"
   export SUPABASE_ANON_KEY="your-anon-key"
   ```

## Running Load Tests

### Quick Test (100 users, 5 minutes)
```bash
k6 run --vus 100 --duration 5m tests/load/scenarios.js
```

### Full Load Test (1000 concurrent users)
```bash
k6 run tests/load/scenarios.js
```

### Custom Load Test
```bash
k6 run --stage 2m:100,5m:500,2m:1000,10m:1000 tests/load/scenarios.js
```

### With Environment Variables
```bash
BASE_URL="https://staging.example.com" \
SUPABASE_URL="https://your-project.supabase.co" \
SUPABASE_ANON_KEY="your-key" \
k6 run tests/load/scenarios.js
```

## Test Scenarios

The load test includes the following scenarios:

1. **Dashboard Load** - Fetching dashboard statistics
2. **Transactions List** - Loading transaction lists with pagination
3. **Groups List** - Loading groups list
4. **Members List** - Loading members list
5. **Transaction Allocation** - Allocating transactions to members
6. **Reports Generation** - Generating financial reports
7. **Search Operations** - Performing search queries

## Performance Thresholds

The tests enforce the following thresholds:

- **HTTP Request Duration:**
  - 95% of requests < 2 seconds
  - 99% of requests < 5 seconds

- **Error Rate:**
  - < 1% of requests should fail

- **Iteration Duration:**
  - 95% of iterations < 5 seconds

## Test Stages

The default test configuration ramps up to 1000 concurrent users:

1. **Ramp up to 100 users** (2 minutes)
2. **Stay at 100 users** (5 minutes)
3. **Ramp up to 500 users** (2 minutes)
4. **Stay at 500 users** (5 minutes)
5. **Ramp up to 1000 users** (2 minutes)
6. **Stay at 1000 users** (10 minutes)
7. **Ramp down to 0 users** (2 minutes)

**Total Duration:** ~28 minutes

## Analyzing Results

### View Summary
```bash
k6 run tests/load/scenarios.js
```

### Generate HTML Report
```bash
k6 run --out json=results.json tests/load/scenarios.js
# Then use k6-to-junit or k6-reporter to generate HTML
```

### Real-time Monitoring
Use k6 Cloud for real-time monitoring:
```bash
k6 cloud tests/load/scenarios.js
```

## Interpreting Results

### Key Metrics

- **http_req_duration**: Time taken for HTTP requests
  - `avg`: Average response time
  - `p(95)`: 95th percentile (95% of requests faster than this)
  - `p(99)`: 99th percentile

- **http_req_failed**: Percentage of failed requests
  - Should be < 1%

- **iterations**: Number of completed test iterations

- **vus**: Virtual Users (concurrent users)

### Example Output

```
✓ dashboard status is 200
✓ dashboard response time < 2s
✓ transactions status is 200
✓ transactions response time < 2s

checks.........................: 95.00% ✓ 1900      ✗ 100
data_received..................: 2.5 MB 15 kB/s
data_sent......................: 1.2 MB 7.2 kB/s
http_req_duration..............: avg=450ms min=120ms med=380ms max=2.1s p(90)=850ms p(95)=1.2s p(99)=1.8s
http_req_failed................: 0.50%  ✓ 10       ✗ 1990
iterations.....................: 1000   50/s
vus............................: 100    min=100    max=100
```

## Troubleshooting

### High Error Rates

If error rates are high:
1. Check database connection pool limits
2. Verify rate limiting is not too aggressive
3. Check Supabase project limits
4. Review application logs for errors

### Slow Response Times

If response times are slow:
1. Check database query performance
2. Verify indexes are being used
3. Review API endpoint optimization
4. Check network latency

### Authentication Failures

If authentication fails:
1. Verify test user credentials
2. Check Supabase auth configuration
3. Ensure RLS policies allow test users
4. Verify API keys are correct

## CI/CD Integration

Load tests can be integrated into CI/CD:

```yaml
# .github/workflows/load-test.yml
- name: Run Load Tests
  run: |
    k6 run --vus 100 --duration 5m tests/load/scenarios.js
```

## Best Practices

1. **Run tests in staging environment** - Never run load tests against production
2. **Start small** - Begin with low user counts and gradually increase
3. **Monitor resources** - Watch database CPU, memory, and connection pools
4. **Set realistic thresholds** - Adjust thresholds based on actual requirements
5. **Test regularly** - Run load tests after major changes
6. **Document results** - Keep records of test results for comparison

## Next Steps

After running load tests:

1. **Analyze bottlenecks** - Identify slow endpoints
2. **Optimize queries** - Add indexes, optimize SQL
3. **Scale infrastructure** - Adjust database/API limits if needed
4. **Re-run tests** - Verify improvements
5. **Document findings** - Update performance documentation
