const { checkRobotsPermission } = require('./utils/robotsChecker');

/**
 * Checks robots.txt permission for the given URL.
 * @param {string} url - The URL to check.
 * @returns {Promise<boolean>} Whether access is allowed.
 */
async function checkRobots(url) {
  return checkRobotsPermission(url);
}

module.exports = { checkRobots };
