const { checkRobots } = require('./lib/robots-check');

async function runTest() {
  const testUrl = 'https://example.com/page1';
  try {
    const isAllowed = await checkRobots(testUrl);
    console.log(`Robots check for ${testUrl}: ${isAllowed}`);
    if (isAllowed) {
      console.log('Test PASSED: checkRobots resolved to true as expected.');
    } else {
      console.log('Test FAILED: Expected true, but received false.');
      process.exit(1);
    }
  } catch (error) {
    console.log('Test FAILED with error:', error.message);
    process.exit(1);
  }
}

runTest();
