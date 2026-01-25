/**
 * k6 Load Test Scenarios
 * 
 * Tests critical API endpoints under load
 * 
 * Usage:
 *   k6 run tests/load/scenarios.js
 *   k6 run --vus 100 --duration 5m tests/load/scenarios.js
 *   k6 run --stage 2m:100,5m:500,2m:1000,10m:1000 tests/load/scenarios.js
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const transactionDuration = new Trend('transaction_duration');
const apiCallCount = new Counter('api_calls');

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:5173';
const SUPABASE_URL = __ENV.SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = __ENV.SUPABASE_ANON_KEY || 'your-anon-key';

// Test data
const testUsers = [
  { email: 'loadtest1@example.com', password: 'Test123456!' },
  { email: 'loadtest2@example.com', password: 'Test123456!' },
  { email: 'loadtest3@example.com', password: 'Test123456!' },
];

// Helper function to get auth token
function getAuthToken(email, password) {
  const loginRes = http.post(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, 
    JSON.stringify({ email, password }),
    {
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
    }
  );

  if (loginRes.status === 200) {
    const body = JSON.parse(loginRes.body);
    return body.access_token;
  }
  return null;
}

// Helper function to make authenticated request
function authenticatedRequest(method, url, token, body = null) {
  const params = {
    headers: {
      'Authorization': `Bearer ${token}`,
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
  };

  let response;
  switch (method) {
    case 'GET':
      response = http.get(url, params);
      break;
    case 'POST':
      response = http.post(url, JSON.stringify(body), params);
      break;
    case 'PATCH':
      response = http.patch(url, JSON.stringify(body), params);
      break;
    case 'DELETE':
      response = http.del(url, null, params);
      break;
    default:
      response = http.get(url, params);
  }

  apiCallCount.add(1);
  return response;
}

// ============================================================================
// Scenario 1: Dashboard Load
// ============================================================================

export function dashboardLoad() {
  const user = testUsers[__VU % testUsers.length];
  const token = getAuthToken(user.email, user.password);

  if (!token) {
    errorRate.add(1);
    return;
  }

  const startTime = Date.now();

  // Fetch dashboard data
  const dashboardRes = authenticatedRequest(
    'GET',
    `${SUPABASE_URL}/rest/v1/rpc/get_dashboard_stats`,
    token
  );

  const duration = Date.now() - startTime;
  transactionDuration.add(duration);

  const success = check(dashboardRes, {
    'dashboard status is 200': (r) => r.status === 200,
    'dashboard response time < 2s': (r) => r.timings.duration < 2000,
  });

  if (!success) {
    errorRate.add(1);
  }

  sleep(1);
}

// ============================================================================
// Scenario 2: Transactions List
// ============================================================================

export function transactionsList() {
  const user = testUsers[__VU % testUsers.length];
  const token = getAuthToken(user.email, user.password);

  if (!token) {
    errorRate.add(1);
    return;
  }

  const startTime = Date.now();

  // Fetch transactions with pagination
  const transactionsRes = authenticatedRequest(
    'GET',
    `${SUPABASE_URL}/rest/v1/transactions?select=*&limit=50&order=occurred_at.desc`,
    token
  );

  const duration = Date.now() - startTime;
  transactionDuration.add(duration);

  const success = check(transactionsRes, {
    'transactions status is 200': (r) => r.status === 200,
    'transactions response time < 2s': (r) => r.timings.duration < 2000,
    'transactions have data': (r) => {
      try {
        const data = JSON.parse(r.body);
        return Array.isArray(data);
      } catch {
        return false;
      }
    },
  });

  if (!success) {
    errorRate.add(1);
  }

  sleep(1);
}

// ============================================================================
// Scenario 3: Groups List
// ============================================================================

export function groupsList() {
  const user = testUsers[__VU % testUsers.length];
  const token = getAuthToken(user.email, user.password);

  if (!token) {
    errorRate.add(1);
    return;
  }

  const startTime = Date.now();

  const groupsRes = authenticatedRequest(
    'GET',
    `${SUPABASE_URL}/rest/v1/groups?select=*&limit=100`,
    token
  );

  const duration = Date.now() - startTime;
  transactionDuration.add(duration);

  const success = check(groupsRes, {
    'groups status is 200': (r) => r.status === 200,
    'groups response time < 1s': (r) => r.timings.duration < 1000,
  });

  if (!success) {
    errorRate.add(1);
  }

  sleep(1);
}

// ============================================================================
// Scenario 4: Members List
// ============================================================================

export function membersList() {
  const user = testUsers[__VU % testUsers.length];
  const token = getAuthToken(user.email, user.password);

  if (!token) {
    errorRate.add(1);
    return;
  }

  const startTime = Date.now();

  const membersRes = authenticatedRequest(
    'GET',
    `${SUPABASE_URL}/rest/v1/members?select=*&limit=100`,
    token
  );

  const duration = Date.now() - startTime;
  transactionDuration.add(duration);

  const success = check(membersRes, {
    'members status is 200': (r) => r.status === 200,
    'members response time < 1s': (r) => r.timings.duration < 1000,
  });

  if (!success) {
    errorRate.add(1);
  }

  sleep(1);
}

// ============================================================================
// Scenario 5: Transaction Allocation
// ============================================================================

export function transactionAllocation() {
  const user = testUsers[__VU % testUsers.length];
  const token = getAuthToken(user.email, user.password);

  if (!token) {
    errorRate.add(1);
    return;
  }

  // First, get an unallocated transaction
  const transactionsRes = authenticatedRequest(
    'GET',
    `${SUPABASE_URL}/rest/v1/transactions?select=id&allocation_status=eq.unallocated&limit=1`,
    token
  );

  if (transactionsRes.status !== 200) {
    errorRate.add(1);
    return;
  }

  const transactions = JSON.parse(transactionsRes.body);
  if (transactions.length === 0) {
    // No unallocated transactions, skip this iteration
    sleep(1);
    return;
  }

  const transactionId = transactions[0].id;

  // Get a member to allocate to
  const membersRes = authenticatedRequest(
    'GET',
    `${SUPABASE_URL}/rest/v1/members?select=id&limit=1`,
    token
  );

  if (membersRes.status !== 200) {
    errorRate.add(1);
    return;
  }

  const members = JSON.parse(membersRes.body);
  if (members.length === 0) {
    errorRate.add(1);
    return;
  }

  const memberId = members[0].id;

  // Allocate transaction
  const startTime = Date.now();
  const allocateRes = authenticatedRequest(
    'POST',
    `${SUPABASE_URL}/rest/v1/rpc/allocate_transaction`,
    token,
    {
      transaction_id: transactionId,
      member_id: memberId,
    }
  );

  const duration = Date.now() - startTime;
  transactionDuration.add(duration);

  const success = check(allocateRes, {
    'allocation status is 200 or 201': (r) => r.status === 200 || r.status === 201,
    'allocation response time < 3s': (r) => r.timings.duration < 3000,
  });

  if (!success) {
    errorRate.add(1);
  }

  sleep(2);
}

// ============================================================================
// Scenario 6: Reports Generation
// ============================================================================

export function reportsGeneration() {
  const user = testUsers[__VU % testUsers.length];
  const token = getAuthToken(user.email, user.password);

  if (!token) {
    errorRate.add(1);
    return;
  }

  const startTime = Date.now();

  // Generate report for last 30 days
  const dateFrom = new Date();
  dateFrom.setDate(dateFrom.getDate() - 30);
  const dateTo = new Date();

  const reportRes = authenticatedRequest(
    'POST',
    `${SUPABASE_URL}/rest/v1/rpc/get_report_ledger`,
    token,
    {
      date_from: dateFrom.toISOString(),
      date_to: dateTo.toISOString(),
      scope: 'institution',
    }
  );

  const duration = Date.now() - startTime;
  transactionDuration.add(duration);

  const success = check(reportRes, {
    'report status is 200': (r) => r.status === 200,
    'report response time < 5s': (r) => r.timings.duration < 5000,
  });

  if (!success) {
    errorRate.add(1);
  }

  sleep(3);
}

// ============================================================================
// Scenario 7: Search Operations
// ============================================================================

export function searchOperations() {
  const user = testUsers[__VU % testUsers.length];
  const token = getAuthToken(user.email, user.password);

  if (!token) {
    errorRate.add(1);
    return;
  }

  const searchTerms = ['test', 'group', 'member', 'transaction', 'MOMO'];

  const searchTerm = searchTerms[__VU % searchTerms.length];
  const startTime = Date.now();

  // Search transactions
  const searchRes = authenticatedRequest(
    'GET',
    `${SUPABASE_URL}/rest/v1/transactions?select=*&or=(reference.ilike.*${searchTerm}*,payer_name.ilike.*${searchTerm}*)&limit=20`,
    token
  );

  const duration = Date.now() - startTime;
  transactionDuration.add(duration);

  const success = check(searchRes, {
    'search status is 200': (r) => r.status === 200,
    'search response time < 2s': (r) => r.timings.duration < 2000,
  });

  if (!success) {
    errorRate.add(1);
  }

  sleep(1);
}

// ============================================================================
// Main Test Function
// ============================================================================

export default function () {
  // Run different scenarios based on VU (Virtual User) ID
  const scenario = __VU % 7;

  switch (scenario) {
    case 0:
      dashboardLoad();
      break;
    case 1:
      transactionsList();
      break;
    case 2:
      groupsList();
      break;
    case 3:
      membersList();
      break;
    case 4:
      transactionAllocation();
      break;
    case 5:
      reportsGeneration();
      break;
    case 6:
      searchOperations();
      break;
    default:
      dashboardLoad();
  }
}

// ============================================================================
// Setup and Teardown
// ============================================================================

export function setup() {
  // Setup: Create test users if needed, prepare test data
  console.log('Load test setup: Preparing test environment...');
  return {
    timestamp: new Date().toISOString(),
  };
}

export function teardown(data) {
  // Teardown: Clean up test data if needed
  console.log(`Load test teardown: Test completed at ${data.timestamp}`);
}
