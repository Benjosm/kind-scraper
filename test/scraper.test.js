const { scrapePage } = require('../src/scraper');

async function runTests() {
  console.log('=== Testing scrapePage with https://example.com ===');
  const result1 = await scrapePage('https://example.com');
  console.log('Result:', result1);
  
  console.log('\n=== Testing scrapePage with invalid URL ===');
  const result2 = await scrapePage('https://invalid.url');
  console.log('Result:', result2);
  
  console.log('\n=== Performance test with ~1s delay ===');
  const startTime = Date.now();
  const result3 = await scrapePage('https://example.com');
  const endTime = Date.now();
  const duration = endTime - startTime;
  console.log(`Execution time: ${duration}ms`);
  console.log('Result:', result3);
}

runTests().catch(console.error);
