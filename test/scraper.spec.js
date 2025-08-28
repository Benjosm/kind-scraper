const axios = require('axios');
const nock = require('nock');
const { JSDOM } = require('jsdom');
const { scrapePage } = require('../lib/scraper');
const { checkRobots } = require('../lib/utils/robotsChecker');

// Use fake timers
jest.useFakeTimers();

// Mock axios and checkRobots
jest.mock('axios');
jest.mock('../lib/utils/robotsChecker', () => ({
  checkRobots: jest.fn(),
}));

// Mock console.log
jest.spyOn(console, 'log').mockImplementation(() => {});

jest.mock('axios');

describe('scrapePage', () => {
  const VALID_URL = 'http://example.com';

  beforeEach(() => {
    // Reset mocks before each test
    jest.resetAllMocks();
    
    // Reset timers before each test
    jest.clearAllTimers();
    
    // Default mock implementation for checkRobots
    checkRobots.mockResolvedValue(true);
  });

  afterEach(() => {
    // Clear all mocks and timers after each test
    jest.clearAllTimers();
  });

  it('should scrape title and links from a valid URL', async () => {
    const VALID_HTML = `
      <html>
        <head><title>Test Page</title></head>
        <body>
          <a href="/page1">Link 1</a>
          <a href="http://example.com/page2">Link 2</a>
          <a href="/page3">Link 3</a>
          <a href="/page4">Link 4</a>
        </body>
      </html>
    `;
  
    // Execute the function
    const promise = scrapePage(VALID_URL);
  
    // Advance timers to pass the 1-second delay
    jest.advanceTimersByTime(1000);
  
    // Mock successful response
    axios.get.mockResolvedValue({
      status: 200,
      data: VALID_HTML
    });
  
    // Wait for the promise to resolve
    const result = await promise;
  
    expect(result.title).toBe('Test Page');
    expect(result.links).toHaveLength(3);
    expect(result.links).toContain('http://example.com/page1');
    expect(result.links).toContain('http://example.com/page2');
    expect(result.links).toContain('http://example.com/page3');
  });

  it('should throw an error for invalid URL format', async () => {
    await expect(scrapePage('invalid-url')).rejects.toThrow('Invalid URL: invalid-url');
    // checkRobots should not be called for invalid URLs
    expect(checkRobots).not.toHaveBeenCalled();
  });

  it('should throw an error when robots.txt disallows scraping', async () => {
    // Mock checkRobots to return false
    checkRobots.mockResolvedValue(false);

    await expect(scrapePage(VALID_URL)).rejects.toThrow('Robots.txt compliance check failed. Scraping not allowed.');
    expect(checkRobots).toHaveBeenCalledWith(VALID_URL);
    // axios.get should not be called if robots check fails
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('should throw an error for non-200 HTTP status', async () => {
    // Mock response with 404 status
    axios.get.mockResolvedValue({
      status: 404,
      statusText: 'Not Found',
      data: '<h1>Not Found</h1>'
    });

    await expect(scrapePage(VALID_URL)).rejects.toThrow('HTTP 404: Not Found');
    expect(checkRobots).toHaveBeenCalledWith(VALID_URL);
    expect(axios.get).toHaveBeenCalledWith(VALID_URL, {
      headers: { 'User-Agent': 'KindWebScraper' },
      responseType: 'text'
    });
  });

  it('should throw an error for empty HTML content', async () => {
    // Mock response with empty HTML
    axios.get.mockResolvedValue({
      status: 200,
      data: ''
    });

    await expect(scrapePage(VALID_URL)).rejects.toThrow('Empty or invalid HTML content received');
    expect(checkRobots).toHaveBeenCalledWith(VALID_URL);
    expect(axios.get).toHaveBeenCalledWith(VALID_URL, {
      headers: { 'User-Agent': 'KindWebScraper' },
      responseType: 'text'
    });
  });

  it('should throw an error for non-string HTML content', async () => {
    // Mock response with non-string data
    axios.get.mockResolvedValue({
      status: 200,
      data: null
    });

    await expect(scrapePage(VALID_URL)).rejects.toThrow('Empty or invalid HTML content received');
    expect(checkRobots).toHaveBeenCalledWith(VALID_URL);
    expect(axios.get).toHaveBeenCalledWith(VALID_URL, {
      headers: { 'User-Agent': 'KindWebScraper' },
      responseType: 'text'
    });
  });

  it('should throw an error for malformed HTML', async () => {
    // Mock response with malformed HTML that JSDOM cannot parse
    axios.get.mockResolvedValue({
      status: 200,
      data: '<html><body><div></body></html><' // Invalid, unclosed tag
    });

    // Mock JSDOM to throw an error when parsing
    const originalJSDOM = global.JSDOM;
    global.JSDOM = class extends originalJSDOM {
      constructor() {
        super(...arguments);
        throw new Error('Parse error');
      }
    };

    await expect(scrapePage(VALID_URL)).rejects.toThrow('Failed to parse HTML content');
    expect(checkRobots).toHaveBeenCalledWith(VALID_URL);
    expect(axios.get).toHaveBeenCalledWith(VALID_URL, {
      headers: { 'User-Agent': 'KindWebScraper' },
      responseType: 'text'
    });

    // Restore original JSDOM
    global.JSDOM = originalJSDOM;
  });

  it('should handle network errors (axios rejects)', async () => {
    // Mock axios to reject with a network error
    const networkError = new Error('Network Error');
    axios.get.mockRejectedValue(networkError);

    await expect(scrapePage(VALID_URL)).rejects.toThrow('Network Error');
    expect(checkRobots).toHaveBeenCalledWith(VALID_URL);
    expect(axios.get).toHaveBeenCalledWith(VALID_URL, {
      headers: { 'User-Agent': 'KindWebScraper' },
      responseType: 'text'
    });
  });

  it('should return empty title when no title tag is present', async () => {
    const htmlWithoutTitle = `
      <html>
        <body>
          <a href="/page1">Link 1</a>
        </body>
      </html>
    `;

    axios.get.mockResolvedValue({
      status: 200,
      data: htmlWithoutTitle
    });

    const result = await scrapePage(VALID_URL);
    expect(result.title).toBe('');
    expect(result.links).toHaveLength(1);
    expect(result.links[0]).toBe('http://example.com/page1');
  });

  it('should extract up to 3 unique links and skip duplicates', async () => {
    const htmlWithDuplicates = `
      <html>
        <head><title>Test Page</title></head>
        <body>
          <a href="/page1">Link 1</a>
          <a href="http://example.com/page2">Link 2</a>
          <a href="/page1">Link 3</a>
          <a href="/page4">Link 4</a>
          <a href="/page3">Link 5</a>
        </body>
      </html>
    `;

    axios.get.mockResolvedValue({
      status: 200,
      data: htmlWithDuplicates
    });

    const result = await scrapePage(VALID_URL);
    expect(result.links).toHaveLength(3);
    expect(result.links).toContain('http://example.com/page1');
    expect(result.links).toContain('http://example.com/page2');
    expect(result.links).toContain('http://example.com/page4');
  });

  it('should handle relative and absolute URLs correctly', async () => {
    const htmlWithMixedUrls = `
      <html>
        <head><title>Test Page</title></head>
        <body>
          <a href="/relative1">Relative 1</a>
          <a href="https://external.com/page">External</a>
          <a href="//example.com/protocol-relative">Protocol Relative</a>
        </body>
      </html>
    `;

    axios.get.mockResolvedValue({
      status: 200,
      data: htmlWithMixedUrls
    });

    const result = await scrapePage(VALID_URL);
    expect(result.links).toHaveLength(3);
    expect(result.links).toContain('http://example.com/relative1');
    expect(result.links).toContain('https://external.com/page');
    expect(result.links).toContain('http://example.com/protocol-relative');
  });

  it('should skip invalid URLs in href attributes', async () => {
    const htmlWithInvalidUrls = `
      <html>
        <head><title>Test Page</title></head>
        <body>
          <a href="/valid">Valid</a>
          <a href="javascript:alert('xss')">JavaScript</a>
          <a href="mailto:test@example.com">Email</a>
          <a href="http://valid.com">Valid 2</a>
        </body>
      </html>
    `;

    axios.get.mockResolvedValue({
      status: 200,
      data: htmlWithInvalidUrls
    });

    const result = await scrapePage(VALID_URL);
    expect(result.links).toHaveLength(3);
    expect(result.links).toContain('http://example.com/valid');
    expect(result.links).toContain('http://valid.com/');
    // Email and JavaScript links should be skipped
  });

  it('should handle empty or null href attributes', async () => {
    const htmlWithEmptyHref = `
      <html>
        <head><title>Test Page</title></head>
        <body>
          <a href="">Empty href</a>
          <a href>Null href</a>
          <a>No href attribute</a>
          <a href="/valid">Valid link</a>
        </body>
      </html>
    `;

    axios.get.mockResolvedValue({
      status: 200,
      data: htmlWithEmptyHref
    });

    const result = await scrapePage(VALID_URL);
    expect(result.links).toHaveLength(2);
    expect(result.links).toContain('http://example.com/');
    expect(result.links).toContain('http://example.com/valid');
  });

  it('should wait 1 second between robots check and request', async () => {
    // Mock successful response
    axios.get.mockResolvedValue({
      status: 200,
      data: '<html><head><title>Test</title></head><body></body></html>'
    });

    // Start the function
    const promise = scrapePage(VALID_URL);

    // Assert that we've entered the function (robots check called)
    expect(checkRobots).toHaveBeenCalledWith(VALID_URL);
    
    // Verify "Requesting..." is logged and "Processing..." is not logged
    expect(console.log).toHaveBeenCalledWith("Requesting...");
    expect(console.log).not.toHaveBeenCalledWith("Processing...");

    // Advance only 999ms, which should not be enough for the 1-second delay
    jest.advanceTimersByTime(999);
    
    // Function should not have proceeded yet
    expect(axios.get).not.toHaveBeenCalled();
    // "Processing..." should still not be logged
    expect(console.log).not.toHaveBeenCalledWith("Processing...");

    // Advance 1 more ms to complete the 1-second delay
    jest.advanceTimersByTime(1);

    // Now axios.get should be called and "Processing..." should be logged
    expect(axios.get).toHaveBeenCalledWith(VALID_URL, {
      headers: { 'User-Agent': 'KindWebScraper' },
      responseType: 'text'
    });
    expect(console.log).toHaveBeenCalledWith("Processing...");

    // Wait for the promise to resolve
    await promise;
  });

  it('should handle HTML parsing errors', async () => {
    // Mock successful response
    axios.get.mockResolvedValue({
      status: 200,
      data: '<html><body><div></div></html>'
    });

    // Mock JSDOM to throw an error when parsing
    const originalJSDOM = global.JSDOM;
    global.JSDOM = class extends originalJSDOM {
      constructor() {
        super(...arguments);
        throw new Error('Parse error');
      }
    };

    await expect(scrapePage(VALID_URL)).rejects.toThrow('Failed to parse HTML content');
    expect(checkRobots).toHaveBeenCalledWith(VALID_URL);
    expect(axios.get).toHaveBeenCalledWith(VALID_URL, {
      headers: { 'User-Agent': 'KindWebScraper' },
      responseType: 'text'
    });

    // Restore original JSDOM
    global.JSDOM = originalJSDOM;
  });

  it('should handle HTML with no links', async () => {
    const htmlWithNoLinks = `
      <html>
        <head><title>No Links</title></head>
        <body>
          <p>This page has no links</p>
        </body>
      </html>
    `;

    axios.get.mockResolvedValue({
      status: 200,
      data: htmlWithNoLinks
    });

    const result = await scrapePage(VALID_URL);
    
    expect(result.title).toBe('No Links');
    expect(result.links).toHaveLength(0);
  });

  it('should handle HTML with exactly one link', async () => {
    const htmlWithOneLink = `
      <html>
        <head><title>One Link</title></head>
        <body>
          <a href="/only-link">Only Link</a>
        </body>
      </html>
    `;

    axios.get.mockResolvedValue({
      status: 200,
      data: htmlWithOneLink
    });

    const result = await scrapePage(VALID_URL);
    
    expect(result.title).toBe('One Link');
    expect(result.links).toHaveLength(1);
    expect(result.links[0]).toBe('http://example.com/only-link');
  });

  it('should handle HTML with exactly three unique links', async () => {
    const htmlWithThreeLinks = `
      <html>
        <head><title>Three Links</title></head>
        <body>
          <a href="/link1">Link 1</a>
          <a href="/link2">Link 2</a>
          <a href="/link3">Link 3</a>
        </body>
      </html>
    `;

    axios.get.mockResolvedValue({
      status: 200,
      data: htmlWithThreeLinks
    });

    const result = await scrapePage(VALID_URL);
    
    expect(result.title).toBe('Three Links');
    expect(result.links).toHaveLength(3);
    expect(result.links).toContain('http://example.com/link1');
    expect(result.links).toContain('http://example.com/link2');
    expect(result.links).toContain('http://example.com/link3');
  });

  it('should handle duplicate links correctly', async () => {
    const htmlWithDuplicateLinks = `
      <html>
        <head><title>Duplicate Links</title></head>
        <body>
          <a href="/link1">Link 1</a>
          <a href="/link2">Link 2</a>
          <a href="/link1">Link 1 (duplicate)</a>
          <a href="/link3">Link 3</a>
          <a href="/link3">Link 3 (duplicate)</a>
        </body>
      </html>
    `;

    axios.get.mockResolvedValue({
      status: 200,
      data: htmlWithDuplicateLinks
    });

    const result = await scrapePage(VALID_URL);
    expect(result.title).toBe('Duplicate Links');
    expect(result.links).toHaveLength(3);
    expect(result.links).toContain('http://example.com/link1');
    expect(result.links).toContain('http://example.com/link2');
    expect(result.links).toContain('http://example.com/link3');
  });

  it('should handle URLs that resolve to the same absolute URL but are written differently', async () => {
    const htmlWithDifferentlyFormattedIdenticalLinks = `
      <html>
        <head><title>Identical URL Test</title></head>
        <body>
          <a href="/link1">Link 1</a>
          <a href="https://example.com/link1">Link 2 (same)</a>
          <a href="/link2">Link 3</a>
          <a href="https://example.com/link2">Link 4 (same)</a>
          <a href="/link3">Link 5</a>
        </body>
      </html>
    `;

    axios.get.mockResolvedValue({
      status: 200,
      data: htmlWithDifferentlyFormattedIdenticalLinks
    });

    const result = await scrapePage('https://example.com');
    expect(result.title).toBe('Identical URL Test');
    expect(result.links).toHaveLength(3);
    expect(result.links).toContain('https://example.com/link1');
    expect(result.links).toContain('https://example.com/link2');
    expect(result.links).toContain('https://example.com/link3');
  });
});
