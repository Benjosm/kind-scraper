module.exports.checkRobots = (content, pathname) => {
  const lines = content.split(/\r?\n/);
  const disallowed = [];
  
  for (const line of lines) {
    const trimmed = line.trimStart();
    
    // Skip comment lines
    if (trimmed.startsWith('#')) {
      continue;
    }
    
    const normalizedLine = trimmed.toLowerCase();
    if (normalizedLine.startsWith('disallow:')) {
      const path = trimmed.substring('disallow:'.length).trim();
      if (path !== '') {
        disallowed.push(path);
      }
    }
  }
  
  // Check each disallowed path against the requested pathname
  for (const path of disallowed) {
    if (pathname.startsWith(path)) {
      return false;
    }
  }
  
  return true;
};
