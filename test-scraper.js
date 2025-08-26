const { scrapePage } = require('./src/scraper');

async function runTests() {
  console.log('Starting scraper tests...\n');

  // Test 1: Valid URL (example.com)
  console.log('TEST 1: Testing with https://example.com');
  console.log('----------------------------------------');
  const startTime = Date.now();
  const result1 = await scrapePage('https://example.com');
  const duration1 = Date.now() - startTime;
  
  console.log(`\nResult:`, result1);
  console.log(`Execution time: ${duration1}ms`);
  console.log(`Test 1 complete.\n`);

  // Test 2: Invalid URL
  console.log('TEST 2: Testing with https://invalid.url');
  console.log('----------------------------------------');
  const startTime2 = Date.now();
  const result2 = await scrapePage('https://invalid.url');
  const duration2 = Date.now() - startTime2;
  
  console.log(`\nResult:`, result2);
  console.log(`Execution time: ${duration2}ms`);
  console.log(`Test 2 complete.\n`);

  console.log('All tests completed!');
  console.log('Note: Robots disallowed test is not testable with current stub.');
  
  // Verify total execution time for example.com is under 10 seconds
  if (duration1 < 10000) {
    console.log('✓ Example.com execution time is under 10 seconds');
  } else {
    console.log('✗ Example.com execution time exceeds 10 seconds');
  }
}

runTests().catch(err => {
  console.error('Test script error:', err);
});
