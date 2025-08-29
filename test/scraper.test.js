const { scrapePage } = require('../src/scraper');
const { checkRobots } = require('../src/robots-check');

// Mock the checkRobots function for testing
jest.mock('../src/robots-check', () => ({
  checkRobots: jest.fn().mockResolvedValue(true)
}));

// We need to mock axios to control the response and verify headers
const axios = require('axios');
jest.mock('axios');

describe('scrapePage', () => {
  const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
  const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

  beforeEach(() => {
    jest.clearAllMocks();
    consoleSpy.mockClear();
    consoleErrorSpy.mockClear();
  });

  it('should log requesting and processing with 1 second delay and return correct data structure', async () => {
    // Mock axios response
    axios.get.mockResolvedValue({
      status: 200,
      data: `
        <html>
          <head><title>Example Domain</title></head>
          <body>
            <a href="/link1">Link 1</a>
            <a href="https://example.com/link2">Link 2</a>
            <a href="/link3">Link 3</a>
            <a href="/link4">Link 4</a>
          </body>
        </html>
      `
    });

    const startTime = Date.now();
    const result = await scrapePage('https://example.com');
    const endTime = Date.now();

    // Check that the total execution time is at least 1 second (due to the delay)
    expect(endTime - startTime).toBeGreaterThanOrEqual(1000);

    // Check that request was made with correct headers
    expect(axios.get).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({
        headers: expect.objectContaining({
          'User-Agent': 'KindWebScraper'
        }),
        responseType: 'text',
        timeout: 5000
      })
    );

    // Check logging
    expect(consoleSpy).toHaveBeenCalledWith('Requesting...');
    expect(consoleSpy).toHaveBeenCalledWith('Processing...');

    // Check return value structure
    expect(result).toHaveProperty('title', 'Example Domain');
    expect(Array.isArray(result.links)).toBe(true);
    expect(result.links.length).toBeLessThanOrEqual(3);
    expect(result.links).toEqual([
      'https://example.com/link1',
      'https://example.com/link2',
      'https://example.com/link3'
    ]);
  });

  it('should handle network errors gracefully without crashing', async () => {
    // Mock axios to throw a network error
    axios.get.mockRejectedValue(new Error('Network Error'));

    const result = await scrapePage('https://this-domain-does-not-exist.invalid');

    // Check error was logged to stderr
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error during scraping'));

    // Check function returns default object
    expect(result).toEqual({ title: '', links: [] });
  });

  it('should validate URL and return empty result for invalid URLs', async () => {
    const result = await scrapePage('not-a-valid-url');

    // Check error was logged
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid URL'));

    // Check function returns default object
    expect(result).toEqual({ title: '', links: [] });
  });

  it('should check robots.txt before scraping', async () => {
    await scrapePage('https://example.com');

    // Check that checkRobots was called
    expect(checkRobots).toHaveBeenCalledWith('https://example.com');
  });
});

// Test with a real HTTP request to verify timing
describe('scrapePage integration', () => {
  // Restore the real axios for this test
  jest.unmock('axios');

  it('should complete within 5 seconds with real request', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
    const startTime = Date.now();
    
    const result = await scrapePage('https://httpbin.org/html');
    const endTime = Date.now();

    // Check total time is within 5 seconds
    expect(endTime - startTime).toBeLessThan(5000);

    // Check for proper logging
    expect(consoleSpy).toHaveBeenCalledWith('Requesting...');
    expect(consoleSpy).toHaveBeenCalledWith('Processing...');

    // Clean up
    consoleSpy.mockRestore();
  }, 10000); // Increase timeout for this test
});
