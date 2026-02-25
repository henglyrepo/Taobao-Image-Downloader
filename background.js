chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'download') {
    console.log('[Image Downloader] Starting download:', message.filename);
    chrome.downloads.download({
      url: message.url,
      filename: message.filename,
      saveAs: message.saveAs !== undefined ? message.saveAs : false
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error('[Image Downloader] Download error:', chrome.runtime.lastError.message);
      } else {
        console.log('[Image Downloader] Download started, id:', downloadId);
      }
    });
    return true;
  }

  if (message.action === 'downloadBatch') {
    console.log('[Image Downloader] Batch download:', message.images?.length, 'images');
    
    const images = message.images || [];
    const saveAs = message.saveAs !== undefined ? message.saveAs : false;
    
    async function processBatch() {
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        console.log('[Image Downloader] Processing:', i + 1, '/', images.length, '-', img.filename);
        
        try {
          await new Promise((resolve) => {
            chrome.downloads.download({
              url: img.url,
              filename: img.filename,
              saveAs: saveAs && i === 0
            }, (downloadId) => {
              if (chrome.runtime.lastError) {
                console.error('[Image Downloader] Download error:', chrome.runtime.lastError.message);
              }
              resolve();
            });
          });
        } catch (e) {
          console.error('[Image Downloader] Download error:', e);
        }
        
        if (i < images.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
      console.log('[Image Downloader] Batch download complete');
    }
    
    processBatch();
    return true;
  }
  
  if (message.action === 'apiResponse') {
    console.log('[Image Downloader] Received images from:', message.url, 'Count:', message.images?.length);
    console.log('[Image Downloader] Product:', message.productTitle || 'N/A', 'ID:', message.productId || 'N/A');
    
    chrome.storage.local.get('capturedImages', (result) => {
      try {
        let existingImages = result.capturedImages || [];
        let capturedUrls = result.capturedUrls || [];
        
        if (message.images && message.images.length > 0) {
          const existingUrls = new Set(existingImages.map(img => img.src));
          let added = 0;
          for (const img of message.images) {
            if (!existingUrls.has(img.src)) {
              existingImages.push(img);
              added++;
            }
          }
          console.log('[Image Downloader] Added', added, 'new images. Total:', existingImages.length);
          
          if (!capturedUrls.includes(message.url)) {
            capturedUrls.push(message.url);
          }
        }
        
        chrome.storage.local.set({
          lastApiResponse: {
            url: message.url,
            timestamp: Date.now()
          },
          productInfo: {
            title: message.productTitle,
            id: message.productId
          },
          capturedImages: existingImages,
          capturedUrls: capturedUrls
        }, () => {
          if (chrome.runtime.lastError) {
            console.error('[Image Downloader] Storage error:', chrome.runtime.lastError);
          }
        });
      } catch (e) {
        console.error('[Image Downloader] Error processing images:', e);
      }
    });
    return true;
  }
  
  if (message.action === 'getApiResponse') {
    chrome.storage.local.get(['lastApiResponse', 'productInfo'], (result) => {
      sendResponse({
        lastApiResponse: result.lastApiResponse,
        productInfo: result.productInfo
      });
    });
    return true;
  }
  
  if (message.action === 'getImages') {
    chrome.storage.local.get(['capturedImages', 'productInfo'], (result) => {
      sendResponse({
        images: result.capturedImages || [],
        productInfo: result.productInfo
      });
    });
    return true;
  }
  
  if (message.action === 'clearImages') {
    chrome.storage.local.set({ 
      capturedImages: [], 
      capturedUrls: [],
      productInfo: null
    }, () => {
      console.log('[Image Downloader] Images cleared');
      sendResponse({ success: true });
    });
    return true;
  }
});

console.log('[Image Downloader] Background script loaded');
