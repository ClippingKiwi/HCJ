/**
 * Smart QR Application Logic
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const urlForm = document.getElementById('urlForm');
  const urlInput = document.getElementById('urlInput');
  const btnClear = document.getElementById('btnClear');
  const btnSubmit = document.getElementById('btnSubmit');
  const feedbackMsg = document.getElementById('feedbackMsg');
  
  const urlDock = document.getElementById('urlDock');
  const qrStage = document.getElementById('qrStage');
  const qrCard = document.getElementById('qrCard');
  const qrcodeContainer = document.getElementById('qrcode');
  const currentTargetUrl = document.getElementById('currentTargetUrl');
  
  const toast = document.getElementById('toastNotification');
  const toastText = document.getElementById('toastText');

  let qrInstance = null;
  let activeUrl = '';
  let toastTimer = null;

  // 1. Input interaction (Clear button visibility & feedback reset)
  urlInput.addEventListener('input', () => {
    toggleClearButton();
    clearFeedback();
  });

  btnClear.addEventListener('click', () => {
    urlInput.value = '';
    toggleClearButton();
    clearFeedback();
    urlInput.focus();
  });

  function toggleClearButton() {
    if (urlInput.value.trim().length > 0) {
      btnClear.classList.add('is-visible');
    } else {
      btnClear.classList.remove('is-visible');
    }
  }

  function showFeedback(msg) {
    feedbackMsg.textContent = msg;
    feedbackMsg.classList.add('is-visible');
  }

  function clearFeedback() {
    feedbackMsg.textContent = '';
    feedbackMsg.classList.remove('is-visible');
  }

  // 2. Form submission & QR generation
  urlForm.addEventListener('submit', (e) => {
    e.preventDefault();
    handleGenerate();
  });

  function formatUrl(rawInput) {
    let url = rawInput.trim();
    if (!url) return '';

    // If it doesn't have a protocol and looks like a domain or web address
    if (!/^https?:\/\//i.test(url)) {
      url = 'https://' + url;
    }
    return url;
  }

  function isValidUrl(string) {
    try {
      const parsed = new URL(string);
      return Boolean(parsed.hostname);
    } catch (_) {
      return false;
    }
  }

  function handleGenerate() {
    const rawVal = urlInput.value.trim();
    if (!rawVal) {
      showFeedback('변환할 URL 주소를 입력해 주세요.');
      urlInput.focus();
      return;
    }

    const formattedUrl = formatUrl(rawVal);
    if (!isValidUrl(formattedUrl)) {
      showFeedback('유효한 웹사이트 주소 형식을 입력해 주세요.');
      urlInput.focus();
      return;
    }

    clearFeedback();
    activeUrl = formattedUrl;

    // Transition Dock to bottom & Stage to center
    transitionToGeneratedState();

    // Render QR Code
    renderQrCode(formattedUrl);
  }

  function transitionToGeneratedState() {
    urlDock.classList.remove('is-centered');
    urlDock.classList.add('is-bottom');
    qrStage.classList.add('is-active');
  }

  function renderQrCode(url) {
    // Clear previous QR Code
    qrcodeContainer.innerHTML = '';

    // Generate new QR Code
    qrInstance = new QRCode(qrcodeContainer, {
      text: url,
      width: 256,
      height: 256,
      colorDark: '#0A0E17',
      colorLight: '#FFFFFF',
      correctLevel: QRCode.CorrectLevel.H
    });

    // qrcodejs가 기본적으로 canvas와 img를 동시 생성하므로, 중복 img를 제거하여 오직 1개만 표시
    const canvas = qrcodeContainer.querySelector('canvas');
    const img = qrcodeContainer.querySelector('img');
    if (canvas && img) {
      img.remove();
    }

    // Update Meta text
    currentTargetUrl.textContent = url;
    currentTargetUrl.title = url;
  }

  // 3. Download QR Code as JPG on Click
  qrCard.addEventListener('click', downloadQrAsJpg);
  qrCard.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      downloadQrAsJpg();
    }
  });

  function downloadQrAsJpg() {
    if (!activeUrl) return;

    // Find the canvas or img inside the QR container
    const canvas = qrcodeContainer.querySelector('canvas');
    const img = qrcodeContainer.querySelector('img');

    if (!canvas && !img) {
      showToast('QR 코드가 아직 준비되지 않았습니다.');
      return;
    }

    // High quality export canvas
    const exportCanvas = document.createElement('canvas');
    const exportSize = 640;
    const padding = 52;
    const bottomBannerHeight = 80;
    
    exportCanvas.width = exportSize;
    exportCanvas.height = exportSize + bottomBannerHeight;
    const ctx = exportCanvas.getContext('2d');

    // 1. Pure Crisp White Background (Essential for JPG transparency prevention)
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    // 2. Draw QR Code
    const qrDrawSize = exportSize - (padding * 2);
    ctx.imageSmoothingEnabled = false;

    if (canvas) {
      ctx.drawImage(canvas, padding, padding, qrDrawSize, qrDrawSize);
      finishExport();
    } else if (img && img.complete) {
      ctx.drawImage(img, padding, padding, qrDrawSize, qrDrawSize);
      finishExport();
    } else if (img) {
      img.onload = () => {
        ctx.drawImage(img, padding, padding, qrDrawSize, qrDrawSize);
        finishExport();
      };
    }

    function finishExport() {
      // 3. Draw Divider & Sleek Branding Info
      ctx.strokeStyle = '#E5E7EB';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding, exportSize - 10);
      ctx.lineTo(exportSize - padding, exportSize - 10);
      ctx.stroke();

      // Display URL
      ctx.fillStyle = '#4B5563';
      ctx.font = '500 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.textAlign = 'center';
      
      const maxChars = 45;
      const displayUrl = activeUrl.length > maxChars 
        ? activeUrl.substring(0, maxChars - 3) + '...' 
        : activeUrl;
      ctx.fillText(displayUrl, exportSize / 2, exportSize + 22);

      // Brand Watermark
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '600 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText('Smart QR Code', exportSize / 2, exportSize + 48);

      // Convert to JPG data URL
      const jpgDataUrl = exportCanvas.toDataURL('image/jpeg', 0.95);

      // Construct file name
      let filename = 'smart_qr.jpg';
      try {
        const parsed = new URL(activeUrl);
        const host = parsed.hostname.replace(/[^a-zA-Z0-9_-]/g, '_');
        if (host) {
          filename = `smart_qr_${host}.jpg`;
        }
      } catch (_) {}

      // Trigger automatic download
      const downloadLink = document.createElement('a');
      downloadLink.href = jpgDataUrl;
      downloadLink.download = filename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      showToast(`'${filename}' JPG 다운로드가 완료되었습니다!`);
    }
  }

  // 4. Toast notification helper
  function showToast(message) {
    if (toastTimer) {
      clearTimeout(toastTimer);
    }
    toastText.textContent = message;
    toast.classList.add('show');

    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, 2800);
  }
});
