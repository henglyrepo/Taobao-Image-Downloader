# Taobao Image Downloader

<p align="center">
  <img src="https://img.shields.io/badge/version-1.3.0-blue?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/Chrome-Extension-blue?style=for-the-badge&logo=google-chrome" alt="Chrome Extension">
</p>

A powerful Chrome/Firefox browser extension that captures and downloads high-resolution product images from Taobao and Tmall e-commerce websites. Features smart filtering, batch downloading, and format conversion.

## Why This Extension?

- **Reliable**: DOM-based scanning captures images that API interceptors miss
- **Flexible**: Multiple filters to find exactly what you need
- **Efficient**: Batch download with automatic naming
- **Convertible**: Output in your preferred format (JPEG, PNG, WebP)
- **Privacy-Focused**: All processing happens locally in your browser

## Features

| Feature | Description |
|---------|-------------|
| **Auto-Capture** | Automatically scans and captures product images from Taobao/Tmall pages |
| **DOM-Based Scanning** | Reliable image extraction using DOM scanning instead of API interception |
| **Type Filter** | Filter images by format (JPEG/PNG/WebP) |
| **Resolution Filter** | Slider to filter images by minimum width/height (0-2000px) |
| **Limit Filter** | Limit the number of images displayed (1-200) |
| **Format Conversion** | Convert images to Original, JPEG, PNG, or WebP on download |
| **Batch Download** | Download multiple images at once with sequential processing |
| **Auto-Naming** | Files named using product title or product ID |
| **High Resolution** | Automatically upgrades thumbnail URLs to full-resolution images |

## Installation

### Chrome / Edge / Brave

