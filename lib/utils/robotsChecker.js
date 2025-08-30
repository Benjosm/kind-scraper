const axios = require('axios');

/**
 * Parses robots.txt content to determine if a given path is disallowed by the wildcard user agent.
 * 
 * @param {string} robotsText - The raw content of robots.txt
 * @param {string} pathname - The URL path to check
 * @returns {boolean} - true if allowed, false if disallowed
 */
function checkRobots(robotsText, pathname) {
  const lines = robotsText.split('\n');
  let isStarUserAgent = false;
  const disallows = [];

  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip comments and empty lines
    if (trimmedLine === '' || trimmedLine.startsWith('#')) {
      continue;
    }

    const lowerLine = trimmedLine.toLowerCase();
    
    if (lowerLine.startsWith('user-agent:')) {
      const userAgent = trimmedLine.split(':')[1].trim();
      isStarUserAgent = (userAgent === '*');
    } else if (isStarUserAgent && lowerLine.startsWith('disallow:')) {
      const path = trimmedLine.split(':')[1].trim();
      if (path !== '') {
        disallows.push(path);
      }
    }
  }

  // Check if path starts with any disallowed prefix
  for (const disallow of disallows) {
    if (pathname.startsWith(disallow)) {
      return false;
    }
  }

  return true;
}

/**
 * Checks if a given URL is allowed by the website's robots.txt rules.
 * Returns true if access is permitted or if an error occurs during the check.
 * 
 * @param {string} url - The full URL to check
 * @returns {Promise<boolean>} - true if allowed, false if disallowed
 */
async function checkRobotsPermission(url) {
  try {
    const parsedUrl = new URL(url);
    const origin = parsedUrl.origin;
    const pathname = parsedUrl.pathname;

    const robotsUrl = `${origin}/robots.txt`;
    const response = await axios.get(robotsUrl);

    return checkRobots(response.data, pathname);
  } catch (error) {
    // If there's any error (network issue, 404, timeout, etc.), allow access
    return true;
  }
}

module.exports = { checkRobotsPermission, checkRobots };
