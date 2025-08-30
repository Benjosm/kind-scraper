const { checkRobots, checkRobotsPermission } = require('./utils/robotsChecker');
const axios = require('axios');

async function debugRobotsCheck() {
  const url = 'https://httpbin.org/deny';
  const parsedUrl = new URL(url);
  const pathname = parsedUrl.pathname;

  console.log('Testing URL:', url);
  console.log('Pathname:', pathname);

  try {
    const robotsUrl = `${parsedUrl.origin}/robots.txt`;
    console.log('→ Fetching robots.txt from:', robotsUrl);
    const response = await axios.get(robotsUrl);
    
    console.log('\n→ Raw robots.txt content:');
    console.log('----------------------------------------');
    console.log(response.data);
    console.log('----------------------------------------\n');

    const disallows = [];
    let isStarUserAgent = false;

    for (const line of response.data.split('\n')) {
      const cleaned = line.trim();
      if (!cleaned || cleaned.startsWith('#')) continue;

      const lower = cleaned.toLowerCase();
      if (lower.startsWith('user-agent:')) {
        const ua = cleaned.split(':')[1].trim();
        isStarUserAgent = (ua === '*');
        console.log('• User-agent found:', ua, '(active: *)', isStarUserAgent ? '[SELECTED]' : '');
      } else if (isStarUserAgent && lower.startsWith('disallow:')) {
        const path = cleaned.split(':')[1].trim();
        if (path) {
          disallows.push(path);
          console.log('• Disallow rule:', path);
        }
      }
    }

    console.log('\n→ Final disallow paths:', disallows);
    console.log('→ Check result for', pathname, ':', checkRobots(response.data, pathname) ? 'ALLOWED' : 'DISALLOWED');

    const finalResult = await checkRobotsPermission(url);
    console.log('\n→ Final permission result:', finalResult ? '✅ ALLOWED' : '❌ BLOCKED');
  } catch (error) {
    console.error('→ Critical error:', error.message);
  }
}

debugRobotsCheck();