1. **Download**: Get the latest release from [GitHub Releases](https://github.com/henglyrepo/Taobao-Image-Downloader/releases)
2. **Extract**: Unzip the downloaded file
3. **Open Extensions**: Navigate to `chrome://extensions/`
4. **Enable Developer Mode**: Toggle the switch in the top-right corner
5. **Load Unpacked**: Click the button and select the extracted folder
6. **Pin to Toolbar**: Click the puzzle piece icon in Chrome and pin Taobao Image Downloader

### Firefox (Coming Soon)

Firefox support is planned. Stay tuned for updates.

## Quick Start

1. Visit any Taobao or Tmall product page
2. Click the extension icon in your browser toolbar
3. Wait for images to load (or click "Scan DOM")
4. Use filters to narrow down results
5. Select images and click "Download"

## Usage Guide

### Interface Overview

```
┌─────────────────────────────────────────────────────────┐
│  Taobao/Tmall Image Downloader                    [X]  │
├─────────────────────────────────────────────────────────┤
│  Type: [All ▼]  Min Res: [━━━━●━━━] 0px  [HD]        │
│  Limit: [━━━━━━━●] 200           [All]                │
│  Output: [Original ▼]  [✓] Ask where to save          │
│  [Scan DOM] [Debug] [Clear] [Refresh]                 │
├─────────────────────────────────────────────────────────┤
│  5 selected    25 images                               │
├─────────────────────────────────────────────────────────┤
│  ☑ [IMG] Product Image                               │
│      800 x 800 - PNG                                   │
│      Click to load size...                             │
│                                                         │
│  ☑ [IMG] Product Image                               │
│      1200 x 1200 - JPEG                               │
│      Click to load size...                             │
│                                                         │
│  ...                                                   │
├─────────────────────────────────────────────────────────┤
│  [Select All]  [Download (5)]                         │
└─────────────────────────────────────────────────────────┘
```

### Controls Reference

| Control | Description | Usage |
|---------|-------------|-------|
| **Type** | Filter by image format | Select "JPEG" to show only JPEG images |
| **Min Res** | Minimum resolution filter | Slide to filter small images |
| **HD** | Quick HD filter | Toggle 800px minimum |
| **Limit** | Max images to show | Slide to limit displayed images |
| **All** | Quick limit toggle | Toggle between 50 and 200 |
| **Output** | Download format | Choose Original/JPEG/PNG/WebP |
| **Scan DOM** | Manual scan trigger | Force rescan current page |
| **Debug** | View captured URLs | See all captured image URLs |
| **Clear** | Clear cache | Remove all captured images |
| **Refresh** | Reload and scan | Refresh page and rescan |

### Filename Convention

Images are automatically named using:

```
{ProductTitle}_{number}.{extension}
```

Or if title is unavailable:

```
{ProductID}_{number}.{extension}
```

**Examples:**
- `iPhone 15 Pro Max_1.jpg`
- `858036536367_1.png`
- `Product Name_10.webp`

When converting formats, the extension automatically updates the file extension.

## Permissions

This extension requires the following permissions:

| Permission | Purpose |
|------------|---------|
| `activeTab` | Access the current tab's content for scanning |
| `scripting` | Inject content script for DOM manipulation |
| `downloads` | Save downloaded images to your device |
| `storage` | Temporarily cache captured images |

### Host Permissions

The extension only accesses these domains:

- `*.taobao.com` - Main Taobao domain
- `*.tmall.com` - Tmall domain
- `*.tmall.hk` - Tmall Hong Kong
- `*.tbcdn.cn` - Taobao CDN
- `*.alicdn.com` - Alibaba CDN
- `*.gtimg.cn` - Tencent CDN (used by some images)

**We do not collect, transmit, or store any personal data.** All image processing happens locally in your browser.

## Technical Details

### Architecture

```
┌────────────────────┐     ┌────────────────────┐     ┌────────────────────┐
│    content.js      │────▶│   background.js    │────▶│     popup.js       │
│                    │     │                    │     │                    │
│  • DOM Scanner     │     │  • Storage Manager │     │  • UI Controller   │
│  • Image Extractor│     │  • Download Queue  │     │  • Filter Logic    │
│  • Product ID/Title│     │  • Format Converter│     │  • Event Handler   │
└────────────────────┘     └────────────────────┘     └────────────────────┘
```

### Message Flow

1. **content.js** runs on the product page and scans the DOM for images
2. Extracts product information (title, ID) from the page
3. Sends image data to **background.js** via Chrome messaging API
4. **background.js** stores images in chrome.storage.local
5. **popup.js** queries and displays captured images with filters
6. When downloading, **background.js** handles format conversion (if selected)
7. Downloads are processed sequentially to avoid conflicts

### Format Conversion

The extension uses the HTML5 Canvas API for format conversion:

- **Original**: Downloads in the source format (no conversion)
- **JPEG**: Converts to JPEG format
- **PNG**: Converts to PNG format
- **WebP**: Converts to WebP format

> **Note**: Format conversion involves re-encoding, which may result in minor quality changes. For best quality, use "Original" format.

## Tech Stack

- **Language**: Vanilla JavaScript (ES6+)
- **Platform**: Chrome Extension API (Manifest V3)
- **UI**: HTML5 + CSS3
- **Image Processing**: Canvas API
- **Dependencies**: None (zero dependencies)

## Contributing

Contributions are welcome! Here's how you can help:

### Development Setup

```bash
# Clone the repository
git clone https://github.com/henglyrepo/Taobao-Image-Downloader.git

# Navigate to the project
cd Taobao-Image-Downloader

# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes
# Edit files as needed

# Test by loading the extension in Chrome:
# 1. Go to chrome://extensions/
# 2. Enable Developer mode
# 3. Click "Load unpacked"
# 4. Select this directory

# Commit your changes
git add .
git commit -m "Add your feature description"

# Push and create PR
git push origin feature/your-feature-name
```

### Guidelines

- Follow existing code style (ES6+, camelCase)
- Add comments for complex logic
- Test thoroughly before submitting
- Update documentation if needed

### Reporting Issues

Found a bug or have a feature request? Please [open an issue](https://github.com/henglyrepo/Taobao-Image-Downloader/issues) with:

1. Clear description of the issue/feature
2. Steps to reproduce (for bugs)
3. Screenshots if applicable
4. Browser and extension version

## FAQ

### Q: Why are no images captured?
**A**: Make sure you're on a Taobao or Tmall product page. Try clicking "Scan DOM" button to manually trigger scanning. Also check the Debug button to see captured URLs.

### Q: Does this work on mobile?
**A**: This is a browser extension for desktop Chrome/Edge. For mobile, you'd need a different solution.

### Q: Is my data safe?
**A**: Yes! This extension:
- Does not collect any personal data
- Does not send data to any server
- All processing happens locally in your browser
- No analytics or tracking

### Q: Why is the quality not as expected?
**A**: 
1. Check the "Min Res" filter - you might be filtering out high-res images
2. If converting formats, use "Original" for best quality
3. Some images on Taobao are only available in lower resolutions

### Q: Can I download all images at once?
**A**: Yes! Click "Select All" then "Download". The limit slider controls how many images are shown in the list, but you can adjust it up to 200.

## Changelog

See [GitHub Releases](https://github.com/henglyrepo/Taobao-Image-Downloader/releases) for version history.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you find this extension helpful, please:
- ⭐ Star the repository
- 🐛 Report bugs via GitHub Issues
- 💡 Suggest features

## Disclaimer

This extension is not affiliated with, endorsed by, or connected to Alibaba, Taobao, Tmall, or any of their subsidiaries. This tool is provided for educational and personal use only. Please respect the website's terms of service and use responsibly.

---

<p align="center">
  Made with ❤️ for the community
</p>
