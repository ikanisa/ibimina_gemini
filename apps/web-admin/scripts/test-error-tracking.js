/**
 * Error Tracking Test Script
 * 
 * This script can be run in the browser console to test error tracking.
 * It simulates various error scenarios to verify Sentry integration.
 * 
 * Usage:
 * 1. Open browser console on the application
 * 2. Copy and paste this script
 * 3. Run each test function
 * 4. Check Sentry dashboard for captured errors
 */

// Test 1: Test manual error capture
function testManualErrorCapture() {
  console.log('Testing manual error capture...');
  
  try {
    // Import Sentry captureError function
    import('/lib/sentry').then(({ captureError }) => {
      const testError = new Error('Test manual error capture');
      captureError(testError, {
        test: true,
        timestamp: new Date().toISOString(),
        source: 'manual_test'
      });
      console.log('✅ Error captured - check Sentry dashboard');
    }).catch(err => {
      console.error('Failed to import Sentry:', err);
    });
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Test 2: Test React error boundary
function testReactErrorBoundary() {
  console.log('Testing React error boundary...');
  console.log('Note: This will trigger an error boundary');
  
  // This will be caught by ErrorBoundary component
  throw new Error('Test React error boundary');
}

// Test 3: Test async error
function testAsyncError() {
  console.log('Testing async error...');
  
  setTimeout(() => {
    const error = new Error('Test async error');
    import('/lib/sentry').then(({ captureError }) => {
      captureError(error, {
        test: true,
        type: 'async',
        timestamp: new Date().toISOString()
      });
      console.log('✅ Async error captured - check Sentry dashboard');
    });
  }, 1000);
}

// Test 4: Test network error (should be filtered)
function testNetworkError() {
  console.log('Testing network error (should be filtered)...');
  
  const error = new Error('Network request failed');
  import('/lib/sentry').then(({ captureError }) => {
    captureError(error, {
      test: true,
      type: 'network',
      timestamp: new Date().toISOString()
    });
    console.log('⚠️  Network error - should be filtered by beforeSend');
  });
}

// Test 5: Test user context
function testUserContext() {
  console.log('Testing user context...');
  
  import('/lib/sentry').then(({ setUser }) => {
    setUser({
      id: 'test-user-id',
      email: 'test@example.com',
      institutionId: 'test-institution-id'
    });
    console.log('✅ User context set - check Sentry dashboard');
    
    // Trigger an error to see user context
    const error = new Error('Test error with user context');
    import('/lib/sentry').then(({ captureError }) => {
      captureError(error, {
        test: true,
        type: 'user_context',
        timestamp: new Date().toISOString()
      });
    });
  });
}

// Test 6: Test breadcrumbs
function testBreadcrumbs() {
  console.log('Testing breadcrumbs...');
  
  import('/lib/sentry').then(({ addBreadcrumb, captureError }) => {
    addBreadcrumb('User clicked button', 'user_action', {
      button: 'test-button',
      page: 'test-page'
    });
    
    addBreadcrumb('API call made', 'api', {
      endpoint: '/api/test',
      method: 'GET'
    });
    
    // Trigger an error to see breadcrumbs
    const error = new Error('Test error with breadcrumbs');
    captureError(error, {
      test: true,
      type: 'breadcrumbs',
      timestamp: new Date().toISOString()
    });
    console.log('✅ Breadcrumbs added - check Sentry dashboard');
  });
}

// Test 7: Test Web Vitals tracking
function testWebVitals() {
  console.log('Testing Web Vitals tracking...');
  console.log('Note: Web Vitals are automatically tracked on page load');
  console.log('Check Sentry dashboard for Web Vitals metrics');
  console.log('Metrics: CLS, FCP, LCP, TTFB');
}

// Test 8: Test error with tags
function testErrorWithTags() {
  console.log('Testing error with tags...');
  
  import('@sentry/react').then((Sentry) => {
    Sentry.withScope((scope) => {
      scope.setTag('test', 'true');
      scope.setTag('environment', 'testing');
      scope.setLevel('error');
      
      const error = new Error('Test error with tags');
      Sentry.captureException(error);
      console.log('✅ Error with tags captured - check Sentry dashboard');
    });
  });
}

// Test 9: Test performance monitoring
function testPerformanceMonitoring() {
  console.log('Testing performance monitoring...');
  
  import('@sentry/react').then((Sentry) => {
    const transaction = Sentry.startTransaction({
      name: 'test-transaction',
      op: 'test'
    });
    
    // Simulate some work
    setTimeout(() => {
      transaction.finish();
      console.log('✅ Performance transaction captured - check Sentry dashboard');
    }, 100);
  });
}

// Test 10: Test session replay (if enabled)
function testSessionReplay() {
  console.log('Testing session replay...');
  console.log('Note: Session replay is automatically enabled');
  console.log('Check Sentry dashboard for session replays');
  console.log('Replays are captured on errors (100%) and random sessions (10%)');
}

// Export all test functions
console.log(`
=== Sentry Error Tracking Tests ===

Available test functions:
1. testManualErrorCapture() - Test manual error capture
2. testReactErrorBoundary() - Test React error boundary (will trigger error)
3. testAsyncError() - Test async error capture
4. testNetworkError() - Test network error (should be filtered)
5. testUserContext() - Test user context setting
6. testBreadcrumbs() - Test breadcrumb tracking
7. testWebVitals() - Check Web Vitals tracking
8. testErrorWithTags() - Test error with custom tags
9. testPerformanceMonitoring() - Test performance monitoring
10. testSessionReplay() - Check session replay

Usage:
- Run individual tests: testManualErrorCapture()
- Run all tests: runAllTests()
`);

// Run all tests
function runAllTests() {
  console.log('Running all Sentry tests...');
  console.log('Note: Some tests will trigger errors - this is expected');
  
  testManualErrorCapture();
  setTimeout(() => testAsyncError(), 2000);
  setTimeout(() => testUserContext(), 4000);
  setTimeout(() => testBreadcrumbs(), 6000);
  setTimeout(() => testErrorWithTags(), 8000);
  setTimeout(() => testPerformanceMonitoring(), 10000);
  
  console.log('✅ All tests initiated - check Sentry dashboard');
}
