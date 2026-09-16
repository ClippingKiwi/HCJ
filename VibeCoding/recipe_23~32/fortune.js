'use strict';

/* ── 오행 데이터 ───────────────────────── */
const ELEMENTS = {
  fire:  { name: '불',   emoji: '🔥', color: '레드',   trait: '열정과 추진력',
           msgs: ['막혀 있던 일이 시원하게 뚫리는 날입니다. 먼저 손을 내밀면 기회가 따라옵니다.',
                  '에너지가 넘치지만 과열 주의보. 중요한 결정은 오후로 미루면 좋습니다.',
                  '당신의 한마디가 주변 분위기를 바꿉니다. 자신 있게 의견을 내보세요.',
                  '작은 불씨가 큰 성과로 이어집니다. 미뤄둔 일을 오늘 시작하세요.'] },
  water: { name: '물',   emoji: '💧', color: '딥블루', trait: '유연함과 통찰',
           msgs: ['흐름을 거스르지 않으면 원하는 곳에 닿습니다. 오늘은 기다림이 전략입니다.',
                  '뜻밖의 소식이 마음을 적십니다. 감정에 휘둘리지 말고 한 박자 쉬어가세요.',
                  '대화 속에서 해답을 찾습니다. 오랜만에 연락 오는 사람을 반겨주세요.',
                  '직관이 유난히 맑은 날. 처음 떠오른 선택이 정답일 확률이 높습니다.'] },
  wood:  { name: '나무', emoji: '🌳', color: '포레스트그린', trait: '성장과 인내',
           msgs: ['천천히 그러나 확실하게 자라는 하루. 꾸준함이 곧 실력이 됩니다.',
                  '누군가에게 든든한 그늘이 되어주는 날입니다. 베푼 만큼 돌아옵니다.',
                  '새로운 배움을 시작하기 좋은 시기. 오늘 심은 씨앗이 이번 달을 바꿉니다.',
                  '조급함만 내려놓으면 모든 게 순조롭습니다. 계획표를 다시 점검해보세요.'] },
  earth: { name: '땅',   emoji: '⛰️', color: '테라코타', trait: '안정과 신뢰',
           msgs: ['흔들리지 않는 중심이 빛을 발합니다. 주변의 소음은 잠시 꺼두세요.',
                  '금전 관리에 좋은 날입니다. 지출 계획을 세우면 큰 이득이 생깁니다.',
                  '오래 이어온 관계에서 좋은 소식이 옵니다. 신뢰를 보여주세요.',
                  '기초를 다질수록 유리합니다. 서두르기보다 점검이 필요한 하루.'] },
  wind:  { name: '바람', emoji: '🌬️', color: '스카이블루', trait: '변화와 자유',
           msgs: ['예상 밖의 전개가 오히려 행운입니다. 계획 변경을 두려워하지 마세요.',
                  '새로운 인연이 스쳐 지나갑니다. 가벼운 인사가 큰 연결이 됩니다.',
                  '이동수가 있는 날. 평소 가지 않던 길에 좋은 기운이 있습니다.',
                  '생각이 많아지는 하루. 산책 한 번이 복잡한 머리를 정리해 줍니다.'] }
};

const LUCKY_ITEMS = ['텀블러', '무선 이어폰', '손목시계', '가죽 지갑', '향수', '검은 볼펜',
                     '작은 화분', '머그컵', '에코백', '립밤', '스티커', '노트'];
const ADVICES = ['오늘 하루, 스스로에게 관대해지세요.', '작게 시작하는 것이 가장 빠른 길입니다.',
                 '말보다 행동이 신뢰를 만듭니다.', '휴식도 계획의 일부입니다.',
                 '비교는 줄이고 기록은 늘리세요.', '감사 인사 한마디가 하루를 바꿉니다.'];

/* ── 시드 기반 난수 (같은 날 = 같은 결과) ── */
function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];
const range = (rand, min, max) => Math.floor(rand() * (max - min + 1)) + min;

/* ── DOM ──────────────────────────────── */
const form = document.getElementById('fortuneForm');
const grid = document.getElementById('elementGrid');
const errorMsg = document.getElementById('errorMsg');
const resultBox = document.getElementById('result');
let selectedElement = null;

grid.addEventListener('click', (e) => {
  const btn = e.target.closest('.element');
  if (!btn) return;
  grid.querySelectorAll('.element').forEach(el => el.classList.remove('active'));
  btn.classList.add('active');
  selectedElement = btn.dataset.element;
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const birth = document.getElementById('birth').value;
  const gender = document.querySelector('input[name="gender"]:checked').value;

  if (!name)             return showError('이름을 입력해 주세요.');
  if (!birth)            return showError('생일을 선택해 주세요.');
  if (!selectedElement)  return showError('오늘의 기운을 하나 선택해 주세요.');

  errorMsg.hidden = true;
  renderFortune({ name, birth, gender, element: selectedElement });
});

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.hidden = false;
}

function renderFortune({ name, birth, gender, element }) {
  const today = new Date().toISOString().slice(0, 10);
  const rand = mulberry32(hashSeed(`${name}|${birth}|${gender}|${element}|${today}`));
  const el = ELEMENTS[element];

  const total = range(rand, 45, 100);
  const scores = {
    '애정운':     range(rand, 30, 100),
    '금전운':     range(rand, 30, 100),
    '직장·학업운': range(rand, 30, 100),
    '건강운':     range(rand, 30, 100)
  };

  const grade = total >= 90 ? '대길(大吉)' : total >= 75 ? '길(吉)'
              : total >= 60 ? '중길(中吉)' : total >= 50 ? '소길(小吉)' : '평(平)';

  const bars = Object.entries(scores).map(([k, v]) => `
    <div class="luck-item">
      <span>${k}</span>
      <span class="bar"><i style="width:${v}%"></i></span>
      <b>${v}점</b>
    </div>`).join('');

  resultBox.innerHTML = `
    <div class="fortune-head">
      <div class="fortune-emoji">${el.emoji}</div>
      <h2 class="fortune-title">${name}님의 오늘의 운세</h2>
      <p class="fortune-sub">${today} · ${gender} · ${birth} · ${el.name}의 기운(${el.trait})</p>
      <div class="fortune-score">${total}점 · ${grade}</div>
    </div>

    <p class="fortune-msg">${pick(rand, el.msgs)}</p>

    <div class="luck-list">
      ${bars}
      <div class="luck-item"><span>🎨 행운의 색</span><b>${el.color}</b></div>
      <div class="luck-item"><span>🔢 행운의 숫자</span><b>${range(rand, 1, 45)}</b></div>
      <div class="luck-item"><span>🎁 행운의 아이템</span><b>${pick(rand, LUCKY_ITEMS)}</b></div>
      <div class="luck-item"><span>🧭 행운의 방향</span><b>${pick(rand, ['동쪽','서쪽','남쪽','북쪽'])}</b></div>
      <div class="luck-item"><span>💬 오늘의 조언</span><b>${pick(rand, ADVICES)}</b></div>
    </div>

    <p class="hint" style="margin-top:16px;text-align:center">
      ※ 재미로 보는 운세입니다. 같은 정보라면 오늘 하루 동안 같은 결과가 나옵니다.
    </p>`;

  resultBox.hidden = false;
  resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
}