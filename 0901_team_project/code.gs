/**
 * 자취/독립생활 실태 설문조사
 * - doGet: index.html을 웹페이지로 렌더링
 * - submitForm: 폼 데이터를 구글 스프레드시트에 저장
 */

// ▼▼▼ 아래 URL을 실제 사용할 구글 스프레드시트 주소로 교체하세요 ▼▼▼
var SHEET_URL = 'https://docs.google.com/spreadsheets/d/1yLI2iMB7shR-hvxvOTitINbJwgxsQj_pGMp6XYUZeXc/edit';
// ▲▲▲ 시트 첫 번째 탭 1행에 아래 순서로 헤더를 만들어두세요 ▲▲▲
// 독립기간 | 거주형태 | 월생활비 | 주거비부담도 | 자취애로사항 | 만족도

function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('자취/독립생활 실태 설문조사')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * 클라이언트(index.html)에서 google.script.run으로 호출하는 함수
 * data = {
 *   period, residence, livingCost, burden,
 *   difficulties (배열), satisfaction
 * }
 */
function submitForm(data) {
  try {
    var ss = SpreadsheetApp.openByUrl(SHEET_URL);
    var sheet = ss.getSheets()[0];

    var period = (data.period || '').toString().trim();
    var residence = (data.residence || '').toString().trim();

    if (!period || !residence) {
      throw new Error('필수 항목을 모두 선택해주세요.');
    }

    var difficulties = Array.isArray(data.difficulties)
      ? data.difficulties.join(', ')
      : (data.difficulties || '');

    sheet.appendRow([
      period,
      residence,
      data.livingCost || '',
      data.burden || '',
      difficulties,
      data.satisfaction || ''
    ]);

    return { result: 'success' };
  } catch (err) {
    return { result: 'error', message: err.message };
  }
}
