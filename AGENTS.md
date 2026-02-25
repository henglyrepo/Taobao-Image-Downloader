# AGENTS.md - Taobao Image Downloader

## Project Overview

A Chrome/Firefox browser extension (Manifest V3) that captures and downloads high-resolution product images from Taobao and Tmall e-commerce websites.

## Tech Stack

- Vanilla JavaScript (ES6+)
- Chrome Extension APIs (Manifest V3)
- HTML/CSS for popup UI

## Project Structure

```
.
├── manifest.json      # Extension manifest (V3)
├── popup.html        # Extension popup UI
├── popup.js          # Popup logic and image management
├── content.js        # Content script - DOM scanning
├── background.js     # Background service worker
├── README.md         # Project documentation
├── .gitignore        # Git ignore rules
└── AGENTS.md         # This file (for AI agents)
```

## Commands

### Loading the Extension (Development)

This is a browser extension with no build system. To test:

1. Open Chrome/Edge and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select this directory
4. Visit a Taobao/Tmall product page
5. Click the extension icon to view and download images

### Creating Release

1. Create a ZIP file of the extension directory
2. Exclude: `.git`, `.gitignore`, `README.md`, `AGENTS.md` (optional)
3. For Chrome Web Store: Upload ZIP to developer dashboard
4. For direct distribution: Users load via "Load unpacked"

### No Build/Lint/Test Commands

This is a simple vanilla JS extension with no:
- Package manager (npm/yarn)
- Build tools
- Linters
- Test framework

All code runs directly in the browser.

## Code Style Guidelines

### General

- Use ES6+ features (const/let, arrow functions, template literals)
- Always use strict mode (IIFE wrapper for content scripts)
- Keep functions focused and single-purpose
- Maximum line length: 100 characters

### Naming Conventions

- **Variables/Functions**: camelCase (`getHighResUrl`, `selectedImages`)
- **Constants**: UPPER_SNAKE_CASE for magic values (`CDN_DOMAINS`)
- **Files**: lowercase with dashes where needed (`popup.js`, `content.js`)
- **DOM IDs**: match HTML attributes exactly

### Chrome Extension Patterns

- Content scripts run in isolated world; use `chrome.runtime.sendMessage` for communication
- Background service worker uses async callback pattern for `chrome.storage`
- Always return `true` from message listener if using `sendResponse` asynchronously
- Manifest V3 requires service worker (not persistent background page)

### Error Handling

- Wrap API/storage operations in try-catch
- Use console methods with prefixes: `[Image Downloader] message`
- Resolve promises instead of rejecting for non-critical failures (e.g., image load errors)
- Display user-friendly error messages in UI

### DOM Manipulation (popup.js)

- Cache DOM references at initialization
- Use event delegation for dynamic lists
- Use template literals for HTML generation
- Escape user content before inserting into HTML (`escapeHtml()` function)

### Content Script Patterns (content.js)

- Wrap in IIFE: `(function() { ... })();`
- Scan DOM instead of intercepting network (more reliable)
- Use depth limits in recursive functions (max depth: 10)
- Filter by known CDN domains to avoid noise

### Performance

- Use Sets for deduplication (O(1) lookup)
- Lazy-load images with `loading="lazy"`
- Limit recursive search depth
- Avoid blocking operations in content scripts
- Use debouncing for MutationObserver

## Architecture Notes

### Message Flow

1. **popup.js** opens and sends `clearImages` to clear previous captures
2. **popup.js** triggers `scanDOM` message to **content.js**
3. **content.js** scans DOM for images using multiple methods:
   - `<img>` tags with src, data-src, srcset
   - `<picture>`, `<video>` elements
   - Elements with lazy-load attributes
   - Script tags containing image URLs
4. **content.js** extracts product title/ID from page
5. Sends image data via `chrome.runtime.sendMessage` to **background.js**
6. **background.js** stores in `chrome.storage.local`
7. **popup.js** queries and displays captured images
8. Download uses `downloadBatch` for sequential processing

### Key Functions

- `getHighResUrl()` - Strips thumbnail modifiers from Taobao URLs
- `getProductTitle()` - Extracts product title from meta/page
- `getProductId()` - Extracts product ID from URL
- `scanDOM()` - Main DOM scanning function
- `escapeHtml()` - Escapes HTML for safe insertion
- `loadImages()` - Fetches and processes captured images

### Data Structures

```javascript
// Image object
{
  src: string,      // High-res URL
  alt: string,      // Alt text (usually empty)
  type: string      // 'jpg', 'png', 'webp', 'gif'
}

// Product info
{
  title: string | null,  // Product title from page
  id: string | null      // Product ID from URL
}
```

## Important Constraints

- This extension targets Taobao/Tmall specifically - don't generalize for other sites
- Host permissions limited to: `*.taobao.com`, `*.tmall.com`, `*.tmall.hk`, `*.tbcdn.cn`, `*.alicdn.com`, `*.gtimg.cn`
- Images are filtered to CDN domains only (alicdn.com, tbcdn.cn, etc.)
- No external dependencies allowed (keeps extension lightweight)

## Features

- DOM-based image scanning (more reliable than API interception)
- Automatic product title/ID extraction for filename
- Image type filtering (JPEG/PNG/WebP)
- Resolution filtering with slider
- Batch download with sequential processing
- Auto-clear on popup open
- Manual scan trigger button
- Debug mode to view captured URLs
