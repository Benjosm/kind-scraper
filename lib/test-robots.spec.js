jest.mock('./utils/robotsChecker');
jest.mock('axios');
jest.mock('jsdom', () => {
  return {
    JSDOM: jest.fn().mockImplementation(() => ({
      window: {
        document: {
          title: 'Test Page Title',
          querySelectorAll: (selector) => {
            if (selector === 'a') {
              return [
                { href: 'https://example.com/link1' },
                { href: 'https://example.com/link2' },
                { href: 'https://example.com/link3' },
                { href: 'https://example.com/link4' } // This should be filtered to max 3
              ];
            }
            return [];
          }
        }
      }
    }))
  };
});

const { checkRobots } = require('./utils/robotsChecker');
const { scrapePage } = require('./scraper');
const axios = require('axios');

describe('Robots.txt Compliance Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock axios.get to avoid actual HTTP requests
    axios.get.mockResolvedValue({
      status: 200,
      data: '<html><head><title>Test Page</title></head><body><a href="https://example.com/link1">Link 1</a><a href="https://example.com/link2">Link 2</a><a href="https://example.com/link3">Link 3</a><a href="https://example.com/link4">Link 4</a></body></html>'
    });
  });

  test('checkRobots is called before page fetch with correct origin', async () => {
    // Test URL
    const testUrl = 'https://example.com/page1';

    // Spy on checkRobots function and mock it to allow scraping
    const checkRobotsSpy = jest.spyOn(require('./utils/robotsChecker'), 'checkRobots');
    checkRobotsSpy.mockResolvedValue(true);

    // Perform the scrape
    await scrapePage(testUrl);

    // Verify checkRobots was called with the correct URL
    expect(checkRobotsSpy).toHaveBeenCalledWith(testUrl);
    
    // Verify it was called before axios.get (before any page fetch)
    expect(checkRobotsSpy).toHaveBeenCalledBefore(axios.get);
  });

  test('disallows scraping when robots.txt denies access', async () => {
    const disallowedUrl = 'https://example.com/private';
    
    // Spy on checkRobots function and mock it to deny scraping
    const checkRobotsSpy = jest.spyOn(require('./utils/robotsChecker'), 'checkRobots');
    checkRobotsSpy.mockResolvedValue(false);

    // Attempt to scrape and verify error
    await expect(scrapePage(disallowedUrl)).rejects.toThrow(
      `Scraping disallowed for ${disallowedUrl}`
    );
    
    // Confirm no network request was made
    expect(axios.get).not.toHaveBeenCalled();
  });

  test('allows and performs scraping when robots.txt allows access', async () => {
    const allowedUrl = 'https://example.com/public';

    // Spy on checkRobots and allow scraping
    const checkRobotsSpy = jest.spyOn(require('./utils/robotsChecker'), 'checkRobots');
    checkRobotsSpy.mockResolvedValue(true);

    // Perform the scrape
    const result = await scrapePage(allowedUrl);

    // Verify checkRobots was called and allowed
    expect(checkRobotsSpy).toHaveBeenCalledWith(allowedUrl);
    expect(checkRobotsSpy).toHaveReturnedWith(expect.any(Promise));
    expect(await checkRobotsSpy.mock.results[0].value).toBe(true);

    // Verify the returned data structure
    expect(result).toHaveProperty('title');
    expect(typeof result.title).toBe('string');
    expect(result.title).toBe('Test Page Title');

    expect(result).toHaveProperty('links');
    expect(Array.isArray(result.links)).toBe(true);
    expect(result.links.length).toBeLessThanOrEqual(3);
    result.links.forEach(link => {
      expect(typeof link).toBe('string');
      expect(link).toMatch(/^https?:\/\//);
    });
  });
});
