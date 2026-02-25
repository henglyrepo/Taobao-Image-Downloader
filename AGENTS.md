# AGENTS.md - Taobao Image Downloader

## Project Overview

Chrome/Firefox browser extension (Manifest V3) that captures and downloads high-resolution product images from Taobao and Tmall.

## Tech Stack

- Vanilla JavaScript (ES6+)
- Chrome Extension APIs (Manifest V3)
- HTML/CSS for popup UI

## Project Structure

```
manifest.json   # Extension manifest (V3)
popup.html     # Extension popup UI
popup.js       # Popup logic and image management
content.js     # Content script - DOM scanning
background.js  # Background service worker
offscreen.html # Offscreen document for image conversion
offscreen.js   # Offscreen script for Canvas operations
```

## Commands

### Loading Extension (Development)

1. Open Chrome/Edge and navigate to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" and select this directory
4. Visit a Taobao/Tmall product page
5. Click the extension icon to view and download images

### Creating Release

1. Run `release.bat` (Windows) or `release.sh` (Mac/Linux)
2. Or manually create ZIP with only extension files
3. For Chrome Web Store: Upload ZIP to developer dashboard

### Testing

- **Manual Testing**: Load unpacked extension in Chrome/Edge
- **Debug Mode**: Enable "Debug mode" in popup to view captured URLs
- **Console Logs**: All scripts use `[Image Downloader]` prefix

## Code Style Guidelines

### General

- Use ES6+ features (const/let, arrow functions, template literals)
- Wrap content scripts in IIFE: `(function() { ... })();`
- Keep functions focused (max 50 lines)
- Max line length: 100 characters, 2 spaces indentation
- Always use semicolons

### Naming Conventions

- **Variables/Functions**: camelCase (`getHighResUrl`)
- **Constants**: UPPER_SNAKE_CASE (`CDN_DOMAINS`)
- **Files**: lowercase (`popup.js`, `content.js`)

### Chrome Extension Patterns

- Use `chrome.runtime.sendMessage` for content/background communication
- Return `true` from message listener for async `sendResponse`
- Use `chrome.storage.local` for persistence
- Manifest V3 uses service worker (not persistent background page)

### Error Handling

- Wrap API/storage operations in try-catch
- Use console prefix: `[Image Downloader] message`
- Display user-friendly errors in UI

### Performance

- Use Sets for deduplication (O(1) lookup)
- Limit recursive DOM search depth
- Debounce MutationObserver callbacks

## Architecture

### Message Flow

1. **content.js** scans DOM for images
2. Sends data to **background.js** via Chrome messaging
3. **background.js** stores in `chrome.storage.local`
4. **popup.js** queries and displays images
5. **offscreen.js** handles image format conversion via Canvas API

### Key Functions

- `getHighResUrl()` - Strips thumbnail modifiers from Taobao URLs
- `scanDOM()` - Main DOM scanning function
- `escapeHtml()` - Escapes HTML for safe insertion
- `convertImageToFormat()` - Converts images using Canvas API

## Important Constraints

- Targets Taobao/Tmall only
- Host permissions: `*.taobao.com`, `*.tmall.com`, `*.tmall.hk`, `*.tbcdn.cn`, `*.alicdn.com`, `*.gtimg.cn`
- No external dependencies
