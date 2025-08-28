const { scrapePage } = require('../../src/scraper');

console.log("Starting robots.txt compliance test...");
scrapePage('https://example.com')
  .then(result => {
    console.log("Scraping succeeded:", result);
    console.log("TEST_STATUS_SUCCESS");
  })
  .catch(error => {
    console.error("Scraping failed:", error.message);
    console.log("TEST_STATUS_FAILURE");
  });
