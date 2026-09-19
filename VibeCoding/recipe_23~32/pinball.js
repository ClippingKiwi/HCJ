'use strict';

const $ = (id) => document.getElementById(id);

/* ── 캔버스 및 보드 규격 ─────────────────── */
const W = 480, H = 530;
const WALL = 14;                  // 외벽 두께

// 발사 레인 (Plunger Lane) 규격
const LANE_W = 34;                // 레인 너비
const LANE_RIGHT = W - WALL;      // 466 (우측 외벽 안쪽)
const LANE_LEFT = LANE_RIGHT - LANE_W; // 432
const DIV_THICK = 8;              // 분리벽 두께
const DIV_X = LANE_LEFT - DIV_THICK; // 424 (메인 필드 우측 경계)
const DIV_TOP = 115;              // 분리벽 상단 시작 Y (이 위는 상단 아치)

// 메인 플레이 필드
const FIELD_LEFT = WALL;          // 14
const FIELD_RIGHT = DIV_X;        // 424 (가용 너비: 410px)
const FIELD_CENTER = (FIELD_LEFT + FIELD_RIGHT) / 2; // 219
const SLOT_TOP = 445;             // 이름 슬롯 시작 Y (높이 85px)

// 물리 상수
const GRAVITY = 0.07;
const RESTITUTION = 0.65;
const MAX_SPEED = 9;
const BALL_R = 9;                 // 구슬 반경

// 플런저 (발사대) 규격
const PLUNGER_X = LANE_LEFT + LANE_W / 2; // 449
const PLUNGER_REST_Y = 472;       // 평상시 위치
const PLUNGER_MAX_Y = 514;        // 최대 당김 위치

const canvas = $('board');
const ctx = canvas.getContext('2d');

(function setupDpr() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
})();

/* ── 사운드 신시사이저 (Web Audio API) ─────── */
let audioCtx = null;
function getAudioCtx() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) audioCtx = new AudioContext();
  }
  if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

function playSound(type) {
  try {
    const ac = getAudioCtx();
    if (!ac) return;
    const now = ac.currentTime;

    if (type === 'launch') {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(340, now + 0.14);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } else if (type === 'bumper') {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(540 + Math.random() * 80, now);
      osc.frequency.exponentialRampToValueAtTime(220, now + 0.18);
      gain.gain.setValueAtTime(0.32, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'peg') {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(700 + Math.random() * 250, now);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(now);
      osc.stop(now + 0.06);
    } else if (type === 'win') {
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = ac.createOscillator();
        const gain = ac.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.09);
        gain.gain.setValueAtTime(0.2, now + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.28);
        osc.connect(gain);
        gain.connect(ac.destination);
        osc.start(now + i * 0.09);
        osc.stop(now + i * 0.09 + 0.3);
      });
    }
  } catch (e) {
    // 오디오 실패 무시
  }
}

/* ── 장애물 구성 (제공 사진 100% 일치) ─────── */

// 1. 최상단 데코 역삼각형 5개 (y=74)
const topTriangles = [
  { x: 52, y: 74 },
  { x: 135.5, y: 74 },
  { x: 219, y: 74 },
  { x: 302.5, y: 74 },
  { x: 386, y: 74 }
];

// 2. 상단 세로 바 4개 (역삼각형들 사이사이, 둥근 캡슐 충돌체)
const guideBars = [
  { x: 93.8, y1: 76, y2: 104, r: 4.5 },
  { x: 177.3, y1: 76, y2: 104, r: 4.5 },
  { x: 260.8, y1: 76, y2: 104, r: 4.5 },
  { x: 344.3, y1: 76, y2: 104, r: 4.5 }
];

// 3. 대형 원형 범퍼 7개 (완벽한 다이아몬드 대칭 배치)
const BUMPER_R = 24;
const bumpers = [
  // 상단 2개 (Row 1)
  { id: 1, x: 136, y: 162, r: BUMPER_R, kick: 1.6, hit: 0 },
  { id: 2, x: 302, y: 162, r: BUMPER_R, kick: 1.6, hit: 0 },

  // 중간 3개 (Row 2: 맨좌, 중앙, 맨우)
  { id: 3, x: 52, y: 232, r: BUMPER_R, kick: 1.6, hit: 0 },
  { id: 4, x: 219, y: 232, r: BUMPER_R, kick: 1.9, hit: 0 },
  { id: 5, x: 386, y: 232, r: BUMPER_R, kick: 1.6, hit: 0 },

  // 하단 2개 (Row 3)
  { id: 6, x: 136, y: 302, r: BUMPER_R, kick: 1.6, hit: 0 },
  { id: 7, x: 302, y: 302, r: BUMPER_R, kick: 1.6, hit: 0 }
];

