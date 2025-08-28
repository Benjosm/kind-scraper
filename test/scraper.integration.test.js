const { scrapePage } = require('../lib/scraper');
const axios = require('axios');
const nock = require('nock');

// Allow ample time for real network requests and 1-second delay
jest.setTimeout(15000);

// Clean up Nock after each test
afterEach(() => {
  nock.cleanAll(); // Remove all mocks
});

describe('scrapePage integration tests', () => {
  it('should successfully scrape example.com with valid robots.txt', async () => {
    jest.useFakeTimers();
    const scrapePromise = scrapePage('http://example.com');
    jest.advanceTimersByTime(1000);
    const result = await scrapePromise;
    
    // Verify expected content from example.com
    expect(result.title).toBe('Example Domain');
    expect(result.links).toContain('https://www.iana.org/domains/example');
    expect(result.links.length).toBeGreaterThan(0);
  });

  it('verifies httpbin.org/robots.txt disallows /deny', async () => {
    const response = await axios.get('https://httpbin.org/robots.txt');
    expect(response.data).toMatch(/Disallow:\s*\/deny/i);
  });
  
  it('should respect robots.txt disallow directive', async () => {
    // Mock the robots.txt response to disallow scraping
    const scope = nock(/httpbin\.org/)
      .get('/robots.txt')
      .reply(200, 'User-agent: *\nDisallow: /deny');
  
    const scrapePromise = scrapePage('https://httpbin.org/deny');
    
    await expect(scrapePromise).rejects.toThrow('Scraping disallowed by robots.txt for https://httpbin.org/deny. Check the website\'s robots.txt file for allowed paths.');
    
    // Ensure the test verifies that no request was made to the actual page URL
    // by asserting the mock was used.
    expect(scope.isDone()).toBe(true); // Ensure the mocked request was made
  });

  it('should handle non-200 HTTP responses', async () => {
    jest.useFakeTimers();
    const scrapePromise = scrapePage('https://httpbin.org/status/404');
    jest.advanceTimersByTime(1000);
    await expect(scrapePromise).rejects.toThrow('HTTP 404: NOT FOUND');
  });

  it('should log "Requesting..." and "Processing..." with 1-second delay', async () => {
    const logSpy = jest.spyOn(console, 'log');
    const timestamps = [];

    // Override console.log to capture timestamps while still logging
    logSpy.mockImplementation((message) => {
      timestamps.push(Date.now());
      console.log(message);
    });

    await scrapePage('http://example.com');

    // Check for the existence and order of log messages
    const requestLogIndex = logSpy.mock.calls.findIndex(call => 
      call[0] === 'Requesting...');
    const processLogIndex = logSpy.mock.calls.findIndex(call => 
      call[0] === 'Processing...');

    expect(requestLogIndex).toBeGreaterThan(-1);
    expect(processLogIndex).toBeGreaterThan(-1);
    expect(requestLogIndex).toBeLessThan(processLogIndex);

    // Check timing between logs
    const timeDiff = timestamps[processLogIndex] - timestamps[requestLogIndex];
    expect(timeDiff).toBeGreaterThanOrEqual(950);
    expect(timeDiff).toBeLessThanOrEqual(1050);
  });

  it('should throw for invalid URL format', async () => {
    await expect(scrapePage('not-a-url'))
      .rejects
      .toThrow('Invalid URL');
  });

  it('should handle empty HTML response', async () => {
    jest.useFakeTimers();
    const scrapePromise = scrapePage('https://httpbin.org/response-headers?Content-Length=0');
    jest.advanceTimersByTime(1000);
    await expect(scrapePromise).rejects.toThrow('Empty HTML response');
  });

  it('should handle malformed HTML response', async () => {
    jest.useFakeTimers();
    const scrapePromise = scrapePage('https://httpbin.org/json');
    jest.advanceTimersByTime(1000);
    await expect(scrapePromise).rejects.toThrow('Failed to parse HTML');
  });

  it('should handle network timeouts', async () => {
    jest.useFakeTimers();
    const scrapePromise = scrapePage('https://httpbin.org/delay/10');
    jest.advanceTimersByTime(1000);
    await expect(scrapePromise).rejects.toThrow('Network request timed out');
  });
});
