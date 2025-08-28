const axios = require('axios');
const { JSDOM } = require('jsdom');
const { checkRobots } = require('./utils/robotsChecker');

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
    throw new Error("Robots.txt compliance check failed. Scraping not allowed.");
  }

  try {
    console.log("Requesting...");
    
    // Enforce 1-second delay between requests after robots check
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log("Processing...");
    
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
