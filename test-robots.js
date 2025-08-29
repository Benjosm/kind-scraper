const { checkRobots } = require('./src/utils/robotsChecker');

(async () => {
    const result = await checkRobots('https://example.com');
    console.log('Result:', result);
})();