// 4. 작은 핀(Peg)들
const pegs = [
  // Row 1 위 중앙 핀 1개
  { x: 219, y: 138, r: 5.5 },

  // Row 2: 상단 좌/우 범퍼 바로 아래 핀 2개
  { x: 136, y: 232, r: 5.5 },
  { x: 302, y: 232, r: 5.5 },

  // Row 3: 중앙 범퍼 바로 아래 핀 1개
  { x: 219, y: 302, r: 5.5 },

  // Row 4: 하단 범퍼 아래 핀 4개
  { x: 74, y: 356, r: 5.5 },
  { x: 177, y: 356, r: 5.5 },
  { x: 261, y: 356, r: 5.5 },
  { x: 364, y: 356, r: 5.5 },

  // Row 5: 하단 핀 첫 번째 열 (5개 균등)
  { x: 68, y: 396, r: 5.5 },
  { x: 143, y: 396, r: 5.5 },
  { x: 219, y: 396, r: 5.5 },
  { x: 295, y: 396, r: 5.5 },
  { x: 370, y: 396, r: 5.5 },

  // Row 6: 하단 핀 두 번째 열 (지그재그 5개)
  { x: 105, y: 426, r: 5.5 },
  { x: 168, y: 426, r: 5.5 },
  { x: 219, y: 426, r: 5.5 },
  { x: 270, y: 426, r: 5.5 },
  { x: 333, y: 426, r: 5.5 }
];

// 5. 삼각형 슬링샷 반사판 4개 (좌우 벽 각 2개)
const slingshots = [
  // 좌측 상단 삼각형 (x: 14, y: 332~376, 꼭짓점 x: 40)
  { x1: 14, y1: 332, x2: 40, y2: 354, x3: 14, y3: 376, kick: 1.4, hit: 0 },
  // 좌측 하단 삼각형 (x: 14, y: 404~448, 꼭짓점 x: 40)
  { x1: 14, y1: 404, x2: 40, y2: 426, x3: 14, y3: 448, kick: 1.4, hit: 0 },
  // 우측 상단 삼각형 (x: 424, y: 332~376, 꼭짓점 x: 398)
  { x1: 424, y1: 332, x2: 398, y2: 354, x3: 424, y3: 376, kick: 1.4, hit: 0 },
  // 우측 하단 삼각형 (x: 424, y: 404~448, 꼭짓점 x: 398)
  { x1: 424, y1: 404, x2: 398, y2: 426, x3: 424, y3: 448, kick: 1.4, hit: 0 }
];

/* ── 상태 ──────────────────────────────── */
let names = [];
let ball = null;
let winnerIdx = null;
let flashUntil = 0;
let launchTime = 0;

// 플런저 상태
let plungerPos = PLUNGER_REST_Y; // 현재 플런저 헤드 Y
let isDraggingPlunger = false;
let isCharging = false;          // 스페이스바 또는 버튼 길게 누름 충전 중
let chargeStartTime = 0;
let currentCharge = 0;           // 0 ~ 1
const MAX_CHARGE_MS = 1200;      // 1.2초간 누르면 최대 파워
let autoLaunching = false;
let autoLaunchStart = 0;

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
  const canLaunch = names.length >= 2;
  $('launchBtn').disabled = !canLaunch || (ball && ball.active);
  resetResult();

  // 대기 구슬 위치 초기화
  if (canLaunch && (!ball || !ball.active)) {
    prepareBall();
  } else if (!canLaunch) {
    ball = null;
  }
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

/* ── 구슬 준비 및 발사 ─────────────────── */
function prepareBall() {
  ball = {
    x: PLUNGER_X,
    y: plungerPos - BALL_R,
    vx: 0,
    vy: 0,
    r: BALL_R,
    active: false,
    inField: false,
    trail: []
  };
}

