'use strict';

const $ = (id) => document.getElementById(id);
const MAX_SIZE = 60 * 1024 * 1024;

let ctx = null;                 // AudioContext
let original = null;            // 원본 AudioBuffer
let buf = null;                 // 현재 편집 중 AudioBuffer
let history = [];               // undo 스택 (최대 8)
let peaks = null;               // 파형 캐시

let sel = { a: 0, b: 0 };       // 선택 구간(초)
let playhead = 0;
let src = null, gainNode = null, startedAt = 0, playing = false;
let dragging = false, dragFrom = 0;

const canvas = $('wave');
const c2d = canvas.getContext('2d');
let W = 900, H = 200;

/* ═══════════ 1. 파일 로드 ═══════════ */
const upZone = $('upZone');
['dragenter', 'dragover'].forEach(e =>
  upZone.addEventListener(e, ev => { ev.preventDefault(); upZone.classList.add('over'); }));
['dragleave', 'drop'].forEach(e =>
  upZone.addEventListener(e, ev => { ev.preventDefault(); upZone.classList.remove('over'); }));

upZone.addEventListener('drop', e => { const f = e.dataTransfer.files?.[0]; if (f) loadFile(f); });
$('fileInput').addEventListener('change', e => { const f = e.target.files?.[0]; if (f) loadFile(f); });
$('resetBtn').addEventListener('click', resetAll);

async function loadFile(file) {
  hideError();
  if (file.size > MAX_SIZE) return showError('파일이 너무 큽니다. 60MB 이하로 올려주세요.');
  if (!/^audio\//.test(file.type) && !/\.(mp3|wav|m4a|ogg|flac|aac)$/i.test(file.name))
    return showError('오디오 파일만 업로드할 수 있습니다.');

  try {
    ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
    const ab = await file.arrayBuffer();
    const decoded = await ctx.decodeAudioData(ab);

    original = decoded;
    buf = cloneBuffer(decoded);
    history = [];
    sel = { a: 0, b: 0 };
    playhead = 0;

    $('fileName').textContent = file.name;
    $('fileMeta').hidden = false;
    $('editPanel').hidden = false;
    $('exportPanel').hidden = false;

    resizeCanvas();
    afterChange('원본 로드 완료');
  } catch {
    showError('이 파일을 디코딩할 수 없습니다. (브라우저가 지원하지 않는 코덱일 수 있어요)');
  }
}

/* ═══════════ 2. 버퍼 유틸 ═══════════ */
function cloneBuffer(b) {
  const out = ctx.createBuffer(b.numberOfChannels, b.length, b.sampleRate);
  for (let c = 0; c < b.numberOfChannels; c++) out.copyToChannel(b.getChannelData(c).slice(), c);
  return out;
}

function pushHistory() {
  history.push(cloneBuffer(buf));
  if (history.length > 8) history.shift();
  $('undoBtn').disabled = false;
}

function sliceBuffer(b, s, e) {
  const len = Math.max(1, e - s);
  const out = ctx.createBuffer(b.numberOfChannels, len, b.sampleRate);
  for (let c = 0; c < b.numberOfChannels; c++) {
    out.copyToChannel(b.getChannelData(c).subarray(s, s + len).slice(), c);
  }
  return out;
}

function removeRange(b, s, e) {
  const len = b.length - (e - s);
  if (len < 1) return null;
  const out = ctx.createBuffer(b.numberOfChannels, len, b.sampleRate);
  for (let c = 0; c < b.numberOfChannels; c++) {
    const src = b.getChannelData(c), dst = out.getChannelData(c);
    dst.set(src.subarray(0, s), 0);
    dst.set(src.subarray(e), s);
  }
  return out;
}

const toSample = (sec) => Math.round(sec * buf.sampleRate);
const dur = () => (buf ? buf.duration : 0);

function selRange() {
  const a = Math.max(0, Math.min(sel.a, sel.b));
  const b2 = Math.min(dur(), Math.max(sel.a, sel.b));
  return b2 - a > 0.005 ? { a, b: b2 } : null;
}

/* ═══════════ 3. 파형 ═══════════ */
function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  W = canvas.clientWidth || 900;
  H = 200;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  c2d.setTransform(dpr, 0, 0, dpr, 0, 0);
  peaks = null;
  drawWave();
}
window.addEventListener('resize', () => { if (buf) resizeCanvas(); });

