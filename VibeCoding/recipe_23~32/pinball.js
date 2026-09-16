'use strict';

const $ = (id) => document.getElementById(id);

/* ── 보드 설정 ─────────────────────────── */
const W = 480, H = 430;
const WALL = 14;
const PEG_TOP = 132, ROW_GAP = 38, PEG_ROWS = 5, PEG_R = 6;   // 9줄 → 5줄
const SLOT_TOP = 330;                                          // 이름 칸 높이 100px
const GRAVITY = 0.15, RESTITUTION = 0.65, MAX_SPEED = 10;

const canvas = $('board');
const ctx = canvas.getContext('2d');

(function setupDpr() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
})();

/* ── 범퍼 : M자 배치 (5개) ─────────────── */
/* x좌표를 모두 다르게 두어 어떤 두 범퍼도 같은 수직선에 놓이지 않음 */
const bumpers = [
  { x:  72, y: 288, r: 15, rest: 1.02, kick: 3.0 },   // ① M 왼쪽 아래 끝
  { x: 149, y: 166, r: 16, rest: 1.00, kick: 2.4 },   // ② M 왼쪽 봉우리
  { x: 250, y: 236, r: 15, rest: 1.03, kick: 3.2 },   // ③ M 가운데 골짜기
  { x: 336, y: 166, r: 16, rest: 1.00, kick: 2.4 },   // ④ M 오른쪽 봉우리
  { x: 413, y: 288, r: 15, rest: 1.02, kick: 3.0 }    // ⑤ M 오른쪽 아래 끝
];

/* ── 장애물 생성 ───────────────────────── */
const pegs = [];
(function buildPegs() {
  const cols = 6;                                  // 7 → 6
  const usable = W - WALL * 2 - 30;
  const gap = usable / (cols - 1);
  for (let r = 0; r < PEG_ROWS; r++) {
    const odd = r % 2 === 1;
    const count = odd ? cols - 1 : cols;
    const offset = odd ? gap / 2 : 0;
    for (let i = 0; i < count; i++) {
      const x = WALL + 15 + offset + i * gap;
      const y = PEG_TOP + r * ROW_GAP;
      // 범퍼와 겹치는 핀은 제외
      if (bumpers.some(b => Math.hypot(x - b.x, y - b.y) < b.r + PEG_R + 6)) continue;
      pegs.push({ x, y, r: PEG_R });
    }
  }
})();

/* ── 상태 ──────────────────────────────── */
let names = [];
let ball = null;
let winnerIdx = null;
let flashUntil = 0;
let launchTime = 0;
let plunger = 0;               // 발사 장치 애니메이션 (0~1)

/* ── 이름 관리 ─────────────────────────── */
function addNames(raw) {
  const parts = raw.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
  let added = 0, dup = 0;
  for (const p of parts) {
    if (names.length >= 12) return showError('최대 12명까지 등록할 수 있습니다.');
    if (names.includes(p)) { dup++; continue; }
    names.push(p.slice(0, 12));
    added++;
  }
  if (dup) showError(`중복된 이름 ${dup}개는 제외했습니다.`);
  else if (added) hideError();
  renderNames();
}

function renderNames() {
  $('nameChips').innerHTML = names.map((n, i) => `
    <li class="chip-name">
      <span>${escapeHtml(n)}</span>
      <button type="button" class="chip-x" data-i="${i}" aria-label="삭제">✕</button>
    </li>`).join('');
  $('nameCount').textContent = `${names.length}명 등록됨`;
  $('launchBtn').disabled = names.length < 2;
  resetResult();
}

$('addBtn').addEventListener('click', () => {
  addNames($('nameInput').value);
  $('nameInput').value = '';
  $('nameInput').focus();
});
$('nameInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); $('addBtn').click(); }
});
$('nameChips').addEventListener('click', (e) => {
  const btn = e.target.closest('.chip-x');
  if (!btn) return;
  names.splice(Number(btn.dataset.i), 1);
  renderNames();
});
$('clearBtn').addEventListener('click', () => { names = []; renderNames(); });
$('sampleBtn').addEventListener('click', () => {
  names = ['김지우', '박서준', '이하늘', '최민수', '정유진', '한도윤'];
  renderNames();
});

/* ── 발사 ──────────────────────────────── */
$('launchBtn').addEventListener('click', launch);
$('excludeBtn').addEventListener('click', () => {
  if (winnerIdx === null) return;
  names.splice(winnerIdx, 1);
  renderNames();
  if (names.length >= 2) setTimeout(launch, 250);
});

