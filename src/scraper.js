const axios = require('axios');
const { JSDOM } = require('jsdom');
const { checkRobots } = require('./utils/robotsChecker');

async function scrapePage(url) {
  console.log(`Requesting ${url}...`);
  
  try {
    // Check robots.txt compliance
    const isAllowed = await checkRobots(url);
    console.log(`Robots check: ${isAllowed}`);
    
    if (!isAllowed) {
      return null;
    }
    
    // Enforce 1-second delay between requests after robots check
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Fetch the URL with axios as text to ensure response.data is a string
    const response = await axios.get(url, { 
      validateStatus: () => true,
      responseType: 'text'
    });
    
    // Check if response status is not 200
    if (response.status !== 200) {
      return null;
    }
    
    // Check if response data is empty or not a string
    const html = response.data;
    if (!html || typeof html !== 'string') {
      return { title: "", links: [] };
    }
    
    // Parse HTML with jsdom (wrapped in inner try to handle malformed HTML)
    let document;
    try {
      const dom = new JSDOM(html, { url });
      document = dom.window.document;
    } catch (parseError) {
      return { title: "", links: [] };
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
    // Handle all other errors including network issues, URL parsing errors, etc.
    return null;
  }
}

module.exports = { scrapePage };