function buildPeaks() {
  const n = Math.floor(W);
  const per = buf.length / n;
  const out = new Float32Array(n * 2);
  const chs = [];
  for (let c = 0; c < buf.numberOfChannels; c++) chs.push(buf.getChannelData(c));

  for (let i = 0; i < n; i++) {
    const s = Math.floor(i * per), e = Math.min(buf.length, Math.floor((i + 1) * per));
    let min = 1, max = -1;
    for (const d of chs) {
      for (let k = s; k < e; k += 1) {
        const v = d[k];
        if (v < min) min = v;
        if (v > max) max = v;
      }
    }
    out[i * 2] = min === 1 ? 0 : min;
    out[i * 2 + 1] = max === -1 ? 0 : max;
  }
  peaks = out;
}

function drawWave() {
  c2d.clearRect(0, 0, W, H);
  const bg = c2d.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#141733');
  bg.addColorStop(1, '#0a0c1a');
  c2d.fillStyle = bg;
  c2d.fillRect(0, 0, W, H);

  if (!buf) return;
  if (!peaks) buildPeaks();

  const mid = H / 2;
  const r = selRange();

  // 선택 영역
  if (r) {
    const x1 = (r.a / dur()) * W, x2 = (r.b / dur()) * W;
    c2d.fillStyle = 'rgba(124,108,255,.22)';
    c2d.fillRect(x1, 0, x2 - x1, H);
    c2d.strokeStyle = 'rgba(124,108,255,.9)';
    c2d.lineWidth = 2;
    c2d.beginPath();
    c2d.moveTo(x1, 0); c2d.lineTo(x1, H);
    c2d.moveTo(x2, 0); c2d.lineTo(x2, H);
    c2d.stroke();
  }

  // 중앙선
  c2d.strokeStyle = 'rgba(255,255,255,.15)';
  c2d.lineWidth = 1;
  c2d.beginPath(); c2d.moveTo(0, mid); c2d.lineTo(W, mid); c2d.stroke();

  // 파형
  const g = c2d.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#7c6cff');
  g.addColorStop(0.5, '#38d6c6');
  g.addColorStop(1, '#7c6cff');
  c2d.fillStyle = g;
  const prev = Number($('gainRange').value);
  const mul = Math.pow(10, prev / 20);
  for (let i = 0; i < W; i++) {
    const min = Math.max(-1, peaks[i * 2] * mul), max = Math.min(1, peaks[i * 2 + 1] * mul);
    const y1 = mid - max * (mid - 6), y2 = mid - min * (mid - 6);
    c2d.fillRect(i, y1, 1, Math.max(1, y2 - y1));
  }

  // 재생 위치
  const px = (playhead / dur()) * W;
  c2d.strokeStyle = '#ffd166';
  c2d.lineWidth = 2;
  c2d.beginPath(); c2d.moveTo(px, 0); c2d.lineTo(px, H); c2d.stroke();
  c2d.fillStyle = '#ffd166';
  c2d.beginPath(); c2d.arc(px, 8, 4, 0, Math.PI * 2); c2d.fill();
}

/* ═══════════ 4. 마우스 선택 ═══════════ */
const xToSec = (clientX) => {
  const rect = canvas.getBoundingClientRect();
  const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
  return (x / rect.width) * dur();
};

canvas.addEventListener('pointerdown', (e) => {
  if (!buf) return;
  canvas.setPointerCapture(e.pointerId);
  dragging = true;
  dragFrom = xToSec(e.clientX);
  sel = { a: dragFrom, b: dragFrom };
  syncSelInputs();
  drawWave();
});
canvas.addEventListener('pointermove', (e) => {
  if (!dragging) return;
  sel = { a: dragFrom, b: xToSec(e.clientX) };
  syncSelInputs();
  drawWave();
});
canvas.addEventListener('pointerup', (e) => {
  if (!dragging) return;
  dragging = false;
  const end = xToSec(e.clientX);
  if (Math.abs(end - dragFrom) < 0.01) {       // 클릭 → 재생 위치 이동
    sel = { a: 0, b: 0 };
    playhead = end;
    if (playing) { stop(); play(); }
  }
  syncSelInputs();
  drawWave();
});

