# Taobao Image Downloader

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.1-blue?style=for-the-badge" alt="Version">
  <img src="https://img.shields.io/badge/license-MIT-green?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/Chrome-Extension-blue?style=for-the-badge&logo=google-chrome" alt="Chrome Extension">
</p>

A powerful Chrome/Firefox browser extension that captures and downloads high-resolution product images from Taobao and Tmall e-commerce websites.

## Why This Extension?

- **Reliable**: DOM-based scanning captures images that API interceptors miss
- **Flexible**: Multiple filters to find exactly what you need
- **Efficient**: Batch download with automatic naming
- **Privacy-Focused**: All processing happens locally in your browser
- **Zero Dependencies**: Lightweight and fast

## Features

| Feature | Description |
|---------|-------------|
| **Auto-Capture** | Automatically scans and captures product images from Taobao/Tmall pages |
| **DOM-Based Scanning** | Reliable image extraction using DOM scanning |
| **Type Filter** | Filter images by format (JPEG/PNG/WebP) |
| **Resolution Filter** | Filter images by minimum width/height (0-2000px) |
| **Limit Filter** | Limit the number of images displayed (1-200) |
| **Batch Download** | Download multiple images at once |
| **Auto-Naming** | Files named using product title or product ID |
| **High Resolution** | Automatically upgrades thumbnail URLs to full-resolution |

## Installation

### Chrome / Edge / Brave

1. **Download**: Get the latest release from [GitHub Releases](https://github.com/henglyrepo/Taobao-Image-Downloader/releases)
2. **Extract**: Unzip the downloaded file
3. **Open Extensions**: Navigate to `chrome://extensions/`
4. **Enable Developer Mode**: Toggle the switch in the top-right corner
5. **Load Unpacked**: Click the button and select the extracted folder
6. **Pin to Toolbar**: Click the puzzle piece icon and pin Taobao Image Downloader

## Quick Start

1. Visit any Taobao or Tmall product page
2. Click the extension icon in your browser toolbar
3. Wait for images to load (or click "Scan DOM")
4. Use filters to narrow down results
5. Select images and click "Download"

## Interface

![Interface](images/interface.png)

### Controls Reference

| Control | Description |
|---------|-------------|
| **Scan DOM** | Manually scan the page for images |
| **Refresh** | Reload the page and rescan |
| **Clear** | Clear cached images |
| **Debug** | View captured image URLs |
| **Type** | Filter by image format (All/JPEG/PNG/WebP) |
| **Min** | Minimum resolution filter (0-2000px) |
| **Limit** | Max images to display (1-200) |

### Filename Convention

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

## Permissions

| Permission | Purpose |
|------------|---------|
| `activeTab` | Access the current tab for scanning |
| `scripting` | Inject content script for DOM manipulation |
| `downloads` | Save downloaded images to your device |
| `storage` | Temporarily cache captured images |

### Host Permissions

The extension only accesses these domains:

- `*.taobao.com`
- `*.tmall.com`
- `*.tmall.hk`
- `*.tbcdn.cn`
- `*.alicdn.com`
- `*.gtimg.cn`

**We do not collect, transmit, or store any personal data.**

## Architecture

```
┌────────────────────┐     ┌────────────────────┐     ┌────────────────────┐
│    content.js      │────▶│   background.js    │────▶│     popup.js       │
│                    │     │                    │     │                    │
│  • DOM Scanner     │     │  • Storage Manager │     │  • UI Controller   │
│  • Image Extractor │     │  • Download Queue  │     │  • Filter Logic    │
└────────────────────┘     └────────────────────┘     └────────────────────┘
```

## Tech Stack

- **Language**: Vanilla JavaScript (ES6+)
- **Platform**: Chrome Extension API (Manifest V3)
- **UI**: HTML5 + CSS3
- **Dependencies**: None

## Contributing

```bash
# Clone the repository
git clone https://github.com/henglyrepo/Taobao-Image-Downloader.git

# Create a feature branch
git checkout -b feature/your-feature-name

# Make your changes and commit
git add .
git commit -m "Add your feature"

# Push and create PR
git push origin feature/your-feature-name
```

## FAQ

### Why are no images captured?
Make sure you're on a Taobao or Tmall product page. Try clicking "Scan DOM" to manually trigger scanning.

### Does this work on mobile?
This is a browser extension for desktop Chrome/Edge only.

### Is my data safe?
Yes - no data is collected or transmitted. All processing happens locally in your browser.

## License

MIT License - see the [LICENSE](LICENSE) file for details.

## Disclaimer

This extension is not affiliated with, endorsed by, or connected to Alibaba, Taobao, Tmall, or any of their subsidiaries. This tool is provided for educational and personal use only.

---

<p align="center">
  Made for the community
</p>
