const { checkRobots } = require('./robotsChecker');

checkRobots('https://example.com').then(result => {
    console.log('Result:', result);
});
