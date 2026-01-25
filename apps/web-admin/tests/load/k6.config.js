/**
 * k6 Load Testing Configuration
 * 
 * Install k6: https://k6.io/docs/getting-started/installation/
 * Run: k6 run tests/load/scenarios.js
 */

export const options = {
  // Test stages - ramp up to 1000 concurrent users
  stages: [
    { duration: '2m', target: 100 },   // Ramp up to 100 users over 2 minutes
    { duration: '5m', target: 100 },   // Stay at 100 users for 5 minutes
    { duration: '2m', target: 500 },    // Ramp up to 500 users over 2 minutes
    { duration: '5m', target: 500 },    // Stay at 500 users for 5 minutes
    { duration: '2m', target: 1000 },  // Ramp up to 1000 users over 2 minutes
    { duration: '10m', target: 1000 }, // Stay at 1000 users for 10 minutes
    { duration: '2m', target: 0 },     // Ramp down to 0 users over 2 minutes
  ],

  // Performance thresholds
  thresholds: {
    // HTTP request duration
    http_req_duration: ['p(95)<2000', 'p(99)<5000'], // 95% of requests < 2s, 99% < 5s
    http_req_failed: ['rate<0.01'], // Error rate < 1%
    
    // Iteration duration (time to complete one scenario)
    iteration_duration: ['p(95)<5000'],
    
    // Data received/sent
    data_received: ['rate>0'],
    data_sent: ['rate>0'],
  },

  // Summary statistics
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)', 'p(99.9)', 'p(99.99)'],
};
