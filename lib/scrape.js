const axios = require('axios');
const { JSDOM } = require('jsdom');
const { checkRobots } = require('./robots-check');

async function scrapePage(url) {
  if (!(await checkRobots(url))) {
    throw new Error("Robots.txt disallowed");
  }
  console.log("Requesting...");
  await new Promise(r => setTimeout(r, 1000)); // Fixed 1s delay
  console.log("Processing...");
  try {
    const response = await axios.get(url, { headers: { 'User-Agent': 'KindWebScraper' } });

    let title = '';
    let links = [];
    try {
      const dom = new JSDOM(response.data);
      title = dom.window.document.title || '';
      links = Array.from(dom.window.document.querySelectorAll('a[href]'))
                    .map(a => new URL(a.href, url).href)
                    .slice(0, 3);
    } catch (parseError) {
      console.error("Error parsing HTML:", parseError.message);
      links = []; // Ensure links is always an array
    }
    return { title, links };
  } catch (error) {
    console.error(`Error fetching ${url}:`, error.message);
    throw error;
  }
}

module.exports = { scrapePage };
