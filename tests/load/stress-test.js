/**
 * k6 Stress Test
 * 
 * Tests system limits by ramping up beyond normal capacity
 * 
 * Usage:
 *   k6 run tests/load/stress-test.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

const errorRate = new Rate('errors');

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5173';
const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'your-anon-key';

export default function () {
  // Simple health check to stress test
  const res = http.get(`${BASE_URL}/`, {
    headers: {
      'User-Agent': 'k6-load-test',
    },
  });

  const success = check(res, {
    'status is 200 or 401': (r) => r.status === 200 || r.status === 401, // 401 is OK (not logged in)
    'response time < 5s': (r) => r.timings.duration < 5000,
  });

  if (!success) {
    errorRate.add(1);
  }

  sleep(0.5); // Minimal sleep for maximum stress
}

export const options = {
  // Stress test: ramp up quickly to find breaking point
  stages: [
    { duration: '1m', target: 500 },
    { duration: '2m', target: 1000 },
    { duration: '2m', target: 2000 },
    { duration: '2m', target: 3000 },
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<10000'], // More lenient for stress test
    http_req_failed: ['rate<0.05'], // Allow up to 5% errors in stress test
  },
};
