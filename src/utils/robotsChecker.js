const robotsParser = require('robots-parser');

module.exports.checkRobots = async (url) => {
  try {
    // Parse the URL to get the origin (protocol + domain)
    const urlObj = new URL(url);
    const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;

    // Fetch robots.txt content
    const response = await fetch(robotsUrl);
    if (!response.ok) {
      // If robots.txt not found or server error, allow scraping (default behavior)
      return true;
    }
    const robotsTxt = await response.text();

    // Parse robots.txt
    const robots = robotsParser(robotsUrl, robotsTxt);

    // Check if scraping is allowed for user agent 'KindScrape' or '*'
    const allowed = robots.isAllowed(url, 'KindScrape') || robots.isAllowed(url, '*');
    return allowed;
  } catch (error) {
    // If any error occurs (e.g., network issue), default to allowing scraping
    console.warn('Error checking robots.txt, defaulting to allowed:', error.message);
    return true;
  }
};
