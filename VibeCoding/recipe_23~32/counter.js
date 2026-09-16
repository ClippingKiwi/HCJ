'use strict';

const input = document.getElementById('input');
const $ = (id) => document.getElementById(id);

/* 한글 판별: 완성형 가·힣, 자모, 호환 자모 */
function isKorean(ch) {
  const c = ch.codePointAt(0);
  return (c >= 0xAC00 && c <= 0xD7A3) ||  // 한글 음절
         (c >= 0x1100 && c <= 0x11FF) ||  // 한글 자모
         (c >= 0x3130 && c <= 0x318F) ||  // 호환용 자모
         (c >= 0xA960 && c <= 0xA97F) ||
         (c >= 0xD7B0 && c <= 0xD7FF);
}

/* 한글 = 2byte, 그 외 = 1byte */
function getKrBytes(text) {
  let bytes = 0;
  for (const ch of text) bytes += isKorean(ch) ? 2 : 1;
  return bytes;
}

function countKorean(text) {
  let k = 0;
  for (const ch of text) if (isKorean(ch)) k++;
  return k;
}

const fmt = (n) => n.toLocaleString('ko-KR');

function update() {
  const text = input.value;
  const chars = [...text];                                  // 이모지 안전 처리
  const noSpace = text.replace(/\s/g, '');
  const spaces = (text.match(/[ \t]/g) || []).length;        // 공백·탭
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const lines = text.split(/\r\n|\r|\n/).length;
  const kor = countKorean(text);

  $('charAll').textContent    = fmt(chars.length);
  $('charNoSpace').textContent = fmt([...noSpace].length);
  $('byteKr').textContent      = fmt(getKrBytes(text));
  $('byteUtf8').textContent    = fmt(new TextEncoder().encode(text).length);
  $('wordCount').textContent   = fmt(words);
  $('spaceCount').textContent  = fmt(spaces);
  $('lineCount').textContent   = fmt(lines);
  $('korRatio').textContent    = `${fmt(kor)} / ${fmt(chars.length - kor)}`;
  $('hint').textContent        = `${fmt(chars.length)}자 입력됨`;
}

input.addEventListener('input', update);

$('clearBtn').addEventListener('click', () => {
  input.value = '';
  update();
  input.focus();
});

$('pasteBtn').addEventListener('click', async () => {
  try {
    input.value += await navigator.clipboard.readText();
    update();
  } catch {
    alert('브라우저에서 붙여넣기 권한이 거부되었습니다. Ctrl+V를 사용해 주세요.');
  }
});

update();