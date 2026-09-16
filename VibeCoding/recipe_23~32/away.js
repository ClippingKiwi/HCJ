'use strict';

const $ = (id) => document.getElementById(id);

const screenEl = $('awayScreen');
const pwModal  = $('pwModal');

let state = { password: '', startAt: 0, returnAt: 0, timerId: null, locked: false };

/* ── 초기값: 현재 시각 + 30분 ───────────── */
const pad = (n) => String(n).padStart(2, '0');
const toInputValue = (d) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

function setReturnAfter(minutes) {
  $('returnAt').value = toInputValue(new Date(Date.now() + minutes * 60000));
}
setReturnAfter(30);

$('quickRow').addEventListener('click', (e) => {
  const btn = e.target.closest('.chip-btn');
  if (btn) setReturnAfter(Number(btn.dataset.min));
});

$('togglePw').addEventListener('click', () => {
  const input = $('password');
  const isPw = input.type === 'password';
  input.type = isPw ? 'text' : 'password';
  $('togglePw').textContent = isPw ? '숨기기' : '보기';
});

/* ── 안내판 켜기 ────────────────────────── */
$('awayForm').addEventListener('submit', (e) => {
  e.preventDefault();

  const schedule = $('schedule').value.trim();
  const returnRaw = $('returnAt').value;
  const memo = $('memo').value.trim();
  const pw = $('password').value;

  if (!schedule)       return showError('일정을 입력해 주세요.');
  if (!returnRaw)      return showError('복귀 예정 시각을 선택해 주세요.');
  if (pw.length < 2)   return showError('비밀번호를 2자 이상 입력해 주세요.');

  const returnAt = new Date(returnRaw).getTime();
  if (Number.isNaN(returnAt)) return showError('복귀 시각 형식이 올바르지 않습니다.');

  $('errorMsg').hidden = true;

  state = { password: pw, startAt: Date.now(), returnAt, timerId: null, locked: true };
  lockScreen(schedule, returnAt, memo);
});

function showError(msg) {
  $('errorMsg').textContent = msg;
  $('errorMsg').hidden = false;
}

function lockScreen(schedule, returnAt, memo) {
  $('oSchedule').textContent = schedule;

  const r = new Date(returnAt);
  const sameDay = r.toDateString() === new Date().toDateString();
  $('oReturn').textContent =
    (sameDay ? '' : `${r.getMonth() + 1}/${r.getDate()} `) + `${pad(r.getHours())}:${pad(r.getMinutes())}`;

  if (memo) { $('oMemo').textContent = memo; $('oMemo').hidden = false; }
  else      { $('oMemo').hidden = true; }

  screenEl.hidden = false;
  document.body.classList.add('locked');

  // 전체화면 시도 (사용자가 거부해도 동작에는 문제 없음)
  document.documentElement.requestFullscreen?.().catch(() => {});

  tick();
  state.timerId = setInterval(tick, 250);

  window.addEventListener('keydown', onKeydown);
  window.addEventListener('beforeunload', onBeforeUnload);
}

/* ── 1초 갱신: 시계 · 카운트다운 · 진행바 ── */
function tick() {
  const now = Date.now();
  const d = new Date(now);
  $('oClock').textContent = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

  const diff = state.returnAt - now;
  const abs = Math.abs(diff);
  const h = Math.floor(abs / 3600000);
  const m = Math.floor((abs % 3600000) / 60000);
  const s = Math.floor((abs % 60000) / 1000);

  if (diff >= 0) {
    $('oCountLabel').textContent = '남은 시간';
    $('oCountdown').textContent = `${pad(h)}:${pad(m)}:${pad(s)}`;
    $('oCountdown').classList.remove('overdue');
  } else {
    $('oCountLabel').textContent = '예정 시각 경과';
    $('oCountdown').textContent = `+${pad(h)}:${pad(m)}:${pad(s)}`;
    $('oCountdown').classList.add('overdue');
  }

  const total = Math.max(1, state.returnAt - state.startAt);
  const pct = Math.min(100, Math.max(0, ((now - state.startAt) / total) * 100));
  $('oProgress').style.width = pct + '%';
}

/* ── 잠금 해제 ─────────────────────────── */
function onKeydown(e) {
  if (!state.locked) return;
  if (e.key === 'Escape') { e.preventDefault(); openPwModal(); }
}
function onBeforeUnload(e) { e.preventDefault(); e.returnValue = ''; }

$('unlockBtn').addEventListener('click', openPwModal);
screenEl.addEventListener('click', (e) => {
  if (e.target === screenEl) openPwModal();   // 배경 클릭
});

function openPwModal() {
  pwModal.hidden = false;
  $('pwError').hidden = true;
  $('pwInput').value = '';
  setTimeout(() => $('pwInput').focus(), 50);
}
function closePwModal() { pwModal.hidden = true; }

$('pwCancel').addEventListener('click', closePwModal);
$('pwSubmit').addEventListener('click', trySubmit);
$('pwInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') trySubmit();
  if (e.key === 'Escape') closePwModal();
  e.stopPropagation();
});

function trySubmit() {
  if ($('pwInput').value === state.password) {
    unlock();
  } else {
    $('pwError').hidden = false;
    $('pwBox').classList.remove('shake');
    void $('pwBox').offsetWidth;          // 리플로우 → 애니메이션 재실행
    $('pwBox').classList.add('shake');
    $('pwInput').select();
  }
}

function unlock() {
  state.locked = false;
  clearInterval(state.timerId);
  window.removeEventListener('keydown', onKeydown);
  window.removeEventListener('beforeunload', onBeforeUnload);

  closePwModal();
  screenEl.hidden = true;
  document.body.classList.remove('locked');
  if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
}