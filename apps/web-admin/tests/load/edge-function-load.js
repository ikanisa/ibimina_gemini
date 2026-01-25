/**
 * k6 Load Test for Edge Functions
 * 
 * Tests Supabase Edge Functions under load
 * 
 * Usage:
 *   k6 run tests/load/edge-function-load.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const errorRate = new Rate('errors');
const functionDuration = new Trend('function_duration');

const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'your-anon-key';

// Test SMS ingest endpoint (if IP whitelisting allows)
export default function () {
  // Test health check endpoint
  const healthRes = http.get(`${SUPABASE_URL}/functions/v1/health`, {
    headers: {
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  const healthSuccess = check(healthRes, {
    'health check status is 200': (r) => r.status === 200,
    'health check response time < 1s': (r) => r.timings.duration < 1000,
  });

  if (!healthSuccess) {
    errorRate.add(1);
  }

  functionDuration.add(healthRes.timings.duration);

  sleep(1);
}

export const options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '3m', target: 50 },
    { duration: '1m', target: 200 },
    { duration: '3m', target: 200 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};
