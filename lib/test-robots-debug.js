const { checkRobots } = require('./utils/robotsChecker');

async function test() {
  const url = 'http://httpbin.org/deny';
  console.log('Testing robots.txt for:', url);
  try {
    const result = await checkRobots(url);
    console.log('Result:', result);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

test();
