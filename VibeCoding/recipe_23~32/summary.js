'use strict';

const $ = (id) => document.getElementById(id);

if (window.pdfjsLib) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
}

const MAX_SIZE = 20 * 1024 * 1024;
const MAX_SENTENCES = 800;          // O(n²) 방어

let doc = null;                     // { sentences, scores, keywords, raw }

/* ═══════════ 1. 파일 입력 ═══════════ */
const upZone = $('upZone');

['dragenter', 'dragover'].forEach(ev =>
  upZone.addEventListener(ev, (e) => { e.preventDefault(); upZone.classList.add('over'); }));
['dragleave', 'drop'].forEach(ev =>
  upZone.addEventListener(ev, (e) => { e.preventDefault(); upZone.classList.remove('over'); }));

upZone.addEventListener('drop', (e) => {
  const f = e.dataTransfer.files?.[0];
  if (f) handleFile(f);
});
$('fileInput').addEventListener('change', (e) => {
  const f = e.target.files?.[0];
  if (f) handleFile(f);
});
$('resetBtn').addEventListener('click', resetAll);

async function handleFile(file) {
  hideError();
  if (file.size > MAX_SIZE) return showError('파일이 너무 큽니다. 20MB 이하로 올려주세요.');

  const ext = file.name.split('.').pop().toLowerCase();
  if (!['pdf', 'docx', 'txt', 'md'].includes(ext))
    return showError('지원하지 않는 형식입니다. (PDF · DOCX · TXT · MD)');

  $('fileName').textContent = file.name;
  $('fileSize').textContent = formatBytes(file.size);
  $('fileMeta').hidden = false;
  $('loadWrap').hidden = false;
  setProgress(8, '텍스트를 추출하는 중…');

  try {
    const raw = await extractText(file, ext);
    const text = raw.replace(/\u00a0/g, ' ').trim();

    if (text.length < 80) throw new Error('추출된 텍스트가 너무 짧습니다. (이미지 기반 PDF일 수 있어요)');

    setProgress(70, 'TextRank 계산 중…');
    await frame();

    let sentences = splitSentences(text);
    if (sentences.length < 2) throw new Error('문장을 2개 이상 인식하지 못했습니다.');

    let trimmed = false;
    if (sentences.length > MAX_SENTENCES) { sentences = sentences.slice(0, MAX_SENTENCES); trimmed = true; }

    const scores = textRank(sentences);
    const keywords = keywordRank(text, 8);

    doc = { sentences, scores, keywords, raw: text, trimmed };

    setProgress(100, '완료!');
    setTimeout(() => { $('loadWrap').hidden = true; }, 500);

    $('optPanel').hidden = false;
    $('resultPanel').hidden = false;
    $('rawText').textContent = text.slice(0, 4000) + (text.length > 4000 ? ' …' : '');
    render();
  } catch (err) {
    $('loadWrap').hidden = true;
    showError(err.message || '파일을 읽는 중 오류가 발생했습니다.');
  }
}

async function extractText(file, ext) {
  if (ext === 'txt' || ext === 'md') return await file.text();

  if (ext === 'docx') {
    const buf = await file.arrayBuffer();
    const res = await mammoth.extractRawText({ arrayBuffer: buf });
    return res.value;
  }

  // PDF
  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  let out = '';
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const tc = await page.getTextContent();
    out += tc.items.map(i => i.str).join(' ') + '\n';
    setProgress(8 + (p / pdf.numPages) * 55, `PDF 읽는 중… (${p}/${pdf.numPages}쪽)`);
    if (p % 5 === 0) await frame();
  }
  return out;
}

