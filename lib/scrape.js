const axios = require('axios');
const { JSDOM } = require('jsdom');
const { checkRobots } = require('./robots-check');

/**
 * Scrapes a webpage and extracts relevant data.
 * @param {string} url - The URL of the webpage to scrape.
 * @returns {Promise<{title: string, links: string[]}>} Promise that resolves to an object containing scraped data (e.g., title, links).
 * @throws {Error} If the provided URL is invalid.
 * @throws {Error} If access to the URL is disallowed by robots.txt.
 * @throws {Error} If a network error occurs during the HTTP request.
 * @throws {Error} If the HTTP response status is not 200.
 * @throws {Error} If the response contains empty or non-string HTML content.
 * @throws {Error} If the HTML content cannot be parsed.
 */
async function scrapePage(url) {
  // Validate URL format
  try {
    new URL(url);
  } catch (error) {
    throw new Error(`Invalid URL: ${url}`);
  }
  
  // Check robots.txt compliance
  if (!(await checkRobots(url))) {
    throw new Error("Robots.txt disallowed");
  }
  
  console.log("Requesting...");
  
  // Add ethical delay before making request
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  console.log("Processing...");

  try {
    // Fetch the URL with axios
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
      throw new Error("Received empty or invalid content");
    }
    
    // Parse HTML with jsdom
    const dom = new JSDOM(html, { url });
    const document = dom.window.document;

    // Extract title
    const title = document.title || "";

    // Extract up to first 3 unique links
    const linkElements = document.querySelectorAll('a[href]');
    const seenLinks = new Set();
    const links = [];
    for (const element of linkElements) {
      if (links.length >= 3) break;
      const href = element.getAttribute('href');
      if (href) {
        try {
          // Resolve relative URLs to absolute
          const absoluteUrl = new URL(href, url).href;
          if (!seenLinks.has(absoluteUrl)) {
            seenLinks.add(absoluteUrl);
            links.push(absoluteUrl);
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
    throw error;
  }
}

module.exports = { scrapePage };
