let images = [];
let selectedImages = new Set();
let productTitle = null;
let productId = null;

function getImageType(url) {
  if (!url) return 'jpg';
  if (url.includes('.png')) return 'png';
  if (url.includes('.webp')) return 'webp';
  if (url.includes('.gif')) return 'gif';
  return 'jpg';
}

function cleanFilename(name) {
  if (!name) return 'image';
  return name.replace(/[<>:"/\\|?*]/g, '').trim().substring(0, 50);
}

function getHighResUrl(url) {
  if (!url) return url;
  
  if (url.includes('alicdn.com') || url.includes('tbcdn.cn') || url.includes('taobao.com') || url.includes('tmall.com')) {
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

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', async () => {
  const typeFilter = document.getElementById('typeFilter');
  const resFilter = document.getElementById('resFilter');
  const resValue = document.getElementById('resValue');
  const resPresetBtn = document.getElementById('resPresetBtn');
  const saveAsCheckbox = document.getElementById('saveAs');
  const imageList = document.getElementById('imageList');
  const selectAllBtn = document.getElementById('selectAllBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const selectedCount = document.getElementById('selectedCount');
  const totalCount = document.getElementById('totalCount');
  const debugBtn = document.getElementById('debugBtn');
  const clearBtn = document.getElementById('clearBtn');
  const refreshBtn = document.getElementById('refreshBtn');
  const scanDomBtn = document.getElementById('scanDomBtn');

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if (!tab.url || (!tab.url.includes('taobao.com') && !tab.url.includes('tmall.com'))) {
    imageList.innerHTML = '<div class="status error">Please visit Taobao or Tmall first</div>';
    return;
  }

  // Clear previous captures on popup open
  await chrome.runtime.sendMessage({ action: 'clearImages' });
  images = [];
  selectedImages.clear();

  // Get saved settings
  const savedSettings = await chrome.storage.local.get(['typeFilter', 'saveAs', 'resFilter']);
  if (savedSettings.typeFilter) typeFilter.value = savedSettings.typeFilter;
  if (savedSettings.saveAs !== undefined) saveAsCheckbox.checked = savedSettings.saveAs;
  if (savedSettings.resFilter) {
    resFilter.value = savedSettings.resFilter;
    resValue.textContent = savedSettings.resFilter;
  }

  // Request fresh scan from content script
  try {
    await chrome.tabs.sendMessage(tab.id, { action: 'scanDOM' });
  } catch (e) {
    console.log('[Popup] Could not trigger scan:', e.message);
  }

  // Wait a bit for scan to complete
  await new Promise(resolve => setTimeout(resolve, 1500));

  async function loadImages() {
    try {
      const result = await chrome.runtime.sendMessage({ action: 'getImages' });
      
      // Handle both old format (array) and new format (object)
      let capturedImages = [];
      if (Array.isArray(result)) {
        capturedImages = result;
        productTitle = null;
        productId = null;
      } else if (result && Array.isArray(result.images)) {
        capturedImages = result.images;
        productTitle = result.productInfo?.title || null;
        productId = result.productInfo?.id || null;
      }
      
      console.log('[Popup] Captured images:', capturedImages?.length || 0);
      console.log('[Popup] Product:', productTitle || 'N/A', 'ID:', productId || 'N/A');
      
      if (!capturedImages || capturedImages.length === 0) {
        imageList.innerHTML = '<div class="status">No images captured yet.<br><br>Try these steps:<br>1. Visit a Taobao/Tmall product page<br>2. Wait for images to load<br>3. Click Scan DOM button</div>';
        return false;
      }

      // Ensure capturedImages is an array before mapping
      if (!Array.isArray(capturedImages)) {
        capturedImages = [];
      }
      
      // Generate base filename from product title or ID
      const baseName = cleanFilename(productTitle) || productId || 'image';
      
      images = capturedImages.map((img, idx) => {
        const src = getHighResUrl(img.src);
        let thumb = src;
        thumb = thumb.replace(/\.jpg_?\d*\.?\d*$/, '.jpg');
        thumb = thumb.replace(/_\d+x\d+/, '_200x200');
        thumb = thumb.replace(/_[0-9]+x[0-9]+/, '_200x200');
        
        return {
          src: src,
          thumb: thumb,
          alt: img.alt || '',
          width: 0,
          height: 0,
          type: getImageType(src),
          filename: `${baseName}_${idx + 1}.${getImageType(src)}`
        };
      });

      await loadImageDimensions();
      renderImages();
      return true;
      
    } catch (error) {
      console.error('[Popup] Error loading images:', error);
      imageList.innerHTML = `<div class="status error">Error: ${error.message}</div>`;
      return false;
    }
  }

  async function loadImageDimensions() {
    for (let i = 0; i < images.length; i++) {
      try {
        const img = new Image();
        await new Promise((resolve) => {
          img.onload = () => resolve();
          img.onerror = () => resolve();
          img.src = images[i].src;
        });
        images[i].width = img.width || 0;
        images[i].height = img.height || 0;
      } catch (e) {
        images[i].width = 0;
        images[i].height = 0;
      }
    }
  }

  function renderImages() {
    // Ensure images is always an array
    if (!Array.isArray(images)) {
      images = [];
    }
    
    const filter = typeFilter.value;
    const minRes = parseInt(resFilter.value) || 0;
    
    let filtered = images;
    if (filter !== 'all') {
      filtered = filtered.filter(img => img && img.type === filter);
    }
    if (minRes > 0) {
      filtered = filtered.filter(img => img && (img.width >= minRes || img.height >= minRes));
    }
    
    totalCount.textContent = `${filtered.length} images`;
    
    if (filtered.length === 0) {
      imageList.innerHTML = '<div class="status">No images found</div>';
      return;
    }

    imageList.innerHTML = filtered.map((img) => `
      <div class="image-item ${selectedImages.has(img.src) ? 'selected' : ''}" data-url="${escapeHtml(img.src)}">
        <div class="checkbox-wrapper">
          <input type="checkbox" ${selectedImages.has(img.src) ? 'checked' : ''}>
        </div>
        <img class="image-thumb" src="${escapeHtml(img.thumb)}" alt="${escapeHtml(img.alt)}" loading="lazy" onerror="this.src='${escapeHtml(img.src)}'">
        <div class="image-info">
          <div class="image-name">${escapeHtml(img.alt) || 'Product Image'}</div>
          <div class="image-meta">${img.width > 0 ? `${img.width} x ${img.height}` : 'Loading...'} - ${img.type.toUpperCase()}</div>
          <div class="image-size" data-url="${escapeHtml(img.src)}">Click to load size...</div>
        </div>
      </div>
    `).join('');

    updateCount();
  }

  async function loadImageSize(url) {
    const sizeEl = imageList.querySelector(`.image-size[data-url="${CSS.escape(url)}"]`);
    if (!sizeEl || sizeEl.textContent !== 'Click to load size...') return;
    
    const img = images.find(i => i.src === url);
    if (!img) return;
    
    try {
      const response = await fetch(img.src, { method: 'HEAD' });
      const contentLength = response.headers.get('content-length');
      if (contentLength) {
        const bytes = parseInt(contentLength);
        const size = bytes < 1024 ? `${bytes} B` : 
                     bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : 
                     `${(bytes / 1048576).toFixed(1)} MB`;
        sizeEl.textContent = size;
      } else {
        sizeEl.textContent = 'Unknown';
      }
    } catch (e) {
      sizeEl.textContent = 'Unknown';
    }
  }

  function updateCount() {
    selectedCount.textContent = `${selectedImages.size} selected`;
    downloadBtn.disabled = selectedImages.size === 0;
    downloadBtn.textContent = selectedImages.size > 0 
      ? `Download (${selectedImages.size})` 
      : 'Download';
  }

  imageList.addEventListener('click', async (e) => {
    const item = e.target.closest('.image-item');
    if (!item) return;
    
    const url = item.dataset.url;
    if (!url) return;
    
    const checkbox = item.querySelector('input[type="checkbox"]');
    if (e.target === checkbox) {
      if (selectedImages.has(url)) {
        selectedImages.delete(url);
      } else {
        selectedImages.add(url);
      }
      item.classList.toggle('selected', selectedImages.has(url));
      updateCount();
      return;
    }

    if (e.target.classList.contains('image-size')) {
      await loadImageSize(url);
    } else {
      checkbox.checked = !checkbox.checked;
      if (checkbox.checked) {
        selectedImages.add(url);
      } else {
        selectedImages.delete(url);
      }
      item.classList.toggle('selected', selectedImages.has(url));
      updateCount();
    }
  });

  selectAllBtn.addEventListener('click', () => {
    // Ensure images is an array
    if (!Array.isArray(images)) {
      images = [];
    }
    
    const filter = typeFilter.value;
    const minRes = parseInt(resFilter.value) || 0;
    
    let filtered = images;
    if (filter !== 'all') {
      filtered = filtered.filter(img => img && img.type === filter);
    }
    if (minRes > 0) {
      filtered = filtered.filter(img => img && (img.width >= minRes || img.height >= minRes));
    }
    
    const allSelected = filtered.length > 0 && filtered.every(img => selectedImages.has(img.src));
    
    if (allSelected) {
      filtered.forEach(img => selectedImages.delete(img.src));
    } else {
      filtered.forEach(img => selectedImages.add(img.src));
    }
    
    document.querySelectorAll('.image-item').forEach(item => {
      const url = item.dataset.url;
      const checkbox = item.querySelector('input');
      checkbox.checked = selectedImages.has(url);
      item.classList.toggle('selected', selectedImages.has(url));
    });
    
    selectAllBtn.textContent = allSelected ? 'Select All' : 'Deselect All';
    updateCount();
  });

  downloadBtn.addEventListener('click', async () => {
    const saveAs = saveAsCheckbox.checked;
    const urlsToDownload = [...selectedImages];
    
    if (urlsToDownload.length === 0) return;
    
    downloadBtn.disabled = true;
    downloadBtn.textContent = 'Downloading...';
    
    // Build the batch of images to download
    const imagesToDownload = urlsToDownload.map(url => {
      const img = images.find(image => image.src === url);
      return {
        url: img ? img.src : url,
        filename: img ? img.filename : 'image.jpg'
      };
    }).filter(img => img.url);
    
    try {
      // Send all downloads at once to background
      await chrome.runtime.sendMessage({
        action: 'downloadBatch',
        images: imagesToDownload,
        saveAs: saveAs
      });
    } catch (e) {
      console.error('Download error:', e);
    }
    
    selectedImages.clear();
    renderImages();
    downloadBtn.disabled = false;
    downloadBtn.textContent = 'Download';
  });

  typeFilter.addEventListener('change', async () => {
    await chrome.storage.local.set({ typeFilter: typeFilter.value });
    selectedImages.clear();
    renderImages();
  });

  resFilter.addEventListener('input', async () => {
    resValue.textContent = resFilter.value;
    await chrome.storage.local.set({ resFilter: parseInt(resFilter.value) });
    selectedImages.clear();
    renderImages();
  });

  resPresetBtn.addEventListener('click', async () => {
    if (resFilter.value > 0) {
      resFilter.value = 0;
      resValue.textContent = '0';
    } else {
      resFilter.value = 800;
      resValue.textContent = '800';
    }
    await chrome.storage.local.set({ resFilter: parseInt(resFilter.value) });
    selectedImages.clear();
    renderImages();
  });

  saveAsCheckbox.addEventListener('change', async () => {
    await chrome.storage.local.set({ saveAs: saveAsCheckbox.checked });
  });

  debugBtn.addEventListener('click', async () => {
    const result = await chrome.runtime.sendMessage({ action: 'getImages' });
    
    // Handle both old format (array) and new format (object)
    let capturedImages = [];
    let productInfo = {};
    if (Array.isArray(result)) {
      capturedImages = result;
    } else if (result) {
      capturedImages = result.images || [];
      productInfo = result.productInfo || {};
    }
    
    const apiResult = await chrome.runtime.sendMessage({ action: 'getApiResponse' });
    const apiData = apiResult?.lastApiResponse || {};
    const storedProductInfo = apiResult?.productInfo || {};
    
    let html = '<div style="padding:10px;max-height:400px;overflow:auto;">';
    html += `<p><strong>Product Title:</strong> ${productInfo?.title || storedProductInfo?.title || 'N/A'}</p>`;
    html += `<p><strong>Product ID:</strong> ${productInfo?.id || storedProductInfo?.id || 'N/A'}</p>`;
    html += `<p><strong>Last API:</strong> ${apiData?.url || 'None'}</p>`;
    html += `<p><strong>Images captured:</strong> ${capturedImages?.length || 0}</p>`;
    html += '<hr/>';
    html += '<p><strong>Image URLs:</strong></p>';
    if (capturedImages && capturedImages.length > 0) {
      html += '<ul style="font-size:10px;word-break:break-all;">';
      capturedImages.forEach((img, i) => {
        html += `<li>${i+1}. ${escapeHtml(img.src)}</li>`;
      });
      html += '</ul>';
    } else {
      html += '<p>No images captured yet.</p>';
    }
    html += '</div>';
    imageList.innerHTML = html;
  });

  scanDomBtn.addEventListener('click', async () => {
    scanDomBtn.textContent = 'Scanning...';
    scanDomBtn.disabled = true;
    
    // Clear before scanning
    await chrome.runtime.sendMessage({ action: 'clearImages' });
    images = [];
    selectedImages.clear();
    
    try {
      await chrome.tabs.sendMessage(tab.id, { action: 'scanDOM' });
      setTimeout(async () => {
        await loadImages();
        scanDomBtn.textContent = 'Scan DOM';
        scanDomBtn.disabled = false;
      }, 1500);
    } catch (e) {
      console.error('Scan DOM error:', e);
      scanDomBtn.textContent = 'Scan DOM';
      scanDomBtn.disabled = false;
    }
  });

  clearBtn.addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ action: 'clearImages' });
    images = [];
    selectedImages.clear();
    renderImages();
    imageList.innerHTML = '<div class="status">Cache cleared.<br>Click "Scan DOM" to capture images.</div>';
  });

  refreshBtn.addEventListener('click', async () => {
    imageList.innerHTML = '<div class="loading"><div class="spinner"></div>Refreshing...</div>';
    
    // Clear before reload
    await chrome.runtime.sendMessage({ action: 'clearImages' });
    images = [];
    selectedImages.clear();
    
    await chrome.tabs.reload(tab.id);
    
    setTimeout(async () => {
      const hasImages = await loadImages();
      if (!hasImages) {
        imageList.innerHTML = '<div class="status">No images captured.<br><br>Please:<br>1. Wait for the page to fully load<br>2. Scroll through product images<br>3. Try clicking refresh again</div>';
      }
    }, 4000);
  });

  await loadImages();
});
