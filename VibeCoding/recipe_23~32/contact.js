'use strict';

/* ⚠️ 여기에 받을 메일 주소를 입력하세요 */
const MAIL_TO = 'answhddn54@gmail.com';

/* 문의 유형별 설정 */
const TYPES = {
  bug: {
    label: '버그 제보',
    prefix: '[버그]',
    placeholder: '어떤 앱에서, 어떤 상황에 문제가 생겼는지 알려주세요.',
    template:
      '· 앱 이름 : \n' +
      '· 사용 환경 : \n' +
      '· 발생 상황 : \n' +
      '· 기대한 동작 : \n'
  },
  idea: {
    label: '앱 제안',
    prefix: '[제안]',
    placeholder: '만들어보고 싶은 앱이나 추가하고 싶은 기능을 적어주세요.',
    template:
      '· 제안하는 앱/기능 : \n' +
      '· 이런 점이 좋아요 : \n' +
      '· 참고할 만한 예시 : \n'
  },
  etc: {
    label: '기타 문의',
    prefix: '[문의]',
    placeholder: '문의 내용을 자유롭게 적어주세요.',
    template: ''
  }
};

const $ = (id) => document.getElementById(id);

const modal = $('mailModal');
const box = $('mailBox');
let lastFocus = null;

$('mailTo').textContent = MAIL_TO;

/* ── 문의 유형 ─────────────────────────── */
$('mailType').addEventListener('change', applyType);

function applyType() {
  const t = TYPES[$('mailType').value] || TYPES.etc;
  const body = $('mailBody');

  body.placeholder = t.placeholder;

  // 비어 있거나 다른 유형의 템플릿만 남아 있을 때 자동 채우기
  const isTemplate = Object.values(TYPES).some(v => v.template && body.value === v.template);
  if (!body.value.trim() || isTemplate) body.value = t.template;

  $('mailSubject').placeholder =
    t.label === '버그 제보' ? '예: 오디오 편집기에서 MP3 저장 실패'
    : t.label === '앱 제안' ? '예: 할 일 목록 앱을 추가해주세요'
    : '예: 사용 방법 문의';
}

/* ── 열기 / 닫기 ────────────────────────── */
$('contactBtn').addEventListener('click', openModal);
$('mailClose').addEventListener('click', closeModal);

modal.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();          // 배경 클릭
});

document.addEventListener('keydown', (e) => {
  if (modal.hidden) return;
  if (e.key === 'Escape') closeModal();
  if (e.key === 'Tab') trapFocus(e);
});

function openModal() {
  lastFocus = document.activeElement;
  modal.hidden = false;
  document.body.classList.add('modal-open');
  $('mailError').hidden = true;
  setTimeout(() => $('mailSubject').focus(), 60);
}

function closeModal() {
  modal.hidden = true;
  document.body.classList.remove('modal-open');
  lastFocus?.focus();
}

/* 모달 안에서만 Tab 순환 */
function trapFocus(e) {
  const items = box.querySelectorAll('button, input, textarea');
  if (!items.length) return;
  const first = items[0], last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

/* ── 메일 보내기 ───────────────────────── */
$('mailSend').addEventListener('click', sendMail);

function sendMail() {
  const subject = $('mailSubject').value.trim();
  const body = $('mailBody').value.trim();

  if (!subject && !body) {
    $('mailError').textContent = '제목이나 내용 중 하나는 입력해 주세요.';
    $('mailError').hidden = false;
    shake();
    return;
  }
  $('mailError').hidden = true;

  const t = TYPES[$('mailType').value] || TYPES.etc;
  const finalSubject = `${t.prefix} ${subject || t.label}`;
  const url = `mailto:${MAIL_TO}`
    + `?subject=${encodeURIComponent(finalSubject)}`
    + `&body=${encodeURIComponent(body)}`;

  // mailto 길이 제한(약 2000자) 초과 시 안내
  if (url.length > 1900) {
    $('mailError').textContent = '내용이 너무 길어요. 줄이거나 주소를 복사해 직접 보내주세요.';
    $('mailError').hidden = false;
    return;
  }

  window.location.href = url;
  flash($('mailSend'), '메일 앱 실행 중…', '메일 앱으로 열기');
}

/* ── 주소 복사 ─────────────────────────── */
$('mailCopy').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(MAIL_TO);
    flash($('mailCopy'), '복사됨 ✓', '주소 복사');
  } catch {
    $('mailError').textContent = '클립보드 접근이 차단되었습니다. 주소를 직접 선택해 복사해 주세요.';
    $('mailError').hidden = false;
  }
});

/* ── 유틸 ──────────────────────────────── */
function shake() {
  box.classList.remove('shake');
  void box.offsetWidth;
  box.classList.add('shake');
}

function flash(btn, on, off) {
  btn.textContent = on;
  btn.disabled = true;
  setTimeout(() => { btn.textContent = off; btn.disabled = false; }, 1400);
}

/* Enter(Ctrl+Enter) 단축키 */
$('mailBody').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) sendMail();
});
$('mailSubject').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); $('mailBody').focus(); }
});

applyType();