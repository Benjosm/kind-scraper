const { checkRobotsPermission } = require('../../lib/utils/robotsChecker');
const axios = require('axios');

// Save the original get method
const originalGet = axios.get;

// Test cases
const scenarios = [
  {
    description: 'Disallowed path (should return false)',
    content: 'Disallow: /private',
    pathname: '/private/file',
    expected: false,
    error: false
  },
  {
    description: 'Allowed path (no matching Disallow, should return true)',
    content: 'Disallow: /other',
    pathname: '/allowed/page',
    expected: true,
    error: false
  },
  {
    description: 'Empty robots.txt (200 OK, should return true)',
    content: '',
    pathname: '/any/path',
    expected: true,
    error: false
  },
  {
    description: 'Non-matching Disallow with trailing slash (should return true)',
    pathname: '/blog-post',
    content: 'Disallow: /blog/',
    expected: true,
    error: false
  },
  {
    description: 'robots.txt 404 error (should return true)',
    pathname: '/any/path',
    expected: true,
    error: true
  }
];

// Execute tests
(async () => {
  for (const [index, test] of scenarios.entries()) {
    try {
      // Mock the response for example.com/robots.txt
      axios.get = (url) => {
        if (url === 'http://example.com/robots.txt') {
          if (test.error) {
            return Promise.reject(new Error('Network error'));
          }
          return Promise.resolve({ data: test.content });
        }
        return originalGet(url);
      };

      const url = 'http://example.com' + test.pathname;
      const result = await checkRobotsPermission(url);
      const passed = result === test.expected;
      
      console.log(`Test ${index + 1}: ${test.description}`);
      console.log(`  URL: ${url}`);
      console.log(`  Expected: ${test.expected}, Got: ${result}`);
      console.log(`  Result: ${passed ? 'PASS' : 'FAIL'}`);
      if (!passed) {
        console.error(`  ERROR: Expected ${test.expected} but got ${result}\n`);
      } else {
        console.log('');
      }
    } catch (error) {
      // This should not happen as checkRobotsPermission should catch all errors
      console.error(`Test ${index + 1} threw unexpected error:`, error.message);
    } finally {
      // Restore original get method
      axios.get = originalGet;
    }
  }

  // Verify return types are booleans
  console.log('Verifying return types are booleans:');
  for (const [index, test] of scenarios.entries()) {
    try {
      // Set up mock
      axios.get = (url) => {
        if (url === 'http://example.com/robots.txt') {
          if (test.error) {
            return Promise.reject(new Error('Network error'));
          }
          return Promise.resolve({ data: test.content });
        }
        return originalGet(url);
      };

      const url = 'http://example.com' + test.pathname;
      const result = await checkRobotsPermission(url);
      console.log(`  Test ${index + 1} returns ${typeof result} (${result})`);
    } catch (error) {
      // Should not happen
      console.error(`Type verification for test ${index + 1} failed:`, error);
    } finally {
      axios.get = originalGet;
    }
  }

  console.log('\nValidation complete. Check output for PASS/FAIL results.');
  process.exit(0);
})();
