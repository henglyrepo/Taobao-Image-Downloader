(function() {
  'use strict';
  
  console.log('[Image Downloader] Content script loaded');

  const CDN_DOMAINS = ['alicdn.com', 'tbcdn.cn', 'taobao.com', 'tmall.com', 'tmall.hk', 'gtimg.cn', 'gw.alicdn.com', 'gw2.alicdn.com', 'gw3.alicdn.com', 'img.alicdn.com'];
  
  const MIN_IMAGE_SIZE = 50;
  
  const imageUrls = new Set();
  let debounceTimer = null;

  function isCDNUrl(url) {
    if (!url) return false;
    return CDN_DOMAINS.some(domain => url.includes(domain));
  }

  function getHighResUrl(url) {
    if (!url) return url;
    
    if (isCDNUrl(url)) {
      url = url.replace(/_\d+x\d+q\d+\./, '.');
      url = url.replace(/_[0-9]+x[0-9]+\./, '.');
      url = url.replace(/_\d+q\d+\./, '.');
      url = url.replace(/\.jpg_\d+\.\d+\./, '.');
      url = url.replace(/\.jpeg_\d+\.\d+\./, '.');
      url = url.replace(/\.png_\d+\.\d+\./, '.');
      url = url.replace(/\.webp_\d+\.\d+\./, '.');
    }
    
    return url;
  }

  function isSmallThumbnail(url) {
    if (!url) return true;
    const smallPatterns = ['_20x20', '_30x30', '_50x50', '_60x60', '_80x80', '_100x100', '_120x120'];
    return smallPatterns.some(pattern => url.includes(pattern));
  }

  function getImageType(url) {
    if (!url) return 'jpg';
    if (url.includes('.png')) return 'png';
    if (url.includes('.webp')) return 'webp';
    if (url.includes('.gif')) return 'gif';
    return 'jpg';
  }

  function getProductTitle() {
    try {
      const ogTitle = document.querySelector('meta[property="og:title"]');
      if (ogTitle && ogTitle.content) return ogTitle.content.trim();
      
      const titleEl = document.querySelector('.tb-title, .product-title, h1[class*="title"], .title, #itemTitle');
      if (titleEl) return titleEl.textContent.trim();
      
      const h1 = document.querySelector('h1');
      if (h1 && h1.textContent.trim()) return h1.textContent.trim();
      
      if (document.title) {
        return document.title.split('_')[0].split('-')[0].split('|')[0].trim();
      }
    } catch (e) {}
    return null;
  }

  function getProductId() {
    try {
      const url = window.location.href;
      let match = url.match(/[?&]id=([0-9]+)/);
      if (match) return match[1];
      
      match = url.match(/\/item\/(\d+)/);
      if (match) return match[1];
      
      match = url.match(/i(\d{10,})/);
      if (match) return match[1];
      
      match = url.match(/\.(\d{10,})\./);
      if (match) return match[1];
    } catch (e) {}
    return null;
  }

  function normalizeUrl(url) {
    if (!url || typeof url !== 'string') return null;
    
    url = url.trim();
    if (!url) return null;
    
    if (url.startsWith('//')) {
      url = 'https:' + url;
    } else if (url.startsWith('/') && !url.startsWith('//')) {
      url = 'https://img.alicdn.com' + url;
    }
    
    if (!url.startsWith('http')) return null;
    
    return url;
  }

  function extractImagesFromElement(img) {
    const urls = [];
    
    if (img.src && isCDNUrl(img.src)) {
      urls.push(img.src);
    }
    
    const lazyAttrs = ['data-src', 'data-original', 'data-lazy', 'data-ks-lazyload', 'data-src-full', 'data-image', 'data-img', 'data-thumb', 'data-main'];
    for (const attr of lazyAttrs) {
      const val = img.getAttribute(attr);
      if (val && isCDNUrl(val)) {
        urls.push(val);
      }
    }
    
    if (img.srcset) {
      const srcsetUrls = img.srcset.split(',').map(s => s.trim().split(' ')[0]);
      srcsetUrls.forEach(url => {
        if (isCDNUrl(url)) urls.push(url);
      });
    }
    
    return urls;
  }

  function extractFromPictureElement(picture) {
    const urls = [];
    const sources = picture.querySelectorAll('source');
    sources.forEach(source => {
      const srcset = source.srcset || source.getAttribute('data-srcset');
      if (srcset) {
        const srcsetUrls = srcset.split(',').map(s => s.trim().split(' ')[0]);
        srcsetUrls.forEach(url => {
          if (isCDNUrl(url)) urls.push(url);
        });
      }
    });
    return urls;
  }

  function extractFromAnchorElement(anchor) {
    const urls = [];
    const href = anchor.href;
    if (href && isCDNUrl(href) && (href.includes('.jpg') || href.includes('.jpeg') || href.includes('.png') || href.includes('.webp') || href.includes('.gif'))) {
      urls.push(href);
    }
    return urls;
  }

  function extractFromStyle(element) {
    const urls = [];
    try {
      const style = window.getComputedStyle(element);
      const bgImage = style.backgroundImage;
      if (bgImage && bgImage !== 'none') {
        const matches = bgImage.match(/url\(['"]?([^'")\s]+)['"]?\)/g);
        if (matches) {
          matches.forEach(match => {
            const url = match.replace(/url\(['"]?/, '').replace(/['"]?\)/, '');
            if (isCDNUrl(url)) {
              urls.push(url);
            }
          });
        }
      }
    } catch (e) {}
    return urls;
  }

  function scanDOM() {
    const foundUrls = new Set();
    
    const imgElements = document.querySelectorAll('img');
    imgElements.forEach(img => {
      const urls = extractImagesFromElement(img);
      urls.forEach(url => foundUrls.add(url));
    });
    
    const pictureElements = document.querySelectorAll('picture');
    pictureElements.forEach(picture => {
      const urls = extractFromPictureElement(picture);
      urls.forEach(url => foundUrls.add(url));
    });
    
    const anchors = document.querySelectorAll('a[href]');
    anchors.forEach(anchor => {
      const urls = extractFromAnchorElement(anchor);
      urls.forEach(url => foundUrls.add(url));
    });
    
    const divs = document.querySelectorAll('div[style*="background"]');
    divs.forEach(div => {
      const urls = extractFromStyle(div);
      urls.forEach(url => foundUrls.add(url));
    });
    
    const videos = document.querySelectorAll('video[poster]');
    videos.forEach(video => {
      const poster = video.getAttribute('poster');
      if (poster && isCDNUrl(poster)) {
        foundUrls.add(poster);
      }
    });
    
    const lazyDivs = document.querySelectorAll('[data-src], [data-original], [data-lazy], [data-image], [data-img], [data-bg]');
    lazyDivs.forEach(div => {
      const attrs = ['data-src', 'data-original', 'data-lazy', 'data-image', 'data-img', 'data-bg', 'data-background-image'];
      attrs.forEach(attr => {
        const val = div.getAttribute(attr);
        if (val && isCDNUrl(val)) {
          foundUrls.add(val);
        }
      });
    });
    
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
      try {
        const text = script.textContent;
        if (text && text.length < 100000) {
          const urlMatches = text.match(/https?:\/\/[^"'\s]+alicdn\.com[^"'\s]*/gi);
          if (urlMatches) {
            urlMatches.forEach(url => {
              if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || url.includes('.webp') || url.includes('.gif')) {
                foundUrls.add(url);
              }
            });
          }
        }
      } catch (e) {}
    });
    
    const processedImages = [];
    
    foundUrls.forEach(url => {
      const normalized = normalizeUrl(url);
      if (!normalized) return;
      
      if (isSmallThumbnail(normalized)) return;
      
      const highRes = getHighResUrl(normalized);
      
      if (!imageUrls.has(highRes)) {
        imageUrls.add(highRes);
        processedImages.push({
          src: highRes,
          alt: '',
          type: getImageType(highRes)
        });
      }
    });
    
    if (processedImages.length > 0) {
      console.log('[Image Downloader] DOM scan found', processedImages.length, 'new images');
      chrome.runtime.sendMessage({
        action: 'apiResponse',
        url: window.location.href,
        images: processedImages,
        productTitle: getProductTitle(),
        productId: getProductId()
      });
    } else {
      console.log('[Image Downloader] DOM scan found 0 images');
    }
  }

  function debouncedScan() {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    debounceTimer = setTimeout(scanDOM, 500);
  }

  function setupMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      let shouldScan = false;
      
      for (const mutation of mutations) {
        if (mutation.addedNodes.length > 0) {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === Node.ELEMENT_NODE) {
              shouldScan = true;
              break;
            }
          }
        }
        if (shouldScan) break;
      }
      
      if (shouldScan) {
        debouncedScan();
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    console.log('[Image Downloader] MutationObserver installed');
  }

  function init() {
    setTimeout(scanDOM, 1000);
    setTimeout(scanDOM, 3000);
    setTimeout(scanDOM, 5000);
    
    if (document.body) {
      setupMutationObserver();
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(scanDOM, 1000);
        setupMutationObserver();
      });
    }
    
    console.log('[Image Downloader] DOM scanner initialized');
  }

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'scanDOM') {
      console.log('[Image Downloader] Manual DOM scan triggered');
      scanDOM();
      sendResponse({ success: true });
    }
    return true;
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
