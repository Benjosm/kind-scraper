/**
 * // TODO: Real parser
 * Checks if the given URL is allowed to be scraped according to robots.txt.
 * @param {string} url - The URL to check.
 * @returns {Promise<boolean>} - Returns true if the URL is allowed to be scraped.
 */
async function checkRobots(url) {
  // For now, always return true to allow scraping
  return true;
}

module.exports = { checkRobots };