/* ═══════════ 2. 문장 분리 ═══════════ */
function splitSentences(text) {
  const clean = text.replace(/\r/g, '').replace(/[ \t]+/g, ' ');
  const out = [];

  for (const block of clean.split(/\n+/)) {
    const b = block.trim();
    if (!b) continue;

    const ch = [...b];
    let buf = '';
    for (let i = 0; i < ch.length; i++) {
      buf += ch[i];
      if (!/[.!?…。]/.test(ch[i])) continue;

      const prev = ch[i - 1] || '';
      const next = ch[i + 1] || ' ';
      if (ch[i] === '.' && /\d/.test(prev) && /\d/.test(next)) continue;   // 3.14 방어
      if (/[\s"'”’)\]】」]/.test(next) || i === ch.length - 1) {
        out.push(buf); buf = '';
      }
    }
    if (buf.trim()) out.push(buf);
  }

  let res = out.map(s => s.replace(/\s+/g, ' ').trim()).filter(s => s.length >= 12);

  // 마침표가 거의 없는 문서 보정: '~다/요/함' 종결 기준 재분리
  if (res.length < 3 && clean.length > 400) {
    res = clean.split(/(?<=[다요함음임]\s)|\n+/)
               .map(s => s.replace(/\s+/g, ' ').trim())
               .filter(s => s.length >= 12);
  }
  return res;
}

/* ═══════════ 3. 토큰화 ═══════════ */
const STOP = new Set(`
그리고 그러나 그래서 하지만 또한 또는 즉 다만 따라서 때문에 위해 위한 통해 대한 대해 관련 경우 이번 지난
있다 없다 하다 되다 이다 한다 된다 했다 됐다 같다 많다 있는 없는 하는 되는 이런 저런 그런 어떤 모든 여러
것으로 것은 것이 것을 수는 수가 등의 등을 있으며 및 제 본 저 그 이 
the and for that with this from have has was were are but not you all can will your our their its
about into over than then them they there when what which while would could should more most other some such
`.trim().split(/\s+/));

const PARTICLES = ['으로써','이라는','에서는','으로는','에게서','이라고','으로','에서','에게','까지','부터','처럼','보다','만큼','라도','이나','으나','와의','과의','로서','로써','에는','의','을','를','은','는','이','가','도','와','과','만','랑','께','께서'];

function normalize(tok) {
  let t = tok;
  if (/^[가-힣]{3,}$/.test(t)) {
    for (const p of PARTICLES) {
      if (t.length - p.length >= 2 && t.endsWith(p)) { t = t.slice(0, -p.length); break; }
    }
  }
  return t;
}

function tokenize(s) {
  return s.toLowerCase()
    .replace(/[^0-9a-z가-힣\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length >= 2 && !STOP.has(w))
    .map(normalize)
    .filter(w => w.length >= 2 && !STOP.has(w));
}

/* ═══════════ 4. TextRank (문장) ═══════════ */
function similarity(a, b) {
  if (!a.size || !b.size) return 0;
  let common = 0;
  for (const w of a) if (b.has(w)) common++;
  if (!common) return 0;
  const denom = Math.log(a.size + 1) + Math.log(b.size + 1);
  return denom === 0 ? 0 : common / denom;
}

function pagerank(n, edges, rowSum, d = 0.85, iter = 80) {
  let score = new Float64Array(n).fill(1 / n);
  for (let k = 0; k < iter; k++) {
    const next = new Float64Array(n);
    let diff = 0;
    for (let i = 0; i < n; i++) {
      let sum = 0;
      for (let j = 0; j < n; j++) {
        const w = edges[j][i];
        if (i === j || !w || !rowSum[j]) continue;
        sum += (w / rowSum[j]) * score[j];
      }
      next[i] = (1 - d) / n + d * sum;
    }
    for (let i = 0; i < n; i++) diff += Math.abs(next[i] - score[i]);
    score = next;
    if (diff < 1e-7) break;
  }
  return score;
}

function textRank(sentences) {
  const n = sentences.length;
  const sets = sentences.map(s => new Set(tokenize(s)));
  const edges = Array.from({ length: n }, () => new Float64Array(n));
  const rowSum = new Float64Array(n);

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const s = similarity(sets[i], sets[j]);
      edges[i][j] = edges[j][i] = s;
    }
  }
  for (let i = 0; i < n; i++) rowSum[i] = edges[i].reduce((a, b) => a + b, 0);

  const rank = pagerank(n, edges, rowSum);

  // 보정: 도입부 가중 + 너무 짧은 문장 감점
  return Array.from(rank, (v, i) => {
    const lead = 1 + 0.15 * Math.exp(-i / 6);
    const lenPen = sentences[i].length < 25 ? 0.7 : 1;
    return v * lead * lenPen;
  });
}

