async function checkRobots(url) {
  // TODO: Real robots parser - currently allows all per MVP requirements
  console.log("Robots allowed");
  return true;
}

module.exports = { checkRobots };
