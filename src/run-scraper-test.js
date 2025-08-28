const { scrapePage } = require('./scraper.js');

(async () => {
  // Verify disallowed URL handling
  try {
    await scrapePage('http://httpbin.org/deny');
    console.error('❌ Expected scrape to fail for disallowed URL.');
    process.exit(1);
  } catch (error) {
    const expectedError = 'Scraping disallowed for http://httpbin.org/deny';
    if (error.message !== expectedError) {
      console.error(
        `❌ Incorrect error message. Expected: "${expectedError}"\nReceived: "${error.message}"`
      );
      process.exit(1);
    }
    console.log('✅ Disallowed URL correctly blocked with expected error message');
  }

  // Verify allowed URL succeeds
  try {
    const result = await scrapePage('https://example.com');
    if (!result || !result.title) {
      console.error('❌ Allowed URL scrape returned invalid data structure');
      process.exit(1);
    }
    console.log('✅ Allowed URL scraped successfully with valid data');
  } catch (error) {
    console.error(`❌ Unexpected error when scraping allowed URL: ${error.message}`);
    process.exit(1);
  }

  // Verify backward compatibility with compliant URLs
  try {
    const result = await scrapePage('https://example.com');
    if (!result || !result.title) {
      console.error('❌ Compliant URL scrape returned invalid data');
      process.exit(1);
    }
    console.log('✅ Compliant URL (example.com) scraped successfully');
  } catch (error) {
    console.error(`❌ Unexpected error with compliant URL: ${error.message}`);
    process.exit(1);
  }

  console.log('\n🚀 All robots.txt compliance checks passed!');
  process.exit(0);
})();