$('selStart').addEventListener('change', readSelInputs);
$('selEnd').addEventListener('change', readSelInputs);
function readSelInputs() {
  sel = { a: Number($('selStart').value) || 0, b: Number($('selEnd').value) || 0 };
  drawWave();
}
function syncSelInputs() {
  const r = selRange();
  $('selStart').value = (r ? r.a : 0).toFixed(2);
  $('selEnd').value = (r ? r.b : 0).toFixed(2);
}
$('selAllBtn').addEventListener('click', () => { sel = { a: 0, b: dur() }; syncSelInputs(); drawWave(); });
$('selClearBtn').addEventListener('click', () => { sel = { a: 0, b: 0 }; syncSelInputs(); drawWave(); });

/* ═══════════ 5. 재생 ═══════════ */
$('playBtn').addEventListener('click', () => (playing ? pause() : play()));
$('stopBtn').addEventListener('click', () => { stop(); playhead = 0; drawWave(); updateTime(); });

function play() {
  if (!buf) return;
  ctx.resume?.();
  const r = selRange();
  const offset = r && $('loopSel').checked ? r.a : playhead;

  src = ctx.createBufferSource();
  src.buffer = buf;
  gainNode = ctx.createGain();
  gainNode.gain.value = Math.pow(10, Number($('gainRange').value) / 20);
  src.connect(gainNode).connect(ctx.destination);

  if (r && $('loopSel').checked) {
    src.loop = true;
    src.loopStart = r.a;
    src.loopEnd = r.b;
  }
  src.onended = () => { if (playing && !src.loop) { playing = false; playhead = 0; $('playBtn').textContent = '▶'; } };

  src.start(0, Math.min(offset, dur() - 0.01));
  startedAt = ctx.currentTime - offset;
  playing = true;
  $('playBtn').textContent = '❙❙';
  requestAnimationFrame(tick);
}
function pause() {
  if (!src) return;
  playhead = Math.min(dur(), ctx.currentTime - startedAt);
  src.stop(); src = null;
  playing = false;
  $('playBtn').textContent = '▶';
}
function stop() {
  if (src) { try { src.stop(); } catch {} src = null; }
  playing = false;
  $('playBtn').textContent = '▶';
}
function tick() {
  if (!playing) return;
  const r = selRange();
  let t = ctx.currentTime - startedAt;
  if (r && $('loopSel').checked) t = r.a + ((t - r.a) % (r.b - r.a));
  playhead = Math.min(dur(), t);
  drawWave(); updateTime();
  requestAnimationFrame(tick);
}
function updateTime() {
  $('timeRead').textContent = `${fmtTime(playhead)} / ${fmtTime(dur())}`;
}

/* ═══════════ 6. 편집 기능 ═══════════ */
$('trimBtn').addEventListener('click', () => {
  const r = needSel(); if (!r) return;
  pushHistory();
  buf = sliceBuffer(buf, toSample(r.a), toSample(r.b));
  sel = { a: 0, b: 0 }; playhead = 0;
  afterChange(`구간 유지: ${fmtTime(r.a)} ~ ${fmtTime(r.b)}`);
});

$('cutBtn').addEventListener('click', () => {
  const r = needSel(); if (!r) return;
  const nb = removeRange(buf, toSample(r.a), toSample(r.b));
  if (!nb) return showError('전체를 삭제할 수는 없습니다.');
  pushHistory();
  buf = nb;
  sel = { a: 0, b: 0 }; playhead = 0;
  afterChange(`구간 삭제: ${fmtTime(r.a)} ~ ${fmtTime(r.b)}`);
});

$('silenceBtn').addEventListener('click', () => {
  const r = needSel(); if (!r) return;
  pushHistory();
  const s = toSample(r.a), e = toSample(r.b);
  for (let c = 0; c < buf.numberOfChannels; c++) buf.getChannelData(c).fill(0, s, e);
  afterChange('선택 구간 무음화');
});

$('fadeInBtn').addEventListener('click', () => applyFade(true));
$('fadeOutBtn').addEventListener('click', () => applyFade(false));

function applyFade(isIn) {
  const r = selRange() || { a: 0, b: Math.min(2, dur()) };
  pushHistory();
  const s = toSample(r.a), e = toSample(r.b), n = Math.max(1, e - s);
  for (let c = 0; c < buf.numberOfChannels; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < n; i++) {
      const t = i / n;
      d[s + i] *= isIn ? t : 1 - t;
    }
  }
  afterChange(isIn ? '페이드 인 적용' : '페이드 아웃 적용');
}

