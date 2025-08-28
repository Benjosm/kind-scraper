const axios = require('axios');
const { JSDOM } = require('jsdom');
const { checkRobots } = require('./utils/robotsChecker');

/**
 * Scrapes a web page while respecting robots.txt rules.
 * 
 * This function performs web scraping using axios for HTTP requests and jsdom for DOM parsing.
 * It first checks robots.txt compliance using {@link checkRobots}, enforces a 1-second delay between requests,
 * and then extracts data from the page. The function validates the URL format, checks HTTP response status,
 * and handles HTML parsing errors.
 * 
 * @param {string} url - The URL of the page to scrape
 * @param {Object} [options] - Configuration for the scrape (e.g., headers, timeout)
 * @returns {Promise<Object|null>} Promise that resolves to an object containing scraped data
 * (e.g., title, links) or null if scraping is disallowed or fails. The returned object has
 * properties: title (string) and links (array of up to 3 absolute URLs).
 * @example
 * // Basic successful call
 * scrapePage('https://example.com')
 *   .then(data => console.log(data))
 *   .catch(err => console.error('Scraping failed:', err));
 * 
 * @example
 * // Handling robots.txt denial
 * scrapePage('https://example.com/private', { headers: { 'User-Agent': 'MyBot' }, timeout: 10000 })
 *   .then(data => console.log('Scraped data:', data))
 *   .catch(err => {
 *     if (err.message.includes('Scraping disallowed')) {
 *       console.error('Blocked by robots.txt:', err.message);
 *     } else {
 *       console.error('Scraping failed due to:', err.message);
 *     }
 *   });
 *
 * @throws {Error} If the URL is invalid (e.g., malformed URL).
 * @throws {Error} If the network request fails (e.g., timeout, 404, or other axios errors).
 * @throws {Error} If access is denied by robots.txt (via {@link checkRobots}).
 * @see {@link checkRobots}
 * @see External libraries: axios for HTTP requests and jsdom for DOM parsing.
 */
async function scrapePage(url) {
  // Validate URL format before making any requests
  try {
    new URL(url);
  } catch (error) {
    throw new Error(`Invalid URL: ${url}`);
  }

  // Check robots.txt compliance first
  const isAllowed = await checkRobots(url);
  if (!isAllowed) {
    throw new Error(`Scraping disallowed for ${url}`);
  }

  try {
    // Enforce 1-second delay between requests after robots check
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Fetch the URL with axios as text to ensure response.data is a string
    // with the required User-Agent header
    const response = await axios.get(url, {
      headers: { 'User-Agent': 'KindWebScraper' },
      responseType: 'text'
    });

    // Check if response status is not 200
    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Check if response data is empty or not a string
    const html = response.data;
    if (!html || typeof html !== 'string') {
      throw new Error("Empty or invalid HTML content received");
    }

    // Parse HTML with jsdom (wrapped in inner try to handle malformed HTML)
    let document;
    try {
      const dom = new JSDOM(html, { url });
      document = dom.window.document;
    } catch (parseError) {
      throw new Error("Failed to parse HTML content");
    }

    // Extract title
    const title = document.title || "";

    // Extract up to first 3 links
    const linkElements = document.querySelectorAll('a');
    const seenLinks = new Set();
    const links = [];
    let count = 0;
    for (const element of linkElements) {
      if (count >= 3) break;
      const href = element.getAttribute('href');
      if (href) {
        try {
          // Resolve relative URLs to absolute
          const absoluteUrl = new URL(href, url).href;
          if (!seenLinks.has(absoluteUrl)) {
            seenLinks.add(absoluteUrl);
            links.push(absoluteUrl);
            count++;
          }
        } catch (err) {
          // Skip invalid URLs
          continue;
        }
      }
    }

    return { title, links };
  } catch (error) {
    // Re-throw the error to be handled by the caller
    throw error;
  }
}

module.exports = { scrapePage };
