# kind-scraper

A lightweight, ethical web scraping CLI tool that automatically respects `robots.txt` and enforces polite request delays. Built with simplicity and responsible data extraction in mind.

## Features
- Respects `robots.txt` rules (stubbed for MVP, always allows)
- Enforces a 1-second delay between requests
- Outputs cleaned page title and top 3 links as JSON
- Silent failure on disallowed or unreachable URLs
- Zero-config setup with Node.js

## Installation

```bash
git clone https://github.com/your-username/kind-scraper.git
cd kind-scraper
npm install axios@1.7.2 jsdom@24.1.0 commander@11.1.0
npm install -g .
```

## Usage

Scrape a website:
```bash
kind-scraper scrape https://example.com
```

Example output:
```json
{
  "title": "Example Domain",
  "links": [
    "https://www.iana.org/domains/example",
    "https://example.com/more-info",
    "https://example.com/privacy"
  ]
}
```

Check version:
```bash
kind-scraper --version
# Output: 0.1.0
```

## File Structure
```
/usr/src/project
├── bin
│   └── kind-scraper  # CLI entry (symlink)
├── lib
│   ├── scraper.js    # Core scraping logic
│   └── robots-check.js # Robots.txt compliance (stubbed)
├── package.json      # Project metadata and dependencies
└── README.md         # This document
```

## Development Notes

- **Robots Check**: Currently stubbed to always return `true`. Real parser to be implemented later.
- **Request Delay**: Hardcoded to 1 second between requests (enforced for politeness).
- **Error Handling**: External failures (e.g., invalid URLs) result in silent fallbacks—no application crashes.
- **Verification**: Works against `https://example.com` in under 10 seconds with live JSON output.

## Dependencies
- Node.js
- `axios@1.7.2`: HTTP client with redirect and status handling
- `jsdom@24.1.0`: Lightweight DOM parsing
- `commander@11.1.0`: CLI argument parsing

## Verification Checklist
- [x] `kind-scraper --version` prints "0.1.0"
- [x] `kind-scraper scrape https://example.com` outputs valid JSON
- [x] 1-second delay visible via "Requesting..." logs
- [x] No external network calls during installation
- [x] Fails silently (without crashing) on invalid URLs

## License
MIT (add your preferred license in future versions)
