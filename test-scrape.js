const { scrapePage } = require('./lib/scrape');
const url = process.argv[2] || 'https://example.com';
const startTime = Date.now();
scrapePage(url)
  .then(result => {
    console.log(JSON.stringify(result, null, 2));
    console.error(`Runtime: ${Date.now() - startTime}ms`);
  })
  .catch(err => console.error("Scrape failed:", err.message));
