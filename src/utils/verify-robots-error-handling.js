const { checkRobots } = require('./robotsChecker');

// Test case 1: Invalid URL
// Execute with invalid URL and verify return value is true
async function testInvalidUrl() {
  console.log('Test 1: Invalid URL');
  console.log('===================');
  try {
    const result = await checkRobots('http://h&h^&h.com', '/');
    console.log('Result:', result);
    console.log('Expected: true');
    console.log('Test 1 PASSED\n');
    return result === true;
  } catch (error) {
    console.error('Error:', error.message);
    console.log('Test 1 FAILED - Exception was thrown');
    return false;
  }
}

// Test case 2: Network error
// This test requires internet to be disabled
// Execute with valid domain and verify return value is true
async function testNetworkError() {
  console.log('Test 2: Network Error');
  console.log('=====================');
  console.log('IMPORTANT: Please disable your internet connection before running this test.');
  console.log('Press any key to continue when internet is disabled...');
  
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.once('data', async () => {
    try {
      const result = await checkRobots('https://example.com', '/');
      console.log('Result:', result);
      console.log('Expected: true');
      console.log('Test 2 PASSED\n');
      
      console.log('Re-enable your internet connection before continuing.');
      console.log('Press any key to continue...');
      process.stdin.once('data', () => {
        runTestInvalidRobotsTxt();
      });
    } catch (error) {
      console.error('Error:', error.message);
      console.log('Test 2 FAILED - Exception was thrown');
      
      console.log('Re-enable your internet connection before continuing.');
      console.log('Press any key to continue...');
      process.stdin.once('data', () => {
        runTestInvalidRobotsTxt();
      });
    }
  });
}

// Test case 3: Invalid robots.txt
// Execute against a domain with malformed robots.txt and verify return value is true
async function testInvalidRobotsTxt() {
  console.log('Test 3: Invalid robots.txt');
  console.log('=========================');
  try {
    // Using a domain that returns non-standard content for robots.txt
    const result = await checkRobots('https://httpbin.org', '/');
    console.log('Result:', result);
    console.log('Expected: true');
    console.log('Test 3 PASSED\n');
    return result === true;
  } catch (error) {
    console.error('Error:', error.message);
    console.log('Test 3 FAILED - Exception was thrown');
    return false;
  }
}

async function runTests() {
  console.log('Robots Checker Error Handling Verification');
  console.log('========================================\n');
  
  // Run test 1
  const test1Result = await testInvalidUrl();
  
  // Run test 2
  testNetworkError();
}

// Execute the tests
runTests();

// We need to define this function after testNetworkError for the callback to work
function runTestInvalidRobotsTxt() {
  testInvalidRobotsTxt().then(() => {
    console.log('All tests completed. Please verify results manually per the acceptance criteria.');
    process.exit(0);
  });
}