function executeLaunch(powerRatio) {
  if (!ball || ball.active) return;
  const ratio = Math.max(0.0, Math.min(1.0, powerRatio));
  ball.active = true;
  ball.inField = false;

  // 스페이스바를 길게 누른 시간에 비례하여 최소 -8.2에서 최대 -13.0까지 속도 결정
  const minVy = -8.2;
  const maxVy = -13.0;
  ball.vy = minVy + (maxVy - minVy) * ratio;
  ball.vx = (Math.random() - 0.5) * 0.25;

  currentCharge = 0;
  launchTime = performance.now();
  $('launchBtn').disabled = true;
  playSound('launch');
}

function beginCharging() {
  if (names.length < 2) return showError('2명 이상 등록해 주세요.');
  if (ball && ball.active) return;
  if (isCharging) return;
  hideError();
  resetResult();

  prepareBall();
  isCharging = true;
  chargeStartTime = performance.now();
  currentCharge = 0.05;
}

function releaseCharge() {
  if (!isCharging) return;
  isCharging = false;
  const elapsed = performance.now() - chargeStartTime;
  // 누른 시간에 따라 0.05 ~ 1.0 비율 계산 (1.2초 누르면 100% 풀 파워)
  const ratio = Math.max(0.05, Math.min(1.0, elapsed / MAX_CHARGE_MS));
  executeLaunch(ratio);
}

// 스페이스바: 길게 누를수록 발사 속도 증가, 떼면 발사
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && document.activeElement !== $('nameInput')) {
    e.preventDefault();
    if (e.repeat) return; // OS 키 반복 방지
    beginCharging();
  }
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'Space' && document.activeElement !== $('nameInput')) {
    e.preventDefault();
    releaseCharge();
  }
});

// '구슬 발사 🚀' 버튼도 동일하게 누르는 시간에 비례하여 발사
$('launchBtn').addEventListener('mousedown', (e) => {
  e.preventDefault();
  beginCharging();
});
window.addEventListener('mouseup', () => {
  if (isCharging) releaseCharge();
});

// 모바일 터치 대응
$('launchBtn').addEventListener('touchstart', (e) => {
  e.preventDefault();
  beginCharging();
}, { passive: false });
window.addEventListener('touchend', () => {
  if (isCharging) releaseCharge();
});

// 당첨자 제외 후 재추첨 버튼
$('excludeBtn').addEventListener('click', () => {
  if (winnerIdx === null) return;
  names.splice(winnerIdx, 1);
  renderNames();
  if (names.length >= 2) {
    setTimeout(() => {
      prepareBall();
      executeLaunch(0.75); // 적당한 중간 속도로 재추첨
    }, 250);
  }
});

/* ── 마우스/터치 플런저 드래그 ─────────── */
function getCanvasCoords(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = W / rect.width;
  const scaleY = H / rect.height;
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY
  };
}

canvas.addEventListener('mousedown', (e) => {
  const pt = getCanvasCoords(e);
  if (pt.x >= LANE_LEFT - 10 && pt.x <= W && pt.y >= PLUNGER_REST_Y - 20) {
    if (names.length < 2) return showError('2명 이상 등록해 주세요.');
    if (ball && ball.active) return;
    isDraggingPlunger = true;
    autoLaunching = false;
    canvas.style.cursor = 'grabbing';
  }
});

window.addEventListener('mousemove', (e) => {
  if (!isDraggingPlunger) {
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (W / rect.width);
    const y = (e.clientY - rect.top) * (H / rect.height);
    if (x >= LANE_LEFT - 10 && x <= W && y >= PLUNGER_REST_Y - 20 && (!ball || !ball.active)) {
      canvas.style.cursor = 'grab';
    } else {
      canvas.style.cursor = 'default';
    }
    return;
  }
  const pt = getCanvasCoords(e);
  plungerPos = Math.max(PLUNGER_REST_Y, Math.min(PLUNGER_MAX_Y, pt.y));
  if (ball && !ball.active) ball.y = plungerPos - BALL_R;
});

window.addEventListener('mouseup', () => {
  if (!isDraggingPlunger) return;
  isDraggingPlunger = false;
  canvas.style.cursor = 'default';

  const pulledDist = plungerPos - PLUNGER_REST_Y;
  const maxPull = PLUNGER_MAX_Y - PLUNGER_REST_Y;
  const power = pulledDist / maxPull;

  if (power > 0.15) {
    executeLaunch(power);
  }
});

