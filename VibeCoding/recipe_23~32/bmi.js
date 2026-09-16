'use strict';

const $ = (id) => document.getElementById(id);

/* 대한비만학회 기준(아시아-태평양) */
const CATEGORIES = [
  { max: 18.5,  name: '저체중',   cls: 'c-under',  desc: '체중이 다소 부족합니다. 균형 잡힌 식사와 근력 운동으로 체중을 늘리는 것이 좋습니다.' },
  { max: 23,    name: '정상',     cls: 'c-normal', desc: '건강한 체중 범위입니다. 지금의 생활 습관을 꾸준히 유지하세요.' },
  { max: 25,    name: '과체중',   cls: 'c-over',   desc: '비만 전 단계입니다. 식습관 점검과 주 3회 이상 유산소 운동을 권장합니다.' },
  { max: 30,    name: '비만',     cls: 'c-obese',  desc: '체중 관리가 필요합니다. 규칙적인 운동과 식단 조절을 시작해 보세요.' },
  { max: Infinity, name: '고도비만', cls: 'c-severe', desc: '건강 위험이 높은 단계입니다. 전문가와 상담 후 체계적인 관리를 권장합니다.' }
];

const getCategory = (bmi) => CATEGORIES.find(c => bmi < c.max);

/* 표준체중: 남 22 / 여 21 (키 m² 기준) */
const STD_BMI = { male: 22, female: 21 };

$('bmiForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const h = parseFloat($('height').value);
  const w = parseFloat($('weight').value);
  const gender = document.querySelector('input[name="gender"]:checked').value;

  if (!h || h < 100 || h > 250) return showError('키를 100~250cm 사이로 입력해 주세요.');
  if (!w || w < 20 || w > 300)  return showError('몸무게를 20~300kg 사이로 입력해 주세요.');

  $('errorMsg').hidden = true;
  calculate(h, w, gender);
});

function showError(msg) {
  $('errorMsg').textContent = msg;
  $('errorMsg').hidden = false;
  $('resultArea').hidden = true;
}

function calculate(heightCm, weight, gender) {
  const m = heightCm / 100;
  const bmi = weight / (m * m);
  const cat = getCategory(bmi);

  $('bmiValue').textContent = bmi.toFixed(1);
  $('bmiStatus').textContent = cat.name;
  $('bmiStatus').className = 'bmi-status ' + cat.cls;
  $('bmiDesc').textContent = cat.desc;

  /* 게이지 핀 위치: BMI 15~40 구간을 0~100%로 매핑 */
  const pct = Math.min(100, Math.max(0, ((bmi - 15) / 25) * 100));
  $('gaugePin').style.left = pct + '%';

  /* 표준체중 & 목표 체중 */
  const stdBmi = STD_BMI[gender];
  const stdWeight = stdBmi * m * m;

  $('stdInfo').textContent =
    `표준체중(100%) = ${stdWeight.toFixed(1)}kg · 기준 BMI ${stdBmi} · 현재 체중 ${weight.toFixed(1)}kg`;

  const targets = [
    { rate: 90,  label: '표준체중의 90%',  note: '마른 편 · 슬림한 체형' },
    { rate: 100, label: '표준체중의 100%', note: '이상 체중 · 가장 권장' },
    { rate: 110, label: '표준체중의 110%', note: '여유 있는 체형 · 허용 범위 상한' }
  ];

  $('targetList').innerHTML = targets.map(t => {
    const target = stdWeight * (t.rate / 100);
    const diff = target - weight;                  // +면 증량, -면 감량
    const abs = Math.abs(diff).toFixed(1);
    const targetBmi = target / (m * m);

    let action, cls;
    if (Math.abs(diff) < 0.05) { action = '이미 도달했습니다 🎉'; cls = 'keep'; }
    else if (diff < 0)         { action = `${abs}kg 감량`;        cls = 'lose'; }
    else                       { action = `${abs}kg 증량`;        cls = 'gain'; }

    return `
      <div class="target-row ${cls}">
        <div class="target-head">
          <span class="target-label">${t.label}</span>
          <span class="target-weight">${target.toFixed(1)}kg</span>
        </div>
        <div class="target-body">
          <span class="target-action">${action}</span>
          <span class="target-note">BMI ${targetBmi.toFixed(1)} · ${t.note}</span>
        </div>
      </div>`;
  }).join('');

  $('resultArea').hidden = false;
  $('resultArea').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/* 엔터 입력 시 바로 계산 */
['height', 'weight'].forEach(id => {
  $(id).addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); $('bmiForm').requestSubmit(); }
  });
});