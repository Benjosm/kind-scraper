const { scrapePage } = require('./scraper.js');

(async () => {
  console.log('Starting scraper test...');
  const result = await scrapePage('https://example.com');
  console.log('Scrape result:', result);
})();
