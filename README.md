# Taobao Image Downloader

A Chrome/Firefox browser extension that captures and downloads high-resolution product images from Taobao and Tmall e-commerce websites.

![Version](https://img.shields.io/badge/version-1.2.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## Features

- **Auto-Capture**: Automatically scans and captures product images from Taobao/Tmall pages
- **DOM-Based Scanning**: Reliable image extraction using DOM scanning instead of API interception
- **Smart Filtering**: Filter images by type (JPEG/PNG/WebP) and minimum resolution
- **Batch Download**: Download multiple images at once with sequential processing
- **Auto-Naming**: Files are automatically named using product title or product ID
- **Resolution Filter**: Slider to filter images by minimum width/height
- **High Resolution**: Automatically upgrades thumbnail URLs to full-resolution images

## Installation

### From Chrome Web Store
1. Visit the [Chrome Web Store](#] (coming soon)
2. Click "Add to Chrome"
3. Confirm the installation

### Manual Installation (Developer Mode)
1. Download the latest release or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (top right corner)
4. Click "Load unpacked"
5. Select the extension directory

## Usage

1. **Visit a Taobao/Tmall product page**
2. **Click the extension icon** in your browser toolbar
3. **Images are automatically captured** - wait a moment for scanning
4. **Use filters** to narrow down by type or resolution
5. **Select images** by clicking on them or use "Select All"
6. **Click Download** to save selected images

### Controls

| Button | Description |
|--------|-------------|
| **Scan DOM** | Manually trigger a fresh scan of the page |
| **HD** | Toggle 800px minimum resolution filter |
| **Type** | Filter by image format (All/JPEG/PNG/WebP) |
| **Min Res** | Slider to filter by minimum resolution |
| **Select All** | Select/deselect all visible images |
| **Download** | Download selected images |
| **Clear** | Clear captured images |
| **Refresh** | Reload page and rescan |

### Filename Format

Images are automatically named using one of the following:
- `{ProductTitle}_1.jpg`, `{ProductTitle}_2.jpg` (if product title is available)
- `{ProductID}_1.jpg`, `{ProductID}_2.jpg` (fallback to product ID from URL)

## Permissions

This extension requires the following permissions:

| Permission | Reason |
|------------|--------|
| `activeTab` | To access the current tab's content |
| `scripting` | To inject content script for DOM scanning |
| `downloads` | To save downloaded images |
| `storage` | To cache captured images temporarily |

### Host Permissions

The extension only accesses the following domains:
- `*.taobao.com`
- `*.tmall.com`
- `*.tmall.hk`
- `*.tbcdn.cn`
- `*.alicdn.com`
- `*.gtimg.cn`

## Technical Details

### Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   content.js    │────▶│  background.js  │────▶│   popup.js     │
│  (DOM Scanner)  │     │  (Storage +     │     │   (UI +        │
│                 │     │   Download)     │     │    Download)   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

### Message Flow

1. **content.js** scans the page DOM for images
2. Extracts product title/ID from the page
3. Sends image data to **background.js** via Chrome messaging
4. **background.js** stores images in chrome.storage.local
5. **popup.js** displays captured images and handles download requests
6. Download is processed by **background.js** with sequential delays

## Tech Stack

- Vanilla JavaScript (ES6+)
- Chrome Extension APIs (Manifest V3)
- HTML/CSS for popup UI
- No external dependencies

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Inspired by the need to easily download product images from Taobao/Tmall
- Built for educational purposes

## Disclaimer

This extension is not affiliated with, endorsed by, or connected to Alibaba, Taobao, or Tmall in any way. Use responsibly and respect the website's terms of service.