canvas.addEventListener('touchstart', (e) => {
  const pt = getCanvasCoords(e);
  if (pt.x >= LANE_LEFT - 10 && pt.x <= W && pt.y >= PLUNGER_REST_Y - 20) {
    if (names.length < 2) return;
    if (ball && ball.active) return;
    isDraggingPlunger = true;
    autoLaunching = false;
    e.preventDefault();
  }
}, { passive: false });

window.addEventListener('touchmove', (e) => {
  if (!isDraggingPlunger) return;
  const pt = getCanvasCoords(e);
  plungerPos = Math.max(PLUNGER_REST_Y, Math.min(PLUNGER_MAX_Y, pt.y));
  if (ball && !ball.active) ball.y = plungerPos - BALL_R;
  e.preventDefault();
}, { passive: false });

window.addEventListener('touchend', () => {
  if (!isDraggingPlunger) return;
  isDraggingPlunger = false;
  const pulledDist = plungerPos - PLUNGER_REST_Y;
  const maxPull = PLUNGER_MAX_Y - PLUNGER_REST_Y;
  const power = pulledDist / maxPull;
  if (power > 0.15) executeLaunch(power);
});

function resetResult() {
  winnerIdx = null;
  $('winnerBanner').hidden = true;
  $('excludeBtn').disabled = true;
}

/* ── 물리 엔진 및 충돌 판정 ───────────── */

function collideCircle(b, ox, oy, orad, rest, kick = 0) {
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
    if (kick > 0) {
      b.vx += nx * kick + (Math.random() - 0.5) * 1.2;
      b.vy += ny * kick;
    }
  }
  return true;
}

