const { scrapePage } = require('./scraper');

async function runTests() {
  console.log('Starting scraper tests...\n');

  // Test 1: Valid URL
  console.log('Test 1: Valid URL');
  const result1 = await scrapePage('https://example.com');
  console.log('Result:', result1);
  console.log('Title present:', !!result1?.title);
  console.log('Has links array:', Array.isArray(result1?.links));
  console.log('Links length <= 3:', result1?.links?.length <= 3);
  console.log('All links are absolute URLs:', result1?.links?.every(url => /^https?:\/\//.test(url)));
  console.log('');

  // Test 2: Invalid URL
  console.log('Test 2: Invalid URL');
  const result2 = await scrapePage('https://invalid.url');
  console.log('Result:', result2);
  console.log('');

  console.log('Tests completed.');
}

runTests().catch(console.error);
