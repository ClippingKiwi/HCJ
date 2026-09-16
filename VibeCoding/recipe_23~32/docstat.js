'use strict';

pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

const $ = (id) => document.getElementById(id);
const dropzone = $('dropzone');
const fileInput = $('fileInput');
const MAX_SIZE = 50 * 1024 * 1024;

/* ── 파일 입력 이벤트 ─────────────────── */
dropzone.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => e.target.files[0] && handleFile(e.target.files[0]));

['dragenter', 'dragover'].forEach(type =>
  dropzone.addEventListener(type, (e) => { e.preventDefault(); dropzone.classList.add('dragover'); }));
['dragleave', 'drop'].forEach(type =>
  dropzone.addEventListener(type, (e) => { e.preventDefault(); dropzone.classList.remove('dragover'); }));
dropzone.addEventListener('drop', (e) => {
  const f = e.dataTransfer.files[0];
  if (f) handleFile(f);
});

/* ── 메인 핸들러 ─────────────────────── */
async function handleFile(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  hideError();
  $('resultArea').hidden = true;

  if (!['pdf', 'docx'].includes(ext)) return showError('PDF 또는 DOCX 파일만 업로드할 수 있습니다.');
  if (file.size > MAX_SIZE)           return showError('파일 크기는 50MB를 넘을 수 없습니다.');

  $('fileInfo').hidden = false;
  $('fileName').textContent = file.name;
  $('fileMeta').textContent = `${ext.toUpperCase()} · ${(file.size / 1024 / 1024).toFixed(2)}MB`;
  $('loading').hidden = false;

  try {
    const buffer = await file.arrayBuffer();
    const data = ext === 'pdf' ? await parsePdf(buffer) : await parseDocx(buffer);
    render(data);
  } catch (err) {
    console.error(err);
    showError('문서를 분석하지 못했습니다. 손상되었거나 암호가 걸린 파일일 수 있습니다.');
  } finally {
    $('loading').hidden = true;
  }
}

/* ── PDF 분석 ────────────────────────── */
async function parsePdf(buffer) {
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  let text = '';
  let images = 0;

  const IMG_OPS = new Set([
    pdfjsLib.OPS.paintImageXObject,
    pdfjsLib.OPS.paintJpegXObject,
    pdfjsLib.OPS.paintInlineImage,
    pdfjsLib.OPS.paintImageMaskXObject
  ]);

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);

    const content = await page.getTextContent();
    text += content.items.map(i => i.str).join(' ') + '\n';

    const ops = await page.getOperatorList();
    for (const fn of ops.fnArray) if (IMG_OPS.has(fn)) images++;
  }

  return { text: text.trim(), images, unitLabel: '페이지 수', unitValue: pdf.numPages };
}

/* ── DOCX 분석 ───────────────────────── */
async function parseDocx(buffer) {
  const zip = await JSZip.loadAsync(buffer);
  const docFile = zip.file('word/document.xml');
  if (!docFile) throw new Error('invalid docx');

  const xml = await docFile.async('string');
  const doc = new DOMParser().parseFromString(xml, 'application/xml');

  // 문단(<w:p>) 단위로 <w:t> 텍스트 추출
  const paragraphs = [...doc.getElementsByTagName('w:p')];
  const lines = paragraphs.map(p =>
    [...p.getElementsByTagName('w:t')].map(t => t.textContent).join('')
  );
  const text = lines.join('\n').trim();

  // 이미지: word/media 폴더의 실제 파일 수 기준
  const mediaFiles = Object.keys(zip.files).filter(
    (n) => /^word\/media\//i.test(n) && !zip.files[n].dir
  );
  // 문서에 실제 삽입된 참조(<a:blip>) 수와 비교해 더 큰 값을 사용
  const blipCount = doc.getElementsByTagName('a:blip').length;
  const images = Math.max(mediaFiles.length, blipCount);

  return {
    text,
    images,
    unitLabel: '문단 수',
    unitValue: paragraphs.filter(p => p.textContent.trim()).length
  };
}

/* ── 통계 계산 & 렌더 ────────────────── */
function render({ text, images, unitLabel, unitValue }) {
  const chars = [...text].length;
  const noSpace = [...text.replace(/\s/g, '')].length;
  const spaces = (text.match(/[ \t\u00A0]/g) || []).length;
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const fmt = (n) => n.toLocaleString('ko-KR');

  $('charAll').textContent     = fmt(chars);
  $('charNoSpace').textContent = fmt(noSpace);
  $('wordCount').textContent   = fmt(words);
  $('spaceCount').textContent  = fmt(spaces);
  $('imageCount').textContent  = fmt(images);
  $('pageCount').textContent   = `${fmt(unitValue)} (${unitLabel})`;

  $('preview').textContent = text ? text.slice(0, 1500) + (text.length > 1500 ? '\n\n... (이하 생략)' : '')
                                  : '추출된 텍스트가 없습니다. (스캔 이미지 PDF일 수 있습니다)';
  $('resultArea').hidden = false;
}

function showError(msg) { $('errorMsg').textContent = msg; $('errorMsg').hidden = false; }
function hideError() { $('errorMsg').hidden = true; }