function collideSegment(b, x1, y1, x2, y2, rest, kick = 0) {
  const dx = x2 - x1, dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return false;

  let t = ((b.x - x1) * dx + (b.y - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx, cy = y1 + t * dy;

  return collideCircle(b, cx, cy, 0, rest, kick);
}

function collideTopArch(b) {
  const cx = 240, cy = 155;
  const rx = 226 - b.r, ry = 141 - b.r;
  if (b.y > cy) return;

  const dx = b.x - cx;
  const dy = b.y - cy;
  const distSq = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);

  if (distSq > 1) {
    const scale = 1 / Math.sqrt(distSq);
    b.x = cx + dx * scale;
    b.y = cy + dy * scale;

    let nx = (2 * dx) / (rx * rx);
    let ny = (2 * dy) / (ry * ry);
    const nlen = Math.hypot(nx, ny) || 1;
    nx /= nlen; ny /= nlen;

    const vn = b.vx * nx + b.vy * ny;
    if (vn > 0) {
      b.vx -= (1 + 0.45) * vn * nx;
      b.vy -= (1 + 0.45) * vn * ny;
    }
  }
}

function step() {
  // 스페이스바 / 버튼 누르는 동안 플런저가 아래로 당겨지며 파워 축적
  if (isCharging) {
    const elapsed = performance.now() - chargeStartTime;
    currentCharge = Math.min(1.0, elapsed / MAX_CHARGE_MS);
    plungerPos = PLUNGER_REST_Y + (PLUNGER_MAX_Y - PLUNGER_REST_Y) * currentCharge;
    if (ball && !ball.active) ball.y = plungerPos - BALL_R;
  }

  // 충전 중이거나 드래그 중이 아닐 때 플런저 탄성 복귀
  if (!isDraggingPlunger && !isCharging && !autoLaunching) {
    if (plungerPos > PLUNGER_REST_Y) {
      plungerPos += (PLUNGER_REST_Y - plungerPos) * 0.35;
      if (Math.abs(plungerPos - PLUNGER_REST_Y) < 0.5) plungerPos = PLUNGER_REST_Y;
    }
  }

  if (!ball || !ball.active) return;
  const b = ball;

  b.vy += GRAVITY;
  b.vx *= 0.993;
  b.vx = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, b.vx));
  b.vy = Math.max(-MAX_SPEED, Math.min(MAX_SPEED, b.vy));
  b.x += b.vx;
  b.y += b.vy;

  // 1. 발사 레인에 있을 때
  if (!b.inField) {
    if (b.x + b.r > LANE_RIGHT) {
      b.x = LANE_RIGHT - b.r;
      b.vx = -Math.abs(b.vx) * 0.5;
    }
    if (b.y > DIV_TOP - 4 && b.x - b.r < LANE_LEFT) {
      b.x = LANE_LEFT + b.r;
      b.vx = Math.abs(b.vx) * 0.5;
    }
    if (b.y + b.r > PLUNGER_REST_Y && b.vy > 0) {
      b.y = PLUNGER_REST_Y - b.r;
      b.vy = -Math.abs(b.vy) * 0.4;
    }
    if (b.y < DIV_TOP && b.x < FIELD_RIGHT + 2) {
      b.inField = true;
    }
  }

  // 2. 상단 아치 돔 충돌
  collideTopArch(b);

  // 3. 메인 필드에 들어왔을 때
  if (b.inField) {
    if (b.x + b.r > FIELD_RIGHT && b.y > 60) {
      b.x = FIELD_RIGHT - b.r;
      b.vx = -Math.abs(b.vx) * 0.55;
    }

    if (b.x - b.r < FIELD_LEFT) {
      b.x = FIELD_LEFT + b.r;
      b.vx = Math.abs(b.vx) * 0.55;
    }

    for (const bar of guideBars) {
      if (collideSegment(b, bar.x, bar.y1, bar.x, bar.y2, RESTITUTION)) {
        playSound('peg');
      }
    }

    for (const bp of bumpers) {
      if (collideCircle(b, bp.x, bp.y, bp.r, 0.95, bp.kick)) {
        bp.hit = performance.now();
        playSound('bumper');
      }
    }

    for (const p of pegs) {
      if (collideCircle(b, p.x, p.y, p.r, RESTITUTION)) {
        playSound('peg');
      }
    }

    for (const s of slingshots) {
      let hitAny = false;
      if (collideSegment(b, s.x1, s.y1, s.x2, s.y2, 0.95, s.kick)) hitAny = true;
      if (collideSegment(b, s.x2, s.y2, s.x3, s.y3, 0.95, s.kick)) hitAny = true;
      if (hitAny) {
        s.hit = performance.now();
        playSound('bumper');
      }
    }

    const slotCount = names.length;
    const fieldW = FIELD_RIGHT - FIELD_LEFT;
    const slotW = fieldW / slotCount;

    if (b.y + b.r > SLOT_TOP) {
      for (let i = 1; i < slotCount; i++) {
        collideCircle(b, FIELD_LEFT + i * slotW, SLOT_TOP, 4, 0.4);
      }
      if (b.y > SLOT_TOP + 4) {
        const idx = Math.max(0, Math.min(slotCount - 1, Math.floor((b.x - FIELD_LEFT) / slotW)));
        const pad = Math.min(3, Math.max(1, slotW / 2 - b.r - 1));
        const left = FIELD_LEFT + idx * slotW + pad;
        const right = FIELD_LEFT + (idx + 1) * slotW - pad;
        if (b.x - b.r < left) { b.x = left + b.r; b.vx = Math.abs(b.vx) * 0.3; }
        if (b.x + b.r > right) { b.x = right - b.r; b.vx = -Math.abs(b.vx) * 0.3; }
      }
    }
  }

  b.trail.push({ x: b.x, y: b.y });
  if (b.trail.length > 15) b.trail.shift();

  const timeout = performance.now() - launchTime > 18000;
  if (b.inField && (b.y + b.r >= H - 8 || timeout)) {
    const fieldW = FIELD_RIGHT - FIELD_LEFT;
    const slotW = fieldW / names.length;
    const idx = Math.max(0, Math.min(names.length - 1, Math.floor((b.x - FIELD_LEFT) / slotW)));
    finish(idx);
  }
}

function finish(idx) {
  winnerIdx = idx;
  flashUntil = performance.now() + 2500;
  ball = null;
  $('launchBtn').disabled = false;
  $('excludeBtn').disabled = names.length <= 2;
  playSound('win');

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

  if (names.length >= 2) {
    setTimeout(prepareBall, 1200);
  }
}

