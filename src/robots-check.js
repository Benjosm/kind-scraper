const { checkRobots: checkRobotsInChecker } = require('./utils/robotsChecker');

async function checkRobots(url) {
  try {
    const urlObj = new URL(url);
    const origin = urlObj.origin;
    const pathname = urlObj.pathname;

    const robotsUrl = `${origin}/robots.txt`;
    const response = await fetch(robotsUrl);

    // Handle 404 as allowed (no restrictions)
    if (response.status === 404) {
      return true;
    }

    // Handle other non-OK responses as errors
    if (!response.ok) {
      throw new Error(`Failed to fetch robots.txt: ${response.status} ${response.statusText}`);
    }

    const content = await response.text();
    return checkRobotsInChecker(content, pathname);
  } catch (error) {
    // Handle URL parsing errors specifically
    if (error instanceof TypeError) {
      throw new TypeError(`Invalid URL provided: ${error.message}`);
    }
    // Propagate other errors (network issues, etc.)
    throw error;
  }
}

module.exports = { checkRobots };