function launch() {
  if (names.length < 2) return showError('2명 이상 등록해 주세요.');
  hideError();
  resetResult();
  plunger = 1;
  ball = {
    x: W / 2 + (Math.random() * 2 - 1) * 45,
    y: 52,
    vx: (Math.random() * 2 - 1) * 2.4,
    vy: 1.6,
    r: 14,
    trail: []
  };
  launchTime = performance.now();
  $('launchBtn').disabled = true;
}

function resetResult() {
  winnerIdx = null;
  $('winnerBanner').hidden = true;
  $('excludeBtn').disabled = true;
}

/* ── 물리 ──────────────────────────────── */
function collideCircle(b, ox, oy, orad, rest) {
  const dx = b.x - ox, dy = b.y - oy;
  const dist = Math.hypot(dx, dy) || 0.0001;
  const min = b.r + orad;
  if (dist >= min) return false;

  const nx = dx / dist, ny = dy / dist;
  b.x = ox + nx * min;
  b.y = oy + ny * min;

  const vn = b.vx * nx + b.vy * ny;
  if (vn < 0) {
    b.vx -= (1 + rest) * vn * nx;
    b.vy -= (1 + rest) * vn * ny;
    b.vx += (Math.random() - 0.5) * 0.9;   // 미세한 랜덤성
  }
  return true;
}

function step() {
  if (!ball) return;
  const b = ball;
  const slotW = W / names.length;

  b.vy += GRAVITY;
  b.vx *= 0.999;
  b.vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, b.vx));
  b.vy = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, b.vy));
  b.x += b.vx;
  b.y += b.vy;

  // 좌우 벽
  if (b.x - b.r < WALL)     { b.x = WALL + b.r;     b.vx = Math.abs(b.vx) * 0.7; }
  if (b.x + b.r > W - WALL) { b.x = W - WALL - b.r; b.vx = -Math.abs(b.vx) * 0.7; }

  // 핀 · 범퍼
  for (const p of pegs) collideCircle(b, p.x, p.y, p.r, RESTITUTION);
  for (const bp of bumpers) {
    if (collideCircle(b, bp.x, bp.y, bp.r, bp.rest ?? 0.92)) {
      bp.hit = performance.now();
      if (bp.kick && b.vy > 0) b.vy -= bp.kick;        // 위로 걷어차기
      b.vx += (Math.random() - 0.5) * 1.6;             // 좌우 산포 강화
    }
  }

  // 슬롯 구간
  if (b.y + b.r > SLOT_TOP) {
    const pad = Math.min(4, Math.max(1, slotW / 2 - b.r - 1));   // 칸 폭에 맞춰 여백 자동 조절
    for (let i = 1; i < names.length; i++) {
      collideCircle(b, i * slotW, SLOT_TOP, 4, 0.4);
    }
    if (b.y > SLOT_TOP + 6) {
      const idx = Math.max(0, Math.min(names.length - 1, Math.floor(b.x / slotW)));
      const left = idx * slotW + pad, right = (idx + 1) * slotW - pad;
      if (b.x - b.r < left)  { b.x = left + b.r;  b.vx = Math.abs(b.vx) * 0.3; }
      if (b.x + b.r > right) { b.x = right - b.r; b.vx = -Math.abs(b.vx) * 0.3; }
    }
  }

  // 트레일
  b.trail.push({ x: b.x, y: b.y });
  if (b.trail.length > 14) b.trail.shift();

  // 골인 판정
  const timeout = performance.now() - launchTime > 15000;
  if (b.y + b.r >= H - 8 || timeout) {
    const idx = Math.max(0, Math.min(names.length - 1, Math.floor(b.x / slotW)));
    finish(idx);
  }
}

function finish(idx) {
  winnerIdx = idx;
  flashUntil = performance.now() + 2200;
  ball = null;
  $('launchBtn').disabled = false;
  $('excludeBtn').disabled = names.length <= 2;

  $('winnerName').textContent = names[idx];
  const banner = $('winnerBanner');
  banner.hidden = false;
  banner.classList.remove('pop');
  void banner.offsetWidth;
  banner.classList.add('pop');

  const li = document.createElement('li');
  li.textContent = `${names[idx]} · ${new Date().toLocaleTimeString('ko-KR')}`;
  $('historyList').prepend(li);
  $('historyPanel').hidden = false;
}

