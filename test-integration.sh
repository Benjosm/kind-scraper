#!/bin/bash
set -e

echo "Testing kind-scraper CLI integration..."

# Test 1: Verify version command
echo "Testing version..."
VERSION=$(node -p "require('./package.json').version")
if [[ "$VERSION" == "0.1.0" ]]; then
  echo "✓ Version is 0.1.0"
else
  echo "✗ Version is not 0.1.0"
  exit 1
fi

# Test 2: Verify installation doesn't make network requests
echo "Testing installation without network requests..."
# This is a simple check - we'll verify the package.json doesn't have postinstall hooks
if grep -q "postinstall" package.json; then
  echo "✗ Found postinstall script that might make network requests"
  exit 1
else
  echo "✓ No postinstall script found"
fi

# Test 3: Test scraping example.com
echo "Testing scrape functionality..."
# Create a temporary directory for testing
TMP_DIR=$(mktemp -d)
echo "Created temp directory: $TMP_DIR"
trap 'rm -rf "$TMP_DIR"' EXIT

# Debug: Check current directory contents
echo "Current directory contents:"
ls -la

# Create required directory structure
mkdir -p "$TMP_DIR/lib/node_modules"
mkdir -p "$TMP_DIR/bin"

# Install globally in the tmp directory
echo "Installing package globally..."
# Use npm install with --prefix to specify installation directory
npm install -g . --prefix "$TMP_DIR" 2>&1
if [ $? -ne 0 ]; then
  echo "✗ Installation failed"
  exit 1
fi
echo "Installation completed"

# Debug the installation process
echo "Debugging installation..."
echo "Contents of TMP_DIR before installation:"
ls -la "$TMP_DIR"

echo "Contents of TMP_DIR/lib:"
if [ -d "$TMP_DIR/lib" ]; then
  ls -la "$TMP_DIR/lib"
else
  echo "$TMP_DIR/lib does not exist"
fi

echo "Contents of TMP_DIR/lib/node_modules:"
if [ -d "$TMP_DIR/lib/node_modules" ]; then
  ls -la "$TMP_DIR/lib/node_modules"
else
  echo "$TMP_DIR/lib/node_modules does not exist"
fi

# Check if the binary link was created
if [ -L "$TMP_DIR/bin/kind-scraper" ]; then
  echo "✓ Symlink created at $TMP_DIR/bin/kind-scraper"
  # Get the actual target of the symlink
  TARGET=$(readlink "$TMP_DIR/bin/kind-scraper")
  echo "Symlink points to: $TARGET"
  
  # Try to find the actual file
  if [ -f "$TMP_DIR/lib/node_modules/kind-scraper/bin/kind-scraper" ]; then
    echo "✓ Found binary at $TMP_DIR/lib/node_modules/kind-scraper/bin/kind-scraper"
    ls -la "$TMP_DIR/lib/node_modules/kind-scraper/bin/kind-scraper"
  elif [ -f "$TMP_DIR/lib/node_modules/kind-scraper/bin/kind-scraper.js" ]; then
    echo "✓ Found binary at $TMP_DIR/lib/node_modules/kind-scraper/bin/kind-scraper.js"
    ls -la "$TMP_DIR/lib/node_modules/kind-scraper/bin/kind-scraper.js"
  else
    echo "✗ Cannot find binary in expected location"
    find "$TMP_DIR/lib/node_modules" -type f -name "kind-scraper*"
  fi
else
  echo "✗ No symlink created at $TMP_DIR/bin/kind-scraper"
  ls -la "$TMP_DIR/bin"
  exit 1
fi

# Set up PATH
export PATH="$TMP_DIR/bin:$PATH"
echo "PATH is now: $PATH"

# Check if the binary was actually installed
if [ ! -f "$TMP_DIR/bin/kind-scraper" ]; then
  echo "✗ Binary not found at $TMP_DIR/bin/kind-scraper"
  echo "Looking for kind-scraper in node_modules..."
  find "$TMP_DIR/lib/node_modules" -name "kind-scraper" -type d | xargs ls -la
  exit 1
else
  echo "✓ Binary found at $TMP_DIR/bin/kind-scraper"
fi

# Test scrape command
echo "Testing scrape https://example.com..."
# Try direct execution with node first to debug
echo "Attempting direct execution with node..."
node "$TMP_DIR/lib/node_modules/kind-scraper/bin/kind-scraper" scrape https://example.com
RC=$?
if [[ $RC -ne 0 ]]; then
  echo "✗ Direct execution failed with exit code $RC"
  exit 1
fi
# If direct execution works, try through PATH
OUTPUT=$(kind-scraper scrape https://example.com 2>&1)

# Extract just the JSON part (after the Requesting... line)
JSON_OUTPUT=$(echo "$OUTPUT" | sed -n '/^{/,$p')

# Debug: Output the raw JSON for inspection
echo "Raw JSON output:"
echo "$JSON_OUTPUT"

if [[ "$JSON_OUTPUT" == *"title"* && "$JSON_OUTPUT" == *"links"* ]]; then
  echo "✓ Output contains valid JSON with title and links"
  # Verify it's valid JSON
  echo "$JSON_OUTPUT" | python3 -m json.tool > /dev/null 2>&1
  if [[ $? -eq 0 ]]; then
    echo "✓ Output is valid JSON"
  else
    echo "✗ Output is not valid JSON"
    echo "Invalid JSON content:"
    echo "$JSON_OUTPUT"
    exit 1
  fi
else
  echo "✗ Output does not contain expected JSON structure"
  echo "Actual JSON content:"
  echo "$JSON_OUTPUT"
  exit 1
fi

# Test 4: Test invalid URL
echo "Testing invalid URL..."
ERROR_OUTPUT=$(kind-scraper scrape https://invalid.url.does.not.exist.12345 2>&1 || true)
# Should produce no output
if [[ -z "$ERROR_OUTPUT" ]]; then
  echo "✓ No output produced for invalid URL"
else
  echo "✗ Output produced for invalid URL: $ERROR_OUTPUT"
  exit 1
fi

echo "All tests passed!"

# Clean up
rm -rf "$TMP_DIR"