/* ═══════════ 5. TextRank (키워드) ═══════════ */
function keywordRank(text, top) {
  const words = tokenize(text);
  if (words.length < 10) return [];

  const idx = new Map(), list = [];
  for (const w of words) {
    if (!idx.has(w)) { idx.set(w, list.length); list.push(w); }
  }
  const n = list.length;
  if (n > 1200) return frequencyTop(words, top);       // 과대 문서는 빈도로 대체

  const edges = Array.from({ length: n }, () => new Float64Array(n));
  const WIN = 4;
  for (let i = 0; i < words.length; i++) {
    for (let j = i + 1; j < Math.min(i + WIN, words.length); j++) {
      const a = idx.get(words[i]), b = idx.get(words[j]);
      if (a === b) continue;
      edges[a][b] += 1; edges[b][a] += 1;
    }
  }
  const rowSum = new Float64Array(n);
  for (let i = 0; i < n; i++) rowSum[i] = edges[i].reduce((a, b) => a + b, 0);

  const rank = pagerank(n, edges, rowSum);
  return list.map((w, i) => ({ word: w, score: rank[i] }))
             .sort((a, b) => b.score - a.score)
             .slice(0, top);
}

function frequencyTop(words, top) {
  const m = new Map();
  for (const w of words) m.set(w, (m.get(w) || 0) + 1);
  return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, top)
    .map(([word, score]) => ({ word, score }));
}

/* ═══════════ 6. 렌더링 ═══════════ */
$('lenRange').addEventListener('input', render);

function render() {
  if (!doc) return;
  const want = Number($('lenRange').value);
  const k = Math.min(want, doc.sentences.length);

  $('lenOut').textContent = `${want}문장`;
  paintRange();

  const picked = doc.scores
    .map((s, i) => ({ s, i }))
    .sort((a, b) => b.s - a.s)
    .slice(0, k)
    .sort((a, b) => a.i - b.i);

  $('sumList').innerHTML = picked.map(p => `
    <li class="sum-item">
      <p>${escapeHtml(doc.sentences[p.i])}</p>
      <span class="sum-pos">원문 ${p.i + 1}번째 문장</span>
    </li>`).join('');

  const maxKw = doc.keywords[0]?.score || 1;
  $('kwChips').innerHTML = doc.keywords.map(kw => `
    <li class="kw-chip" style="--w:${(kw.score / maxKw).toFixed(2)}">
      ${escapeHtml(kw.word)}
    </li>`).join('') || '<li class="hint">키워드를 찾지 못했습니다.</li>';

  const sumChars = picked.reduce((a, p) => a + doc.sentences[p.i].length, 0);
  const ratio = ((sumChars / doc.raw.length) * 100).toFixed(1);
  $('docStat').textContent =
    `원문 ${doc.sentences.length}문장 · ${doc.raw.length.toLocaleString()}자 → 요약 ${ratio}%` +
    (doc.trimmed ? ` (앞 ${MAX_SENTENCES}문장만 분석)` : '');
}

function paintRange() {
  const el = $('lenRange');
  const pct = ((el.value - el.min) / (el.max - el.min)) * 100;
  el.style.setProperty('--pct', pct + '%');
}

/* ═══════════ 7. 복사 · 저장 ═══════════ */
function summaryText() {
  return [...$('sumList').querySelectorAll('p')].map((p, i) => `${i + 1}. ${p.textContent}`).join('\n');
}

$('copyBtn').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(summaryText());
    flash($('copyBtn'), '복사됨 ✓', '복사');
  } catch { showError('클립보드 접근이 차단되었습니다.'); }
});

$('saveBtn').addEventListener('click', () => {
  const name = ($('fileName').textContent || 'summary').replace(/\.[^.]+$/, '');
  const body = `[요약] ${name}\n\n${summaryText()}\n\n[키워드] ${doc.keywords.map(k => k.word).join(', ')}\n`;
  const url = URL.createObjectURL(new Blob([body], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url; a.download = `${name}_요약.txt`; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

/* ═══════════ 유틸 ═══════════ */
function resetAll() {
  doc = null;
  $('fileInput').value = '';
  ['fileMeta', 'optPanel', 'resultPanel', 'loadWrap'].forEach(id => $(id).hidden = true);
  hideError();
}
function setProgress(pct, msg) {
  $('loadBar').style.width = pct + '%';
  if (msg) $('loadMsg').textContent = msg;
}
function frame() { return new Promise(r => requestAnimationFrame(() => r())); }
function showError(m) { $('errorMsg').textContent = m; $('errorMsg').hidden = false; }
function hideError() { $('errorMsg').hidden = true; }
function formatBytes(b) {
  const u = ['B', 'KB', 'MB']; let i = 0;
  while (b >= 1024 && i < 2) { b /= 1024; i++; }
  return `${b.toFixed(i ? 1 : 0)} ${u[i]}`;
}
function flash(btn, on, off) {
  btn.textContent = on; btn.disabled = true;
  setTimeout(() => { btn.textContent = off; btn.disabled = false; }, 1200);
}
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

paintRange();