$('normBtn').addEventListener('click', () => {
  let max = 0;
  for (let c = 0; c < buf.numberOfChannels; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < d.length; i++) { const v = Math.abs(d[i]); if (v > max) max = v; }
  }
  if (max < 1e-5) return showError('무음 파일은 정규화할 수 없습니다.');
  pushHistory();
  const mul = 0.98 / max;
  for (let c = 0; c < buf.numberOfChannels; c++) {
    const d = buf.getChannelData(c);
    for (let i = 0; i < d.length; i++) d[i] *= mul;
  }
  afterChange(`정규화 완료 (×${mul.toFixed(2)})`);
});

/* 볼륨 */
$('gainRange').addEventListener('input', () => {
  const db = Number($('gainRange').value);
  $('gainOut').textContent = `${db > 0 ? '+' : ''}${db.toFixed(1)} dB`;
  paintRange($('gainRange'));
  if (gainNode) gainNode.gain.value = Math.pow(10, db / 20);
  drawWave();
});

$('applyGainAllBtn').addEventListener('click', () => bakeGain(null));
$('applyGainSelBtn').addEventListener('click', () => {
  const r = needSel(); if (!r) return;
  bakeGain(r);
});

function bakeGain(r) {
  const db = Number($('gainRange').value);
  if (Math.abs(db) < 0.01) return showError('변경할 볼륨 값이 없습니다.');
  pushHistory();
  const mul = Math.pow(10, db / 20);
  const s = r ? toSample(r.a) : 0, e = r ? toSample(r.b) : buf.length;
  for (let c = 0; c < buf.numberOfChannels; c++) {
    const d = buf.getChannelData(c);
    for (let i = s; i < e; i++) d[i] = Math.max(-1, Math.min(1, d[i] * mul));
  }
  $('gainRange').value = 0;
  $('gainRange').dispatchEvent(new Event('input'));
  afterChange(`볼륨 ${db > 0 ? '+' : ''}${db}dB 적용${r ? ' (선택 구간)' : ''}`);
}

/* 되돌리기 */
$('undoBtn').addEventListener('click', () => {
  if (!history.length) return;
  stop();
  buf = history.pop();
  $('undoBtn').disabled = history.length === 0;
  playhead = 0;
  afterChange('되돌리기 완료');
});
$('revertBtn').addEventListener('click', () => {
  if (!original) return;
  stop();
  history = [];
  buf = cloneBuffer(original);
  $('undoBtn').disabled = true;
  sel = { a: 0, b: 0 }; playhead = 0;
  afterChange('원본으로 복원');
});

function needSel() {
  const r = selRange();
  if (!r) { showError('먼저 파형에서 구간을 드래그해 선택해 주세요.'); return null; }
  hideError();
  return r;
}

function afterChange(msg) {
  stop();
  peaks = null;
  syncSelInputs();
  drawWave();
  updateTime();
  $('fileSpec').textContent =
    `${fmtTime(dur())} · ${buf.sampleRate.toLocaleString()}Hz · ${buf.numberOfChannels === 1 ? '모노' : '스테레오'}`;
  $('histInfo').textContent = `${msg} (되돌리기 ${history.length}단계 가능)`;
  hideError();
}

/* ═══════════ 7. 내보내기 ═══════════ */
$('exportBtn').addEventListener('click', doExport);

async function doExport() {
  if (!buf) return;
  const fmt = $('fmtSel').value;
  const rate = Number($('rateSel').value);
  const chWant = Number($('chSel').value);

  $('exportBtn').disabled = true;
  $('expWrap').hidden = false;
  setExp(10, '오디오 변환 준비 중…');

  try {
    let out = buf;
    const targetRate = rate || buf.sampleRate;
    const targetCh = chWant || buf.numberOfChannels;

    if (targetRate !== buf.sampleRate || targetCh !== buf.numberOfChannels) {
      setExp(30, '샘플레이트 · 채널 변환 중…');
      out = await resample(buf, targetRate, targetCh);
    }

    let blob, ext;
    if (fmt.startsWith('wav')) {
      setExp(70, 'WAV 인코딩 중…');
      blob = encodeWav(out, fmt === 'wav32' ? 32 : 16);
      ext = 'wav';
    } else {
      if (!window.lamejs) throw new Error('MP3 인코더를 불러오지 못했습니다. (인터넷 연결 확인)');
      const kbps = Number(fmt.split('-')[1]);
      blob = await encodeMp3(out, kbps);
      ext = 'mp3';
    }

    setExp(100, '완료!');
    const base = ($('fileName').textContent || 'audio').replace(/\.[^.]+$/, '');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${base}_edit.${ext}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    $('expNote').textContent = `저장 완료 · ${formatBytes(blob.size)}`;
  } catch (e) {
    showError(e.message || '내보내기에 실패했습니다.');
  } finally {
    $('exportBtn').disabled = false;
    setTimeout(() => { $('expWrap').hidden = true; }, 800);
  }
}

