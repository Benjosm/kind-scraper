const { scrapePage } = require('../../lib/scraper');
const nock = require('nock');
const axios = require('axios');

// Ensure nock intercepts requests made by axios


describe('scrapePage integration tests', () => {
  beforeEach(() => {
    // Clear any pending mocks before each test
    nock.cleanAll();
    jest.useRealTimers();
  });

  afterEach(() => {
    // Ensure all expected requests were made
    expect(nock.isDone()).toBe(true);
  });

  it('should successfully scrape a page with valid HTML content', async () => {
    const url = 'https://example.com';
    const htmlBody = `
      <html>
        <head><title>Test Page</title></head>
        <body>
          <a href="/about">About</a>
          <a href="https://external.com">External</a>
        </body>
      </html>`;

    // Mock HTTP response for the page
    nock('https://example.com')
      .get('/')
      .reply(200, htmlBody, {
        'Content-Type': 'text/html'
      });

    // Spy on console.log
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    const result = await scrapePage(url);

    // Verify the result
    expect(result.title).toBe('Test Page');
    expect(result.links).toContain('https://example.com/about');
    expect(result.links).toContain('https://external.com/');
    expect(result.links.length).toBe(2);

    logSpy.mockRestore();
  });

  it('should throw an error when robots.txt disallows the path', async () => {
    const blockedUrl = 'https://example.com/test/page';

    // Mock robots.txt to disallow /test/
    nock('https://example.com')
      .get('/robots.txt')
      .reply(200, 'User-agent: *\nDisallow: /test/', {
        'Content-Type': 'text/plain'
      });

    await expect(scrapePage(blockedUrl)).rejects.toThrow('Scraping disallowed');
  });

  it('should log Requesting... and Processing... with ~1000ms delay', async () => {
    const url = 'https://example.com';
    const htmlBody = `<html><head><title>Test Page</title></head><body></body></html>`;

    // Mock HTTP response
    nock('https://example.com')
      .get('/')
      .reply(200, htmlBody);

    const logSpy = jest.spyOn(console, 'log');
    const timestamps = [];

    // Override console.log to capture timestamps
    logSpy.mockImplementation((message) => {
      timestamps.push(Date.now());
      // Call original console.log to maintain visibility
      console.log(message);
    });

    await scrapePage(url);

    // Check logs were called in order
    expect(logSpy).toHaveBeenCalledWith('Requesting...');
    expect(logSpy).toHaveBeenCalledWith('Processing...');

    const requestIndex = logSpy.mock.calls.findIndex(call => call[0] === 'Requesting...');
    const processIndex = logSpy.mock.calls.findIndex(call => call[0] === 'Processing...');
    expect(requestIndex).toBeLessThan(processIndex);

    // Check timing between logs
    const timeDiff = timestamps[processIndex] - timestamps[requestIndex];
    expect(timeDiff).toBeGreaterThanOrEqual(950);
    expect(timeDiff).toBeLessThanOrEqual(1050);

    logSpy.mockRestore();
  });

  it('should handle network errors gracefully', async () => {
    const url = 'https://example.com';
    
    // Simulate network error
    nock('https://example.com')
      .get('/')
      .replyWithError({ message: 'Network error', code: 'ECONNRESET' });

    await expect(scrapePage(url)).rejects.toThrow('Network error');
  });

  it('should handle network timeouts', async () => {
    // Mock a request that takes longer than the timeout
    nock('https://httpbin.org')
      .get('/delay/10')
      .delay(6000) // Longer than default 5000ms timeout
      .reply(200, '<html><title>Test</title></html>');
    
    await expect(scrapePage('https://httpbin.org/delay/10'))
      .rejects
      .toThrow('Network request timed out');
  });
});
