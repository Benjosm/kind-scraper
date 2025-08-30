const axios = require('axios');
const { JSDOM } = require('jsdom');
const { checkRobots } = require('./robots-check');

/**
 * Scrapes a webpage and extracts relevant data.
 * @param {string} url - The URL of the webpage to scrape.
 * @param {Object} [options={}] - Configuration options for the HTTP request.
 * @param {Object} [options.headers] - HTTP headers to include with the request. Merged with default headers (including 'User-Agent': 'KindWebScraper'), with user-specified headers taking precedence.
 * @param {string} [options.responseType="text"] - Expected response type from the server. Must be 'text' to ensure HTML content is received as a string; other values may cause parsing errors.
 * @param {number} [options.timeout=5000] - Request timeout duration in milliseconds (default: 5000).
 * @returns {Promise<{title: string, links: string[]}>} Promise that resolves to an object containing scraped data (e.g., title, links).
 * @throws {Error} If the provided URL is invalid (malformed).
 * @throws {Error} If access to the URL is disallowed by robots.txt.
 * @throws {Error} If a network error occurs during the HTTP request (e.g., connection timeout, DNS failure).
 * @throws {Error} If the HTTP response status is not 200 (e.g., 404 or 500 error).
 * @throws {Error} If the response contains empty or non-string HTML content.
 * @throws {Error} If the HTML content cannot be parsed (e.g., due to malformed structure).
 * 
 * @example
 * Basic usage without options:
 * ```js
 * const result = await scrapePage("https://example.com");
 * console.log(result.title);
 * ```
 * 
 * @example
 * Advanced usage with custom headers and timeout:
 * ```js
 * const result = await scrapePage("https://example.com", {
 *   headers: {
 *     "Custom-Header": "Value",
 *     "User-Agent": "MyScraper/1.0"
 *   },
 *   timeout: 10000
 * });
 * console.log(result.links);
 * ```
 */
async function scrapePage(url, options = {}) {
  // Validate URL format before making any requests
  try {
    new URL(url);
  } catch (error) {
    console.error(`Invalid URL: ${url}. Error: ${error.message}`);
    return { title: '', links: [] };
  }
  
  // Check robots.txt compliance first
  const isAllowed = await checkRobots(url);
  if (!isAllowed) {
    throw new Error(`Scraping disallowed by robots.txt for ${url}.`);
  }
  
  console.log("Requesting...");
  
  try {
    // Add 1-second delay before each request after robots check
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log("Processing...");

    // Fetch the URL with axios as text to ensure response.data is a string
    // with the required User-Agent header
    // Merge provided options with defaults
    const defaultOptions = {
      headers: { 'User-Agent': 'KindWebScraper' },
      responseType: 'text',
      timeout: 5000 // Default 5-second timeout
    };
    const finalOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...options.headers
      }
    };
    
    const response = await axios.get(url, finalOptions);

    // Check if response status is not 200
    if (response.status !== 200) {
      throw new Error(`Unable to retrieve content from the website. Received HTTP ${response.status}: ${response.statusText}. Check the URL and try again.`);
    }
    
    // Check if response data is empty or not a string
    const html = response.data;
    if (!html || typeof html !== 'string') {
      throw new Error("Received empty or invalid content from the website. The page might be protected or experiencing issues.");
    }
    
    // Parse HTML with jsdom (wrapped in inner try to handle malformed HTML)
    let document;
    try {
      const dom = new JSDOM(html, { url });
      document = dom.window.document;
    } catch (parseError) {
      throw new Error("Unable to process the webpage content. The HTML might be malformed or incompatible.");
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
    console.error(`Error during scraping: ${error.message}`);
    return { title: '', links: [] };
  }
}

module.exports = { scrapePage };

// Manual test for checkRobots function
checkRobots('https://example.com/').then(result => console.log('Robots check result:', result));
