'use strict';

const { PDFDocument } = PDFLib;

const $ = (id) => document.getElementById(id);
const dropzone = $('dropzone');
const fileInput = $('fileInput');
const listEl = $('fileList');
const MAX_SIZE = 100 * 1024 * 1024;

let files = [];   // { id, file, pages }
let uid = 0;

/* ── 업로드 ──────────────────────────── */
dropzone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => { addFiles([...e.target.files]); fileInput.value = ''; });

['dragenter', 'dragover'].forEach(t =>
  dropzone.addEventListener(t, (e) => { e.preventDefault(); dropzone.classList.add('dragover'); }));
['dragleave', 'drop'].forEach(t =>
  dropzone.addEventListener(t, (e) => { e.preventDefault(); dropzone.classList.remove('dragover'); }));
dropzone.addEventListener('drop', (e) => addFiles([...e.dataTransfer.files]));

async function addFiles(incoming) {
  hideError();
  hideSuccess();
  const rejected = [];

  for (const f of incoming) {
    if (!/\.pdf$/i.test(f.name)) { rejected.push(`${f.name} (PDF 아님)`); continue; }
    if (f.size > MAX_SIZE)       { rejected.push(`${f.name} (100MB 초과)`); continue; }

    let pages = '?';
    try {
      const doc = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
      pages = doc.getPageCount();
    } catch {
      rejected.push(`${f.name} (읽기 실패·암호 문서)`);
      continue;
    }
    files.push({ id: ++uid, file: f, pages });
  }

  if (rejected.length) showError('제외된 파일: ' + rejected.join(', '));
  render();
}

/* ── 목록 렌더 ───────────────────────── */
function render() {
  listEl.innerHTML = files.map((item, i) => `
    <li class="file-row" data-id="${item.id}">
      <span class="order">${i + 1}</span>
      <span class="fname" title="${escapeHtml(item.file.name)}">${escapeHtml(item.file.name)}</span>
      <span class="chip">${item.pages}p · ${(item.file.size / 1024 / 1024).toFixed(1)}MB</span>
      <span class="row-btns">
        <button type="button" class="icon-btn" data-act="up" ${i === 0 ? 'disabled' : ''}>▲</button>
        <button type="button" class="icon-btn" data-act="down" ${i === files.length - 1 ? 'disabled' : ''}>▼</button>
        <button type="button" class="icon-btn danger" data-act="del">✕</button>
      </span>
    </li>`).join('');

  const has = files.length > 0;
  $('summaryRow').hidden = !has;
  $('mergeBtn').disabled = files.length < 1;

  const totalPages = files.reduce((s, f) => s + (Number(f.pages) || 0), 0);
  const totalSize = files.reduce((s, f) => s + f.file.size, 0) / 1024 / 1024;
  $('summary').textContent = has
    ? `${files.length}개 파일 · 총 ${totalPages}페이지 · ${totalSize.toFixed(1)}MB`
    : '';
}

listEl.addEventListener('click', (e) => {
  const btn = e.target.closest('.icon-btn');
  if (!btn) return;
  const id = Number(btn.closest('.file-row').dataset.id);
  const i = files.findIndex(f => f.id === id);

  if (btn.dataset.act === 'del') files.splice(i, 1);
  if (btn.dataset.act === 'up' && i > 0) [files[i - 1], files[i]] = [files[i], files[i - 1]];
  if (btn.dataset.act === 'down' && i < files.length - 1) [files[i + 1], files[i]] = [files[i], files[i + 1]];

  hideSuccess();
  render();
});

$('sortNameBtn').addEventListener('click', () => {
  files.sort((a, b) => a.file.name.localeCompare(b.file.name, 'ko', { numeric: true }));
  render();
});

$('clearBtn').addEventListener('click', () => { files = []; hideError(); hideSuccess(); render(); });

/* ── 병합 실행 ───────────────────────── */
$('mergeBtn').addEventListener('click', async () => {
  if (!files.length) return;
  hideError(); hideSuccess();
  $('loading').hidden = false;
  $('mergeBtn').disabled = true;

  try {
    const merged = await PDFDocument.create();
    let total = 0;

    for (const { file } of files) {
      const src = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
      const pages = await merged.copyPages(src, src.getPageIndices());
      pages.forEach(p => { merged.addPage(p); total++; });
    }

    merged.setTitle((($('outName').value.trim()) || 'merged') + '.pdf');
    merged.setProducer('Mini Web Apps - PDF Merger');
    merged.setCreationDate(new Date());

    const bytes = await merged.save();
    const blob = new Blob([bytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = (($('outName').value.trim()) || 'merged') + '.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 3000);

    showSuccess(`✅ 병합 완료! ${files.length}개 파일 · 총 ${total}페이지 (${(blob.size / 1024 / 1024).toFixed(2)}MB)`);
  } catch (err) {
    console.error(err);
    showError('병합에 실패했습니다. 암호가 걸렸거나 손상된 PDF가 포함되어 있을 수 있습니다.');
  } finally {
    $('loading').hidden = true;
    $('mergeBtn').disabled = false;
  }
});

/* ── 유틸 ────────────────────────────── */
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function showError(m) { $('errorMsg').textContent = m; $('errorMsg').hidden = false; }
function hideError() { $('errorMsg').hidden = true; }
function showSuccess(m) { $('successMsg').textContent = m; $('successMsg').hidden = false; }
function hideSuccess() { $('successMsg').hidden = true; }

render();