/* ── 렌더링 ────────────────────────────── */
function draw(now) {
  ctx.clearRect(0, 0, W, H);

  // 1. 배경
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#121630');
  bg.addColorStop(0.6, '#0c0f22');
  bg.addColorStop(1, '#070914');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  ctx.fillStyle = 'rgba(124, 108, 255, 0.05)';
  ctx.fillRect(LANE_LEFT, DIV_TOP, LANE_W, H - DIV_TOP);

  // 2. 상단 둥근 아치 프레임 그리기
  drawArchFrame();

  // 3. 발사 레인 분리벽 및 화살표 가이드
  drawPlungerLane(now);

  // 4. 최상단 데코 역삼각형 & 세로 바
  drawTopDecor();

  // 5. 슬링샷 삼각형 반사판 (4개)
  drawSlingshots(now);

  // 6. 대형 범퍼 7개 (중앙 '1' 번호 포함)
  drawBumpers(now);

  // 7. 작은 핀(Peg)들
  drawPegs();

  // 8. 하단 이름 슬롯
  drawSlots(now);

  // 9. 스프링 플런저 (하단 밀대)
  drawPlunger();

  // 10. 구슬
  drawBall();
}

function drawArchFrame() {
  ctx.save();
  ctx.strokeStyle = 'rgba(124, 108, 255, 0.35)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(240, 155, 226, 141, 0, Math.PI, 0, false);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(WALL, 155);
  ctx.lineTo(WALL, H);
  ctx.moveTo(LANE_RIGHT, 155);
  ctx.lineTo(LANE_RIGHT, H);
  ctx.stroke();
  ctx.restore();
}

