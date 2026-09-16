(function () {
  'use strict';

  const uploadView = document.getElementById('uploadView');
  const editorView = document.getElementById('editorView');
  const dropzone   = document.getElementById('dropzone');
  const chooseBtn  = document.getElementById('chooseBtn');
  const fileInput  = document.getElementById('fileInput');
  const errorMsg   = document.getElementById('errorMsg');
  const previewImg = document.getElementById('previewImg');
  const fileName   = document.getElementById('fileName');
  const fileInfo   = document.getElementById('fileInfo');
  const resetBtn   = document.getElementById('resetBtn');

  const HIDDEN = 'is-hidden';

  const state = { file: null, objectUrl: null, width: 0, height: 0 };

  const downloadBtn = document.getElementById('downloadBtn');

  /* ---------- 화면 전환 (핵심) ---------- */

  function showUploadOnly() {
    uploadView.classList.remove(HIDDEN);
    uploadView.setAttribute('aria-hidden', 'false');
    editorView.classList.add(HIDDEN);
    editorView.setAttribute('aria-hidden', 'true');
  }

  function showEditorOnly() {
    uploadView.classList.add(HIDDEN);
    uploadView.setAttribute('aria-hidden', 'true');
    editorView.classList.remove(HIDDEN);
    editorView.setAttribute('aria-hidden', 'false');
    downloadBtn.disabled = false;          // ← 추가
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // 페이지 진입 시: 업로드 영역만 노출
  showUploadOnly();

  /* ---------- Helpers ---------- */

  function showError(message) {
    errorMsg.textContent = message || '';
  }

  function isGif(file) {
    return !!file && (file.type === 'image/gif' || /\.gif$/i.test(file.name));
  }

  function formatBytes(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  function revokeUrl() {
    if (state.objectUrl) {
      URL.revokeObjectURL(state.objectUrl);
      state.objectUrl = null;
    }
  }

  /* ---------- Load ---------- */

  function handleFiles(files) {
    showError('');
    if (!files || files.length === 0) return;

    if (files.length > 1) {
      showError('Please upload only one GIF file at a time.');
      return;
    }

    const file = files[0];
    if (!isGif(file)) {
      showError('Unsupported format. Please select a .gif file.');
      fileInput.value = '';
      return;
    }

    revokeUrl();

    const url = URL.createObjectURL(file);
    const probe = new Image();

    // 디코딩 성공을 확인한 뒤에만 화면을 전환
    probe.onload = function () {
      state.file = file;
      state.objectUrl = url;
      state.width = probe.naturalWidth;
      state.height = probe.naturalHeight;

      previewImg.src = url;
      fileName.textContent = file.name;
      fileInfo.textContent =
        state.width + ' × ' + state.height + ' px  ·  ' + formatBytes(file.size);

      showEditorOnly();
    };

    probe.onerror = function () {
      URL.revokeObjectURL(url);
      showError('Failed to load the GIF file. Please try another file.');
      fileInput.value = '';
      showUploadOnly();
    };

    probe.src = url;
  }

  /* ---------- Reset ---------- */

  function resetApp() {
    revokeUrl();
    state.file = null;
    state.width = 0;
    state.height = 0;

    previewImg.removeAttribute('src');
    fileName.textContent = '—';
    fileInfo.textContent = '';
    fileInput.value = '';
    showError('');
    downloadBtn.disabled = true;           // ← 추가

    showUploadOnly();
  }

  /* ---------- Events ---------- */

  chooseBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    fileInput.click();
  });

  dropzone.addEventListener('click', function () {
    fileInput.click();
  });

  dropzone.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      fileInput.click();
    }
  });

  fileInput.addEventListener('change', function (e) {
    handleFiles(e.target.files);
  });

  ['dragenter', 'dragover'].forEach(function (type) {
    dropzone.addEventListener(type, function (e) {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('is-dragover');
    });
  });

  ['dragleave', 'dragend'].forEach(function (type) {
    dropzone.addEventListener(type, function (e) {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('is-dragover');
    });
  });

  dropzone.addEventListener('drop', function (e) {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove('is-dragover');
    handleFiles(e.dataTransfer.files);
  });

  ['dragover', 'drop'].forEach(function (type) {
    window.addEventListener(type, function (e) {
      if (!dropzone.contains(e.target)) e.preventDefault();
    });
  });

    /* ---------- Download ---------- */

  // 편집 기능 추가 시 이 함수만 교체하면 결과물이 그대로 다운로드됩니다.
  function getDownloadBlob() {
    return state.editedBlob || state.file;
  }

  function buildFileName() {
    const original = (state.file && state.file.name) || 'image.gif';
    const base = original.replace(/\.gif$/i, '');
    return base + '-edited.gif';
  }

  function downloadCurrentGif() {
    const blob = getDownloadBlob();
    if (!blob) {
      showError('There is no GIF to download.');
      return;
    }

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = buildFileName();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // 다운로드가 시작될 시간을 준 뒤 해제
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);

    // 시각적 피드백
    const label = downloadBtn.querySelector('span');
    const prev = label.textContent;
    downloadBtn.classList.add('is-done');
    label.textContent = 'Saved!';
    setTimeout(function () {
      downloadBtn.classList.remove('is-done');
      label.textContent = prev;
    }, 1400);
  }

  downloadBtn.addEventListener('click', downloadCurrentGif);

  resetBtn.addEventListener('click', resetApp);

  window.GifEditor = { state: state, reset: resetApp };
})();