const axios = require('axios');

async function checkRobots(url) {
  try {
    const { origin, pathname } = new URL(url);
    const robotsUrl = `${origin}/robots.txt`;

    const response = await axios.get(robotsUrl, { timeout: 5000 });
    const content = response.data;

    // Parse robots.txt for wildcard user-agent directives
    const lines = content.split(/\r?\n/);
    let isWildcardSection = false;
    const disallowedPaths = [];

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (trimmedLine === '' || trimmedLine.startsWith('#')) {
        continue;
      }

      const lowerLine = trimmedLine.toLowerCase();

      if (lowerLine.startsWith('user-agent:')) {
        const userAgent = trimmedLine.substring('user-agent:'.length).trim();
        isWildcardSection = (userAgent === '*');
      } else if (isWildcardSection) {
        if (lowerLine.startsWith('disallow:')) {
          const path = trimmedLine.substring('disallow:'.length).trim();
          if (path !== '') {
            disallowedPaths.push(path);
          }
        }
      }
    }

    // Check if the current pathname is disallowed
    for (const path of disallowedPaths) {
      if (pathname.startsWith(path)) {
        return false;
      }
    }

    return true;

  } catch (error) {
    return true;
  }
}

module.exports = { checkRobots };
