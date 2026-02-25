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

  async function convertImageToFormat(imageUrl, targetFormat) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          
          const mimeType = `image/${targetFormat}`;
          const dataUrl = canvas.toDataURL(mimeType, 1.0);
          
          // Convert data URL to blob URL for download
          fetch(dataUrl)
            .then(res => res.blob())
            .then(blob => {
              const blobUrl = URL.createObjectURL(blob);
              resolve(blobUrl);
            })
            .catch(reject);
        } catch (e) {
          reject(e);
        }
      };
      
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  }

  if (message.action === 'downloadBatch') {
    console.log('[Image Downloader] Batch download:', message.images?.length, 'images');
    console.log('[Image Downloader] Convert format:', message.convertFormat, 'Target:', message.targetType);
    
    const images = message.images || [];
    const saveAs = message.saveAs !== undefined ? message.saveAs : false;
    const convertFormat = message.convertFormat || false;
    const targetType = message.targetType || 'jpg';
    
    async function processBatch() {
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        console.log('[Image Downloader] Processing:', i + 1, '/', images.length, '-', img.filename);
        
        try {
          let downloadUrl = img.url;
          let filename = img.filename;
          
          // Convert if needed
          if (convertFormat && targetType !== 'all') {
            console.log('[Image Downloader] Converting to', targetType);
            downloadUrl = await convertImageToFormat(img.url, targetType);
          }
          
          await new Promise((resolve) => {
            chrome.downloads.download({
              url: downloadUrl,
              filename: filename,
              saveAs: saveAs && i === 0
            }, (downloadId) => {
              if (chrome.runtime.lastError) {
                console.error('[Image Downloader] Download error:', chrome.runtime.lastError.message);
              }
              resolve();
            });
          });
          
          // Clean up blob URL if created
          if (convertFormat && targetType !== 'all') {
            URL.revokeObjectURL(downloadUrl);
          }
          
        } catch (e) {
          console.error('[Image Downloader] Conversion/download error:', e);
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