/* ── 렌더링 ────────────────────────────── */
function draw(now) {
  ctx.clearRect(0, 0, W, H);

  // 배경
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#141733');
  bg.addColorStop(1, '#0a0c1a');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 좌우 벽
  ctx.fillStyle = 'rgba(124,108,255,.25)';
  ctx.fillRect(0, 0, WALL, H);
  ctx.fillRect(W - WALL, 0, WALL, H);

  // 발사구
  plunger = Math.max(0, plunger - 0.04);
  ctx.strokeStyle = 'rgba(255,255,255,.18)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 60, 30 + plunger * 6);
  ctx.lineTo(W / 2 + 60, 30 + plunger * 6);
  ctx.stroke();

  // 범퍼
  for (const bp of bumpers) {
    const hot = bp.hit && now - bp.hit < 260;
    const g = ctx.createRadialGradient(bp.x, bp.y, 2, bp.x, bp.y, bp.r + 6);
    g.addColorStop(0, hot ? '#fff' : '#38d6c6');
    g.addColorStop(1, hot ? 'rgba(255,209,102,.7)' : 'rgba(56,214,198,.08)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(bp.x, bp.y, bp.r + (hot ? 4 : 0), 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = hot ? 'rgba(255,255,255,.95)' : 'rgba(56,214,198,.55)';
    ctx.lineWidth = hot ? 3 : 2;
    ctx.beginPath();
    ctx.arc(bp.x, bp.y, bp.r, 0, Math.PI * 2);
    ctx.stroke();
  }

  // 핀
  for (const p of pegs) {
    ctx.fillStyle = 'rgba(255,255,255,.75)';
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
  }

  drawSlots(now);

  // 구슬
  if (ball) {
    ball.trail.forEach((t, i) => {
      ctx.fillStyle = `rgba(255,209,102,${(i / ball.trail.length) * 0.35})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, ball.r * (i / ball.trail.length) * 0.9, 0, Math.PI * 2);
      ctx.fill();
    });
    const g = ctx.createRadialGradient(ball.x - 3, ball.y - 3, 1, ball.x, ball.y, ball.r);
    g.addColorStop(0, '#fff');
    g.addColorStop(1, '#ff9f68');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSlots(now) {
  if (!names.length) {
    ctx.fillStyle = 'rgba(255,255,255,.35)';
    ctx.font = '600 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('참가자 이름을 먼저 등록해 주세요', W / 2, SLOT_TOP + 55);
    return;
  }

  const slotW = W / names.length;
  const flashing = now < flashUntil;

  for (let i = 0; i < names.length; i++) {
    const isWin = winnerIdx === i;
    const alpha = isWin && flashing ? 0.35 + Math.sin(now / 90) * 0.2 : 0.12;
    ctx.fillStyle = isWin ? `rgba(56,214,198,${alpha})` : `rgba(255,255,255,${i % 2 ? 0.05 : 0.08})`;
    ctx.fillRect(i * slotW, SLOT_TOP, slotW, H - SLOT_TOP);

    // 칸막이
    if (i > 0) {
      ctx.fillStyle = 'rgba(124,108,255,.85)';
      ctx.fillRect(i * slotW - 2, SLOT_TOP, 4, H - SLOT_TOP);
      ctx.beginPath();
      ctx.arc(i * slotW, SLOT_TOP, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 세로 이름
    ctx.save();
    ctx.translate(i * slotW + slotW / 2, SLOT_TOP + (H - SLOT_TOP) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = isWin ? '800 17px system-ui, sans-serif' : '600 15px system-ui, sans-serif';
    ctx.fillStyle = isWin ? '#38d6c6' : 'rgba(255,255,255,.8)';
    ctx.fillText(names[i].length > 5 ? names[i].slice(0, 5) + '…' : names[i], 0, 0);
    ctx.restore();
  }

  // 슬롯 상단 구분선
  ctx.strokeStyle = 'rgba(255,255,255,.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, SLOT_TOP);
  ctx.lineTo(W, SLOT_TOP);
  ctx.stroke();
}

/* ── 루프 ──────────────────────────────── */
function loop(now) {
  for (let i = 0; i < 4; i++) step();    // 서브스텝으로 관통 방지
  draw(now);
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

/* ── 유틸 ──────────────────────────────── */
function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function showError(m) { $('errorMsg').textContent = m; $('errorMsg').hidden = false; }
function hideError() { $('errorMsg').hidden = true; }

renderNames();