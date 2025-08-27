import { checkRobots } from './utils/robotsChecker.js';

(async () => {
  console.log('Testing checkRobots...');
  const result = await checkRobots('https://example.com');
  console.log('Result:', result);
  if (result === true) {
    console.log('✅ checkRobots resolved to true as expected.');
  } else {
    console.error('❌ checkRobots did not return true.');
    process.exit(1);
  }
})();
