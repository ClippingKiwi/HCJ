'use strict';

const WORDS = ['lorem','ipsum','dolor','sit','amet','consectetur','adipiscing','elit','sed','do',
  'eiusmod','tempor','incididunt','ut','labore','et','dolore','magna','aliqua','enim','ad','minim',
  'veniam','quis','nostrud','exercitation','ullamco','laboris','nisi','aliquip','ex','ea','commodo',
  'consequat','duis','aute','irure','in','reprehenderit','voluptate','velit','esse','cillum','eu',
  'fugiat','nulla','pariatur','excepteur','sint','occaecat','cupidatat','non','proident','sunt',
  'culpa','qui','officia','deserunt','mollit','anim','id','est','laborum','perspiciatis','unde',
  'omnis','iste','natus','error','voluptatem','accusantium','doloremque','laudantium','totam','rem',
  'aperiam','eaque','ipsa','quae','ab','illo','inventore','veritatis','quasi','architecto','beatae',
  'vitae','dicta','explicabo','nemo','ipsam','voluptas','aspernatur','aut','odit','fugit'];

const CLASSIC = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit';

const $ = (id) => document.getElementById(id);
const range = $('lenRange');
const output = $('output');

const rand = (n) => Math.floor(Math.random() * n);
const pick = (arr) => arr[rand(arr.length)];

/* 요청 길이보다 넉넉하게 문장을 만든 뒤 잘라낸다 */
function buildRaw(minLen, classicStart) {
  let text = classicStart ? CLASSIC : capitalize(pick(WORDS));
  let sinceBreak = text.split(' ').length;

  while (text.length < minLen + 40) {
    const w = pick(WORDS);
    // 6~12 단어마다 문장 종료, 가끔 쉼표
    if (sinceBreak >= 6 + rand(7)) {
      text += '. ' + capitalize(w);
      sinceBreak = 1;
    } else if (sinceBreak >= 4 && rand(9) === 0) {
      text += ', ' + w;
      sinceBreak++;
    } else {
      text += ' ' + w;
      sinceBreak++;
    }
  }
  return text;
}

const capitalize = (w) => w.charAt(0).toUpperCase() + w.slice(1);

function finalize(raw, len, byWord) {
  let out;
  if (byWord) {
    // 목표 길이를 넘지 않는 마지막 단어까지만
    const words = raw.split(' ');
    out = '';
    for (const w of words) {
      if ((out + (out ? ' ' : '') + w).length > len) break;
      out += (out ? ' ' : '') + w;
    }
    if (!out) out = raw.slice(0, len);
  } else {
    out = raw.slice(0, len);
  }
  out = out.replace(/[\s,]+$/, '');
  if (!/[.!?]$/.test(out)) {
    // 정확 모드는 길이 유지를 위해 마지막 글자를 마침표로 치환
    out = byWord ? out + '.' : out.slice(0, -1) + '.';
  }
  return out;
}

let currentRaw = '';

function generate(newSeed = true) {
  const len = Number(range.value);
  const classic = $('startClassic').checked;
  const byWord = $('wordBreak').checked;

  if (newSeed || currentRaw.length < len + 40 || (classic !== currentRaw.startsWith(CLASSIC))) {
    currentRaw = buildRaw(1000, classic);
  }

  const text = finalize(currentRaw, len, byWord);
  output.textContent = text;

  const words = text.trim().split(/\s+/).length;
  const sentences = (text.match(/[.!?]/g) || []).length;
  $('meta').textContent =
    `${text.length.toLocaleString()}자 · ${words.toLocaleString()}단어 · ${sentences}문장`;
}

/* 이벤트 */
range.addEventListener('input', () => {
  $('lenValue').textContent = range.value;
  generate(false);
});

document.querySelectorAll('.chip-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    range.value = btn.dataset.len;
    $('lenValue').textContent = range.value;
    generate(false);
  });
});

$('startClassic').addEventListener('change', () => generate(true));
$('wordBreak').addEventListener('change', () => generate(false));
$('regenBtn').addEventListener('click', () => generate(true));

$('copyBtn').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(output.textContent);
    const btn = $('copyBtn');
    btn.textContent = '✅ 복사됨!';
    setTimeout(() => (btn.textContent = '📋 복사'), 1400);
  } catch {
    alert('복사 권한이 없습니다. 직접 드래그해서 복사해 주세요.');
  }
});

generate(true);