async function resample(b, rate, channels) {
  const off = new OfflineAudioContext(channels, Math.ceil(b.duration * rate), rate);
  const s = off.createBufferSource();
  s.buffer = b;
  s.connect(off.destination);
  s.start();
  return await off.startRendering();
}

function encodeWav(b, bits) {
  const ch = b.numberOfChannels, len = b.length;
  const bytesPer = bits / 8;
  const dataSize = len * ch * bytesPer;
  const ab = new ArrayBuffer(44 + dataSize);
  const v = new DataView(ab);
  const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };

  str(0, 'RIFF'); v.setUint32(4, 36 + dataSize, true); str(8, 'WAVE');
  str(12, 'fmt '); v.setUint32(16, 16, true);
  v.setUint16(20, bits === 32 ? 3 : 1, true);           // 3 = IEEE float
  v.setUint16(22, ch, true);
  v.setUint32(24, b.sampleRate, true);
  v.setUint32(28, b.sampleRate * ch * bytesPer, true);
  v.setUint16(32, ch * bytesPer, true);
  v.setUint16(34, bits, true);
  str(36, 'data'); v.setUint32(40, dataSize, true);

  const chans = [];
  for (let c = 0; c < ch; c++) chans.push(b.getChannelData(c));

  let off = 44;
  for (let i = 0; i < len; i++) {
    for (let c = 0; c < ch; c++) {
      const s = Math.max(-1, Math.min(1, chans[c][i]));
      if (bits === 32) { v.setFloat32(off, s, true); off += 4; }
      else { v.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true); off += 2; }
    }
  }
  return new Blob([ab], { type: 'audio/wav' });
}

async function encodeMp3(b, kbps) {
  const ch = Math.min(2, b.numberOfChannels);
  const enc = new lamejs.Mp3Encoder(ch, b.sampleRate, kbps);
  const l = floatTo16(b.getChannelData(0));
  const r = ch > 1 ? floatTo16(b.getChannelData(1)) : null;

  const blocks = [];
  const STEP = 1152;
  for (let i = 0; i < l.length; i += STEP) {
    const lc = l.subarray(i, i + STEP);
    const chunk = ch > 1 ? enc.encodeBuffer(lc, r.subarray(i, i + STEP)) : enc.encodeBuffer(lc);
    if (chunk.length) blocks.push(new Uint8Array(chunk));

    if ((i / STEP) % 400 === 0) {
      setExp(40 + (i / l.length) * 55, `MP3 인코딩 중… ${Math.round((i / l.length) * 100)}%`);
      await new Promise(res => setTimeout(res, 0));
    }
  }
  const tail = enc.flush();
  if (tail.length) blocks.push(new Uint8Array(tail));
  return new Blob(blocks, { type: 'audio/mpeg' });
}

function floatTo16(f32) {
  const out = new Int16Array(f32.length);
  for (let i = 0; i < f32.length; i++) {
    const s = Math.max(-1, Math.min(1, f32[i]));
    out[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return out;
}

/* ═══════════ 유틸 ═══════════ */
function resetAll() {
  stop();
  original = buf = peaks = null;
  history = [];
  $('fileInput').value = '';
  ['fileMeta', 'editPanel', 'exportPanel'].forEach(id => $(id).hidden = true);
  hideError();
}
function fmtTime(s) {
  s = Math.max(0, s || 0);
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}.${Math.floor((s % 1) * 10)}`;
}
function formatBytes(b) {
  const u = ['B', 'KB', 'MB']; let i = 0;
  while (b >= 1024 && i < 2) { b /= 1024; i++; }
  return `${b.toFixed(i ? 1 : 0)} ${u[i]}`;
}
function setExp(pct, msg) {
  $('expBar').style.width = pct + '%';
  if (msg) $('expMsg').textContent = msg;
}
function paintRange(el) {
  const pct = ((el.value - el.min) / (el.max - el.min)) * 100;
  el.style.setProperty('--pct', pct + '%');
}
function showError(m) { $('errorMsg').textContent = m; $('errorMsg').hidden = false; }
function hideError() { $('errorMsg').hidden = true; }

paintRange($('gainRange'));