function drawPlungerLane(now) {
  ctx.save();
  const grad = ctx.createLinearGradient(DIV_X, 0, DIV_X + DIV_THICK, 0);
  grad.addColorStop(0, 'rgba(124, 108, 255, 0.5)');
  grad.addColorStop(0.5, 'rgba(56, 214, 198, 0.7)');
  grad.addColorStop(1, 'rgba(124, 108, 255, 0.4)');
  ctx.fillStyle = grad;

  ctx.beginPath();
  ctx.roundRect(DIV_X, DIV_TOP, DIV_THICK, H - DIV_TOP, [4, 4, 0, 0]);
  ctx.fill();

  ctx.fillStyle = '#38d6c6';
  ctx.beginPath();
  ctx.arc(DIV_X + DIV_THICK / 2, DIV_TOP, DIV_THICK / 2 + 1, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const arrowYs = [170, 210, 250, 290, 330];
  arrowYs.forEach((ay, idx) => {
    const pulse = Math.sin((now / 180) - idx * 0.7) * 0.5 + 0.5;
    ctx.strokeStyle = `rgba(56, 214, 198, ${0.12 + pulse * 0.28})`;
    ctx.beginPath();
    ctx.moveTo(PLUNGER_X - 7, ay + 5);
    ctx.lineTo(PLUNGER_X, ay - 3);
    ctx.lineTo(PLUNGER_X + 7, ay + 5);
    ctx.stroke();
  });

  ctx.strokeStyle = 'rgba(255, 209, 102, 0.6)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(DIV_X + DIV_THICK, DIV_TOP - 12);
  ctx.lineTo(DIV_X - 10, DIV_TOP - 22);
  ctx.stroke();
  ctx.restore();
}

function drawTopDecor() {
  ctx.save();
  ctx.fillStyle = 'rgba(255, 209, 102, 0.65)';
  topTriangles.forEach(t => {
    ctx.beginPath();
    ctx.moveTo(t.x - 7, t.y);
    ctx.lineTo(t.x + 7, t.y);
    ctx.lineTo(t.x, t.y + 10);
    ctx.closePath();
    ctx.fill();
  });

  guideBars.forEach(bar => {
    ctx.fillStyle = 'rgba(255, 159, 104, 0.85)';
    ctx.shadowColor = 'rgba(255, 159, 104, 0.4)';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.roundRect(bar.x - bar.r, bar.y1, bar.r * 2, bar.y2 - bar.y1, bar.r);
    ctx.fill();
  });
  ctx.restore();
}

function drawSlingshots(now) {
  slingshots.forEach(s => {
    const isHot = s.hit && (now - s.hit < 260);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(s.x1, s.y1);
    ctx.lineTo(s.x2, s.y2);
    ctx.lineTo(s.x3, s.y3);
    ctx.closePath();

    ctx.fillStyle = isHot ? '#fff' : 'rgba(255, 184, 108, 0.85)';
    ctx.shadowColor = isHot ? '#fff' : 'rgba(255, 184, 108, 0.5)';
    ctx.shadowBlur = isHot ? 16 : 8;
    ctx.fill();

    ctx.strokeStyle = isHot ? '#38d6c6' : 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();
  });
}

function drawBumpers(now) {
  bumpers.forEach(bp => {
    const isHot = bp.hit && (now - bp.hit < 280);
    const expand = isHot ? Math.sin((now - bp.hit) / 280 * Math.PI) * 4 : 0;
    const r = bp.r + expand;

    ctx.save();
    if (isHot) {
      const ringR = r + (now - bp.hit) * 0.12;
      const alpha = 1 - (now - bp.hit) / 280;
      ctx.strokeStyle = `rgba(56, 214, 198, ${alpha * 0.9})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(bp.x, bp.y, ringR, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.fillStyle = isHot ? '#ffffff' : '#f5a623';
    ctx.beginPath();
    ctx.arc(bp.x, bp.y, r, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = isHot ? '#7c6cff' : '#22326e';
    ctx.beginPath();
    ctx.arc(bp.x, bp.y, r - 3.5, 0, Math.PI * 2);
    ctx.fill();

    const coreGrad = ctx.createRadialGradient(bp.x - 2, bp.y - 2, 1, bp.x, bp.y, r - 6);
    coreGrad.addColorStop(0, '#fffbf0');
    coreGrad.addColorStop(0.7, isHot ? '#ffeaa7' : '#ffd166');
    coreGrad.addColorStop(1, '#f39c12');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(bp.x, bp.y, r - 7, 0, Math.PI * 2);
    ctx.fill();

    // 중앙 코어 악센트 (숫자 1 제거)
    ctx.fillStyle = isHot ? '#ffffff' : '#ffd166';
    ctx.beginPath();
    ctx.arc(bp.x, bp.y, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  });
}

function drawPegs() {
  pegs.forEach(p => {
    ctx.save();
    const g = ctx.createRadialGradient(p.x - 1.5, p.y - 1.5, 0.5, p.x, p.y, p.r);
    g.addColorStop(0, '#ffffff');
    g.addColorStop(0.5, '#f39c12');
    g.addColorStop(1, '#8c5307');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

function drawSlots(now) {
  if (!names.length) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.font = '600 14px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('참가자 이름을 먼저 등록해 주세요', FIELD_CENTER, SLOT_TOP + 45);
    return;
  }

  const slotCount = names.length;
  const fieldW = FIELD_RIGHT - FIELD_LEFT;
  const slotW = fieldW / slotCount;
  const flashing = now < flashUntil;

  for (let i = 0; i < slotCount; i++) {
    const isWin = winnerIdx === i;
    const alpha = isWin && flashing ? 0.38 + Math.sin(now / 90) * 0.22 : 0.12;
    ctx.fillStyle = isWin ? `rgba(56, 214, 198, ${alpha})` : `rgba(255, 255, 255, ${i % 2 ? 0.05 : 0.08})`;
    ctx.fillRect(FIELD_LEFT + i * slotW, SLOT_TOP, slotW, H - SLOT_TOP);

    if (i > 0) {
      ctx.fillStyle = 'rgba(124, 108, 255, 0.85)';
      ctx.fillRect(FIELD_LEFT + i * slotW - 2, SLOT_TOP, 4, H - SLOT_TOP);
      ctx.beginPath();
      ctx.arc(FIELD_LEFT + i * slotW, SLOT_TOP, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.save();
    ctx.translate(FIELD_LEFT + i * slotW + slotW / 2, SLOT_TOP + (H - SLOT_TOP) / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = isWin ? '800 16px system-ui, sans-serif' : '600 14px system-ui, sans-serif';
    ctx.fillStyle = isWin ? '#38d6c6' : 'rgba(255, 255, 255, 0.85)';
    const displayName = names[i].length > 5 ? names[i].slice(0, 5) + '…' : names[i];
    ctx.fillText(displayName, 0, 0);
    ctx.restore();
  }

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(FIELD_LEFT, SLOT_TOP);
  ctx.lineTo(FIELD_RIGHT, SLOT_TOP);
  ctx.stroke();
}

function drawPlunger() {
  ctx.save();
  const px = PLUNGER_X;
  const py = plungerPos;

  const springTop = py + 12;
  const springBottom = H - 6;
  const coils = 9;
  const stepY = (springBottom - springTop) / coils;

  ctx.strokeStyle = '#9aa0c0';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(px, springBottom);
  for (let i = 0; i < coils; i++) {
    const y1 = springBottom - i * stepY;
    const y2 = y1 - stepY / 2;
    const offset = (i % 2 === 0 ? 1 : -1) * 7;
    ctx.lineTo(px + offset, y2);
    ctx.lineTo(px, y1 - stepY);
  }
  ctx.stroke();

  const blockW = 28, blockH = 20;
  const grad = ctx.createLinearGradient(px - blockW / 2, py - blockH / 2, px + blockW / 2, py + blockH / 2);
  grad.addColorStop(0, '#5dd471');
  grad.addColorStop(1, '#2ba84a');
  ctx.fillStyle = grad;
  ctx.shadowColor = 'rgba(43, 168, 74, 0.5)';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.roundRect(px - blockW / 2, py - blockH / 2, blockW, blockH, 6);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.lineWidth = 2;
  [-4, 0, 4].forEach(offset => {
    ctx.beginPath();
    ctx.moveTo(px - 7, py + offset);
    ctx.lineTo(px + 7, py + offset);
    ctx.stroke();
  });

  // 파워 충전 게이지 바 (스페이스바 충전 중이거나 플런저 드래그 중일 때 표시)
  let chargeRatio = 0;
  if (isCharging) {
    chargeRatio = currentCharge;
  } else if (isDraggingPlunger) {
    const pulledDist = plungerPos - PLUNGER_REST_Y;
    const maxPull = PLUNGER_MAX_Y - PLUNGER_REST_Y;
    chargeRatio = Math.max(0, Math.min(1.0, pulledDist / maxPull));
  }

  if (chargeRatio > 0.02) {
    const gw = 8, gh = 68;
    const gx = LANE_LEFT - 14;
    const gy = 370;

    ctx.fillStyle = 'rgba(10, 12, 26, 0.85)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(gx, gy, gw, gh, 5);
    ctx.fill();
    ctx.stroke();

    const fillH = (gh - 4) * chargeRatio;
    const isMax = chargeRatio >= 0.98;
    const barGrad = ctx.createLinearGradient(0, gy + gh, 0, gy);
    barGrad.addColorStop(0, '#38d6c6');
    barGrad.addColorStop(0.6, '#ffd166');
    barGrad.addColorStop(1, isMax ? '#ff4757' : '#ff76ac');

    ctx.fillStyle = barGrad;
    ctx.shadowColor = isMax ? '#ff4757' : '#ffd166';
    ctx.shadowBlur = isMax ? 10 : 5;
    ctx.beginPath();
    ctx.roundRect(gx + 2, gy + gh - 2 - fillH, gw - 4, fillH, 3);
    ctx.fill();

    ctx.save();
    ctx.font = '800 11px system-ui, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillStyle = isMax ? '#ff4757' : '#ffd166';
    ctx.shadowBlur = 4;
    ctx.fillText(isMax ? 'MAX!' : `${Math.round(chargeRatio * 100)}%`, gx - 3, gy + gh - 4);
    ctx.restore();
  }

  ctx.restore();
}

function drawBall() {
  if (!ball) return;
  const b = ball;

  if (b.active && b.trail.length > 1) {
    b.trail.forEach((t, i) => {
      const alpha = (i / b.trail.length) * 0.4;
      ctx.fillStyle = `rgba(255, 107, 181, ${alpha})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, b.r * (i / b.trail.length) * 0.85, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  ctx.save();
  const g = ctx.createRadialGradient(b.x - 2.5, b.y - 2.5, 1, b.x, b.y, b.r);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.3, '#ff76ac');
  g.addColorStop(0.8, '#d63384');
  g.addColorStop(1, '#7a0e44');
  ctx.fillStyle = g;
  ctx.shadowColor = 'rgba(255, 118, 172, 0.6)';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/* ── 애니메이션 루프 ───────────────────── */
function loop(now) {
  for (let i = 0; i < 2; i++) step();
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
